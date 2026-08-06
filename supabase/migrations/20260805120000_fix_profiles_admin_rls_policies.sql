-- Migration: fix admin RLS policies to avoid recursive profiles policy evaluation

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'is_admin' AND pronamespace = 'public'::regnamespace
  ) THEN
    CREATE FUNCTION public.is_admin() RETURNS boolean
      LANGUAGE sql
      SECURITY DEFINER
      STABLE
    AS $$
      SELECT EXISTS(
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      );
    $$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_admin'
  ) THEN
    ALTER POLICY profiles_select_admin ON public.profiles
      USING (
        auth.uid() = id
        OR public.is_admin()
      );
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_admin'
  ) THEN
    ALTER POLICY profiles_update_admin ON public.profiles
      USING (
        auth.uid() = id
        OR public.is_admin()
      )
      WITH CHECK (
        auth.uid() = id
        OR public.is_admin()
      );
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_delete_admin'
  ) THEN
    ALTER POLICY profiles_delete_admin ON public.profiles
      USING (
        auth.uid() = id
        OR public.is_admin()
      );
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inquiries' AND policyname = 'inquiries_select_admin'
  ) THEN
    ALTER POLICY inquiries_select_admin ON public.inquiries
      USING (
        auth.uid() = sender_id
        OR auth.uid() = recipient_id
        OR public.is_admin()
      );
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inquiries' AND policyname = 'inquiries_insert_admin'
  ) THEN
    ALTER POLICY inquiries_insert_admin ON public.inquiries
      WITH CHECK (
        auth.uid() = sender_id
        OR public.is_admin()
      );
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inquiries' AND policyname = 'inquiries_update_admin'
  ) THEN
    ALTER POLICY inquiries_update_admin ON public.inquiries
      USING (
        auth.uid() = recipient_id
        OR public.is_admin()
      )
      WITH CHECK (
        auth.uid() = recipient_id
        OR public.is_admin()
      );
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inquiries' AND policyname = 'inquiries_delete_admin'
  ) THEN
    ALTER POLICY inquiries_delete_admin ON public.inquiries
      USING (
        auth.uid() = recipient_id
        OR auth.uid() = sender_id
        OR public.is_admin()
      );
  END IF;
END $$;
