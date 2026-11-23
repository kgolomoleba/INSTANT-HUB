-- Security fixes found in review (2026-11-24).
--
-- 1. Users could make themselves admin or verified: the "update own row"
--    policy allowed changing any column, including profiles.role ('admin')
--    and profiles.verification_status ('verified').
-- 2. Inquiry senders could put any name in sender_username (shown to the
--    recipient and in the notification email).
-- 3. Inquiry recipients could rewrite any column of an inquiry they received
--    (message, sender_id, ...), not just mark it read/answered.
-- 4. is_admin() is SECURITY DEFINER without a fixed search_path.
--
-- Policies are row-level, so these column rules are enforced with triggers.
-- Admins (public.is_admin()) and server-side code (service role / SQL editor,
-- where auth.uid() is null) are not restricted.

-- (Re)create is_admin(): the 20260805 migration that defines it had a quoting
-- error and could fail, leaving the admin policies recursive.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$fn$;

-- Point the admin policies at is_admin() (a no-op if 20260805 already did).
ALTER POLICY profiles_select_admin ON public.profiles USING (auth.uid() = id OR public.is_admin());
ALTER POLICY profiles_update_admin ON public.profiles
  USING (auth.uid() = id OR public.is_admin()) WITH CHECK (auth.uid() = id OR public.is_admin());
ALTER POLICY profiles_delete_admin ON public.profiles USING (auth.uid() = id OR public.is_admin());
ALTER POLICY inquiries_select_admin ON public.inquiries
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id OR public.is_admin());
ALTER POLICY inquiries_insert_admin ON public.inquiries WITH CHECK (auth.uid() = sender_id OR public.is_admin());
ALTER POLICY inquiries_update_admin ON public.inquiries
  USING (auth.uid() = recipient_id OR public.is_admin()) WITH CHECK (auth.uid() = recipient_id OR public.is_admin());
ALTER POLICY inquiries_delete_admin ON public.inquiries
  USING (auth.uid() = recipient_id OR auth.uid() = sender_id OR public.is_admin());

-- ---------------------------------------------------------------- profiles
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role = 'admin' THEN
      RAISE EXCEPTION 'Only an admin can grant the admin role' USING ERRCODE = '42501';
    END IF;
    -- New profiles always start unverified (or pending, if proof is submitted).
    IF NEW.verification_status IS DISTINCT FROM 'pending' THEN
      NEW.verification_status := 'unverified';
    END IF;
    NEW.verification_approved_at := NULL;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.role IS DISTINCT FROM OLD.role AND (NEW.role = 'admin' OR OLD.role = 'admin') THEN
    RAISE EXCEPTION 'Only an admin can change the admin role' USING ERRCODE = '42501';
  END IF;
  IF NEW.verification_status = 'verified' AND OLD.verification_status IS DISTINCT FROM 'verified' THEN
    RAISE EXCEPTION 'Only an admin can mark a profile as verified' USING ERRCODE = '42501';
  END IF;
  IF NEW.verification_status IS NOT NULL
     AND NEW.verification_status NOT IN ('unverified', 'pending', 'verified') THEN
    RAISE EXCEPTION 'Invalid verification status' USING ERRCODE = '22023';
  END IF;
  IF NEW.verification_approved_at IS DISTINCT FROM OLD.verification_approved_at THEN
    NEW.verification_approved_at := OLD.verification_approved_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_fields ON public.profiles;
CREATE TRIGGER protect_profile_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- --------------------------------------------------------------- inquiries
CREATE OR REPLACE FUNCTION public.protect_inquiry_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- The sender's name always comes from their profile.
    SELECT username INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
    NEW.sender_username := COALESCE(NULLIF(sender_name, ''), 'Instant Hub user');
    RETURN NEW;
  END IF;

  -- UPDATE: recipients may only change the delivery fields.
  IF (to_jsonb(NEW) - ARRAY['status', 'read', 'responded_at'])
     IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['status', 'read', 'responded_at']) THEN
    RAISE EXCEPTION 'Only the status of an inquiry can be changed' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_inquiry_fields ON public.inquiries;
CREATE TRIGGER protect_inquiry_fields
  BEFORE INSERT OR UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.protect_inquiry_fields();

-- ------------------------------------------------------- username lookups
-- Registration checks whether a username is free. With profiles readable
-- only by their owner, that check could never see other users' names.
CREATE OR REPLACE FUNCTION public.username_available(candidate text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(username) = lower(trim(candidate))
  );
$$;

REVOKE ALL ON FUNCTION public.username_available(text) FROM public;
GRANT EXECUTE ON FUNCTION public.username_available(text) TO anon, authenticated;

-- --------------------------------------------------------- public profiles
-- Listings and posts show the author's name and verified badge. Profiles are
-- readable only by their owner (they hold private verification details), so
-- the app read nothing for other users ("Unknown" seller, no badge). This view
-- exposes only the public fields. It runs with the view owner's rights, so it
-- is not limited by the profiles policies; keep it to public columns only.
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, username, avatar_url, verification_status
  FROM public.profiles;

REVOKE ALL ON public.public_profiles FROM public;
GRANT SELECT ON public.public_profiles TO anon, authenticated;
