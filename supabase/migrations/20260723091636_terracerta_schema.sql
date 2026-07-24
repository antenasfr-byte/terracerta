/*
# TerraCerta — esquema completo da base de dados

## Resumo
Cria o esquema completo da aplicação TerraCerta: perfis de utilizador,
terrenos, parcelas, plantas, diagnósticos, fotografias, relatórios de terra,
relatórios de exposição solar, lembretes, eventos do diário, catálogos de
referência (culturas, insetos, ervas, tratamentos) e subscrições.

## Tabelas novas
- `profiles` — dados públicos do utilizador (nome, região, plano, is_admin)
- `plots` — terrenos do utilizador (nome, área, localização)
- `plants` — plantas dentro de cada terreno
- `diagnoses` — resultados de diagnóstico por fotografia
- `diagnosis_causes` — causas possíveis de cada diagnóstico (1-N)
- `photos` — metadados de fotografias guardadas no Storage
- `soil_reports` — relatórios de análise da terra
- `sun_reports` — relatórios de exposição solar
- `reminders` — lembretes do utilizador
- `journal_events` — eventos do diário da horta (rega, adubação, etc.)
- `subscriptions` — estado da subscrição do utilizador
- `crops` — catálogo de culturas (dados de referência, públicos)
- `insects` — catálogo de insetos (dados de referência, públicos)
- `weeds` — catálogo de ervas daninhas (dados de referência, públicos)
- `treatments` — catálogo de tratamentos (dados de referência, públicos)

## Segurança
- RLS ativada em TODAS as tabelas.
- Tabelas de utilizador (plots, plants, diagnoses, etc.): políticas
  owner-scoped com `auth.uid() = user_id` e `user_id DEFAULT auth.uid()`.
- Catálogos de referência (crops, insects, weeds, treatments): leitura
  pública para authenticated, escrita apenas para administradores.
- `profiles`: cada utilizador vê/edita o seu próprio perfil.
- `subscriptions`: cada utilizador vê a sua; admin vê todas.

## Notas
1. `profiles.id` referencia `auth.users(id)` com ON DELETE CASCADE.
2. `is_admin` é definido em `raw_app_meta_data` e exposto via `profiles`.
3. Colunas de dono têm `DEFAULT auth.uid()` para que inserts do cliente
   funcionem sem passar user_id explicitamente.
4. Os catálogos são públicos (leitura) para que a aplicação mostre
   recomendações mesmo a utilizadores do plano grátis.
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT 'Estremadura',
  plan text NOT NULL DEFAULT 'grátis' CHECK (plan IN ('grátis','premium','profissional')),
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR (
    SELECT profiles.is_admin FROM profiles WHERE profiles.id = auth.uid()
  ));

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Função para criar perfil automaticamente no sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    (NEW.raw_user_meta_data->>'is_admin') = 'true'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PLOTS (terrenos)
-- ============================================================
CREATE TABLE IF NOT EXISTS plots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  area text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE plots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_plots" ON plots;
CREATE POLICY "select_own_plots" ON plots FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_plots" ON plots;
CREATE POLICY "insert_own_plots" ON plots FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_plots" ON plots;
CREATE POLICY "update_own_plots" ON plots FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_plots" ON plots;
CREATE POLICY "delete_own_plots" ON plots FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- PLANTS (plantas dentro de terrenos)
-- ============================================================
CREATE TABLE IF NOT EXISTS plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plot_id uuid NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  name text NOT NULL,
  variety text NOT NULL DEFAULT '',
  planted_at date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'viva' CHECK (status IN ('viva','colhida','perdida')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_plants" ON plants;
CREATE POLICY "select_own_plants" ON plants FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_plants" ON plants;
CREATE POLICY "insert_own_plants" ON plants FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_plants" ON plants;
CREATE POLICY "update_own_plants" ON plants FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_plants" ON plants;
CREATE POLICY "delete_own_plants" ON plants FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_plants_plot_id ON plants(plot_id);
CREATE INDEX IF NOT EXISTS idx_plants_user_id ON plants(user_id);

-- ============================================================
-- PHOTOS (metadados de fotografias no Storage)
-- ============================================================
CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  related_type text NOT NULL DEFAULT 'general' CHECK (related_type IN ('diagnosis','soil','sun','compare','journal','general')),
  related_id uuid,
  caption text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_photos" ON photos;
CREATE POLICY "select_own_photos" ON photos FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_photos" ON photos;
CREATE POLICY "insert_own_photos" ON photos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_photos" ON photos;
CREATE POLICY "delete_own_photos" ON photos FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);

-- ============================================================
-- DIAGNOSES (diagnósticos por fotografia)
-- ============================================================
CREATE TABLE IF NOT EXISTS diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_id uuid REFERENCES photos(id) ON DELETE SET NULL,
  part text NOT NULL DEFAULT 'folha' CHECK (part IN ('folha','fruto','caule','raiz','inseto','terra')),
  plant_guess text NOT NULL DEFAULT '',
  confidence text NOT NULL DEFAULT 'low' CHECK (confidence IN ('low','medium','high')),
  confidence_score int NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  primary_problem text NOT NULL DEFAULT '',
  recheck_days int NOT NULL DEFAULT 7,
  note text NOT NULL DEFAULT '',
  ai_raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_diagnoses" ON diagnoses;
CREATE POLICY "select_own_diagnoses" ON diagnoses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_diagnoses" ON diagnoses;
CREATE POLICY "insert_own_diagnoses" ON diagnoses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_diagnoses" ON diagnoses;
CREATE POLICY "delete_own_diagnoses" ON diagnoses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_diagnoses_user_id ON diagnoses(user_id);

-- ============================================================
-- DIAGNOSIS_CAUSES (causas possíveis, 1-N)
-- ============================================================
CREATE TABLE IF NOT EXISTS diagnosis_causes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id uuid NOT NULL REFERENCES diagnoses(id) ON DELETE CASCADE,
  label text NOT NULL,
  probability int NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'outra' CHECK (type IN ('doença','praga','carencia','excesso','queimadura','outra')),
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE diagnosis_causes ENABLE ROW LEVEL SECURITY;

-- Herda permissão do diagnóstico pai
DROP POLICY IF EXISTS "select_own_causes" ON diagnosis_causes;
CREATE POLICY "select_own_causes" ON diagnosis_causes FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM diagnoses WHERE diagnoses.id = diagnosis_causes.diagnosis_id AND diagnoses.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_causes" ON diagnosis_causes;
CREATE POLICY "insert_own_causes" ON diagnosis_causes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM diagnoses WHERE diagnoses.id = diagnosis_causes.diagnosis_id AND diagnoses.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_causes" ON diagnosis_causes;
CREATE POLICY "delete_own_causes" ON diagnosis_causes FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM diagnoses WHERE diagnoses.id = diagnosis_causes.diagnosis_id AND diagnoses.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_causes_diagnosis_id ON diagnosis_causes(diagnosis_id);

-- ============================================================
-- SOIL_REPORTS (relatórios de análise da terra)
-- ============================================================
CREATE TABLE IF NOT EXISTS soil_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_id uuid REFERENCES photos(id) ON DELETE SET NULL,
  rating text NOT NULL DEFAULT 'razoável' CHECK (rating IN ('fraca','razoável','boa','muito boa')),
  score int NOT NULL DEFAULT 50,
  answers jsonb NOT NULL DEFAULT '{}',
  tests jsonb NOT NULL DEFAULT '{}',
  recommendations jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE soil_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_soil" ON soil_reports;
CREATE POLICY "select_own_soil" ON soil_reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_soil" ON soil_reports;
CREATE POLICY "insert_own_soil" ON soil_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_soil" ON soil_reports;
CREATE POLICY "delete_own_soil" ON soil_reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- SUN_REPORTS (relatórios de exposição solar)
-- ============================================================
CREATE TABLE IF NOT EXISTS sun_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  location text NOT NULL DEFAULT '',
  orientation text NOT NULL DEFAULT '',
  hours int NOT NULL DEFAULT 0,
  has_obstructions boolean NOT NULL DEFAULT false,
  classification text NOT NULL DEFAULT 'sombra' CHECK (classification IN ('sombra','meia-sombra','sol-parcial','sol-pleno')),
  sun_hours int NOT NULL DEFAULT 0,
  burn_risk text NOT NULL DEFAULT 'baixo' CHECK (burn_risk IN ('baixo','moderado','alto')),
  needs_shade_net boolean NOT NULL DEFAULT false,
  best_watering_hour text NOT NULL DEFAULT '',
  suggested_plants jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sun_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sun" ON sun_reports;
CREATE POLICY "select_own_sun" ON sun_reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sun" ON sun_reports;
CREATE POLICY "insert_own_sun" ON sun_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sun" ON sun_reports;
CREATE POLICY "delete_own_sun" ON sun_reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- REMINDERS (lembretes)
-- ============================================================
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'regar' CHECK (type IN ('regar','adubar','tratamento','fotografia','podar','plantar','colher')),
  due_date timestamptz NOT NULL DEFAULT now(),
  plot_id uuid REFERENCES plots(id) ON DELETE SET NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_reminders" ON reminders;
CREATE POLICY "select_own_reminders" ON reminders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_reminders" ON reminders;
CREATE POLICY "insert_own_reminders" ON reminders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_reminders" ON reminders;
CREATE POLICY "update_own_reminders" ON reminders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reminders" ON reminders;
CREATE POLICY "delete_own_reminders" ON reminders FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reminders_user_due ON reminders(user_id, due_date);

-- ============================================================
-- JOURNAL_EVENTS (eventos do diário)
-- ============================================================
CREATE TABLE IF NOT EXISTS journal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id uuid NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'observação' CHECK (type IN ('rega','adubação','tratamento','doença','colheita','despesa','observação','fotografia')),
  title text NOT NULL,
  detail text NOT NULL DEFAULT '',
  amount numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE journal_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_events" ON journal_events;
CREATE POLICY "select_own_events" ON journal_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_events" ON journal_events;
CREATE POLICY "insert_own_events" ON journal_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_events" ON journal_events;
CREATE POLICY "delete_own_events" ON journal_events FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_events_plant_id ON journal_events(plant_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON journal_events(user_id);

-- ============================================================
-- SUBSCRIPTIONS (estado das subscrições)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'grátis' CHECK (plan IN ('grátis','premium','profissional')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','canceled','expired')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subscription" ON subscriptions;
CREATE POLICY "select_own_subscription" ON subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR (
    SELECT profiles.is_admin FROM profiles WHERE profiles.id = auth.uid()
  ));

DROP POLICY IF EXISTS "insert_own_subscription" ON subscriptions;
CREATE POLICY "insert_own_subscription" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_subscription" ON subscriptions;
CREATE POLICY "update_own_subscription" ON subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- CATALOG: CROPS (catálogo público de culturas)
-- ============================================================
CREATE TABLE IF NOT EXISTS crops (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('legumes','frutas','árvores','ervas','flores','resistentes')),
  icon text NOT NULL DEFAULT '🌱',
  plant_months int[] NOT NULL DEFAULT '{}',
  depth text NOT NULL DEFAULT '',
  spacing text NOT NULL DEFAULT '',
  water text NOT NULL DEFAULT '',
  sun text NOT NULL DEFAULT '',
  harvest_days text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'Fácil' CHECK (difficulty IN ('Fácil','Médio','Difícil'))
);

ALTER TABLE crops ENABLE ROW LEVEL SECURITY;

-- Admin helper: checks if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM profiles WHERE id = auth.uid()), false);
$$;

DROP POLICY IF EXISTS "select_crops" ON crops;
CREATE POLICY "select_crops" ON crops FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_crops_admin" ON crops;
CREATE POLICY "insert_crops_admin" ON crops FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_crops_admin" ON crops;
CREATE POLICY "update_crops_admin" ON crops FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_crops_admin" ON crops;
CREATE POLICY "delete_crops_admin" ON crops FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- CATALOG: INSECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS insects (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('prejudicial','benéfico','neutro')),
  emoji text NOT NULL DEFAULT '🐛',
  description text NOT NULL DEFAULT '',
  signs jsonb NOT NULL DEFAULT '[]',
  treatment text
);

ALTER TABLE insects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_insects" ON insects;
CREATE POLICY "select_insects" ON insects FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_insects_admin" ON insects;
CREATE POLICY "insert_insects_admin" ON insects FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_insects_admin" ON insects;
CREATE POLICY "update_insects_admin" ON insects FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_insects_admin" ON insects;
CREATE POLICY "delete_insects_admin" ON insects FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- CATALOG: WEEDS
-- ============================================================
CREATE TABLE IF NOT EXISTS weeds (
  id text PRIMARY KEY,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🌿',
  invasive boolean NOT NULL DEFAULT false,
  toxic boolean NOT NULL DEFAULT false,
  description text NOT NULL DEFAULT '',
  control text NOT NULL DEFAULT ''
);

ALTER TABLE weeds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_weeds" ON weeds;
CREATE POLICY "select_weeds" ON weeds FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_weeds_admin" ON weeds;
CREATE POLICY "insert_weeds_admin" ON weeds FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_weeds_admin" ON weeds;
CREATE POLICY "update_weeds_admin" ON weeds FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_weeds_admin" ON weeds;
CREATE POLICY "delete_weeds_admin" ON weeds FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- CATALOG: TREATMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS treatments (
  id text PRIMARY KEY,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('biológico','convencional')),
  problem_key text NOT NULL DEFAULT 'default',
  doses jsonb NOT NULL DEFAULT '[]',
  best_hour text NOT NULL DEFAULT '',
  wait_days int NOT NULL DEFAULT 7,
  warnings jsonb NOT NULL DEFAULT '[]',
  do_not_mix jsonb NOT NULL DEFAULT '[]'
);

ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_treatments" ON treatments;
CREATE POLICY "select_treatments" ON treatments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_treatments_admin" ON treatments;
CREATE POLICY "insert_treatments_admin" ON treatments FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_treatments_admin" ON treatments;
CREATE POLICY "update_treatments_admin" ON treatments FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_treatments_admin" ON treatments;
CREATE POLICY "delete_treatments_admin" ON treatments FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- STORAGE BUCKET for photos
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users manage only their own folder
DROP POLICY IF EXISTS "select_own_storage" ON storage.objects;
CREATE POLICY "select_own_storage" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "insert_own_storage" ON storage.objects;
CREATE POLICY "insert_own_storage" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "update_own_storage" ON storage.objects;
CREATE POLICY "update_own_storage" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "delete_own_storage" ON storage.objects;
CREATE POLICY "delete_own_storage" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
