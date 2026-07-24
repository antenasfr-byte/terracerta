-- Fix handle_new_user: NULL plan from raw_user_meta_data caused NOT NULL violation
-- because `NULL NOT IN (...)` evaluates to NULL (falsy), not TRUE.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_plan text;
BEGIN
  v_plan := NEW.raw_user_meta_data->>'plan';
  IF v_plan IS NULL OR v_plan NOT IN ('grátis', 'premium', 'profissional') THEN
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
$function$;
