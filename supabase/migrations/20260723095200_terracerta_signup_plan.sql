/*
# TerraCerta — Permitir plano inicial no signup

## Resumo
Atualiza o trigger handle_new_user para ler o plano inicial escolhido pelo
utilizador no momento do registo (armazenado em raw_user_meta_data), com
validação. O trigger protect_profile_fields já impede alterações posteriores
por utilizadores normais — apenas service_role pode mudar o plano depois.

## Alterações
1. handle_new_user agora lê `plan` de raw_user_meta_data, com validação
   (grátis/premium/profissional, default: grátis).
2. O plano só é definido UMA VEZ no INSERT do trigger. Nunca mais pode ser
   alterado pelo utilizador (protect_profile_fields bloqueia UPDATE).
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_plan text;
BEGIN
  v_plan := NEW.raw_user_meta_data->>'plan';
  IF v_plan NOT IN ('grátis', 'premium', 'profissional') THEN
    v_plan := 'grátis';
  END IF;

  INSERT INTO public.profiles (id, email, name, is_admin, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    false,
    v_plan
  );
  RETURN NEW;
END;
$$;
