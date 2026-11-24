-- Some code still reads and writes an older profiles.verified true/false flag
-- (the badge shows for verified = true). The 20261124010000 trigger protected
-- verification_status but not this flag, so a user could still set
-- verified = true on their own profile. Close that too.
-- Written with jsonb so it works whether or not the column exists.

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
    IF NEW.verification_status IS DISTINCT FROM 'pending' THEN
      NEW.verification_status := 'unverified';
    END IF;
    NEW.verification_approved_at := NULL;
    -- Legacy flag, if the column exists: always starts false.
    NEW := jsonb_populate_record(NEW, jsonb_build_object('verified', false));
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.role IS DISTINCT FROM OLD.role AND (NEW.role = 'admin' OR OLD.role = 'admin') THEN
    RAISE EXCEPTION 'Only an admin can change the admin role' USING ERRCODE = '42501';
  END IF;
  IF NEW.verification_status = 'verified' AND OLD.verification_status IS DISTINCT FROM 'verified' THEN
    RAISE EXCEPTION 'Only an admin can mark a profile as verified' USING ERRCODE = '42501';
  END IF;
  IF (to_jsonb(NEW) ->> 'verified') = 'true' AND (to_jsonb(OLD) ->> 'verified') IS DISTINCT FROM 'true' THEN
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
