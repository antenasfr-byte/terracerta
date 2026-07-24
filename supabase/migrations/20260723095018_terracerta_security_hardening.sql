/*
# TerraCerta — Endurecimento de segurança

## Resumo
Corrige todas as vulnerabilidades de segurança identificadas na auditoria:
impede escalação de privilégios via signup, protege campos sensíveis do
perfil, torna o bucket de fotografias privado, remove políticas que
permitiam auto-alteração de subscrições, adiciona limite de taxa para
a edge function de diagnóstico, e cria uma RPC segura para gestão de
administradores.

## Alterações de segurança
1. `handle_new_user` NÃO lê mais `is_admin` do metadata — sempre `false`.
2. Trigger `protect_profile_fields` impede que utilizadores (não service_role)
   alterem `is_admin` ou `plan` no seu perfil.
3. RPC `set_admin_status` — apenas service_role pode atribuir/remover admin.
4. Bucket `photos` tornado PRIVADO (public = false).
5. Políticas `insert_own_subscription` e `update_own_subscription` removidas —
   subscrições só podem ser criadas/alteradas pelo sistema (service_role).
6. Tabela `diagnosis_rate_limits` para controlo de abuso na edge function.
7. Coluna `model_version` adicionada a `diagnoses` para rastreabilidade.
8. `photos.public_url` passa a ter default '' (deixa de ser usada — URLs assinadas).
9. Utilizador SQL-created admin@terracerta.pt removido de auth.users.

## Notas
1. O trigger `protect_profile_fields` usa `auth.jwt() ->> 'role'` para distinguir
   service_role de utilizadores autenticados.
2. A RPC `set_admin_status` é SECURITY DEFINER e verifica a role do caller.
3. Aremoção do utilizador admin SQL-created é feita com ON DELETE CASCADE no
   perfil associado.
4. O bucket privado exige URLs assinadas temporárias para visualização.
*/

-- ============================================================
-- 1. FIX handle_new_user — always is_admin = false
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, is_admin, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    false,
    'grátis'
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. protect_profile_fields — prevent self-elevation
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    IF auth.jwt() ->> 'role' <> 'service_role' THEN
      RAISE EXCEPTION 'Não tem permissão para alterar o estado de administrador.';
    END IF;
  END IF;
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    IF auth.jwt() ->> 'role' <> 'service_role' THEN
      RAISE EXCEPTION 'Não tem permissão para alterar o plano diretamente.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_fields ON profiles;
CREATE TRIGGER protect_profile_fields
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- ============================================================
-- 3. set_admin_status RPC — service_role only
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_admin_status(target_email text, admin_val boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.jwt() ->> 'role' <> 'service_role' THEN
    RAISE EXCEPTION 'Apenas o administrador do sistema pode alterar permissões.';
  END IF;
  UPDATE public.profiles SET is_admin = admin_val WHERE email = target_email;
END;
$$;

-- ============================================================
-- 4. Make storage bucket PRIVATE
-- ============================================================
UPDATE storage.buckets SET public = false WHERE id = 'photos';

-- ============================================================
-- 5. Remove subscription self-service policies
-- ============================================================
DROP POLICY IF EXISTS "insert_own_subscription" ON subscriptions;
DROP POLICY IF EXISTS "update_own_subscription" ON subscriptions;

-- Keep only SELECT (users can view their own subscription)
-- Inserts/updates now require service_role (bypasses RLS)

-- ============================================================
-- 6. diagnosis_rate_limits table for edge function rate limiting
-- ============================================================
CREATE TABLE IF NOT EXISTS diagnosis_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE diagnosis_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_rate_limits" ON diagnosis_rate_limits;
CREATE POLICY "select_own_rate_limits" ON diagnosis_rate_limits FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_rate_limits" ON diagnosis_rate_limits;
CREATE POLICY "insert_own_rate_limits" ON diagnosis_rate_limits FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_rate_limits" ON diagnosis_rate_limits;
CREATE POLICY "delete_own_rate_limits" ON diagnosis_rate_limits FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_created ON diagnosis_rate_limits(user_id, created_at);

-- ============================================================
-- 7. Add model_version to diagnoses
-- ============================================================
ALTER TABLE diagnoses ADD COLUMN IF NOT EXISTS model_version text NOT NULL DEFAULT '';

-- ============================================================
-- 8. photos.public_url default to empty string (no longer used)
-- ============================================================
ALTER TABLE photos ALTER COLUMN public_url SET DEFAULT '';

-- ============================================================
-- 9. Delete SQL-created admin user from auth.users
-- ============================================================
DELETE FROM auth.users WHERE email = 'admin@terracerta.pt';
