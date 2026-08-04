-- Migration: add admin RLS policies to allow users with profiles.role = 'admin'
-- Grants admins ability to SELECT/UPDATE/DELETE across profiles and inquiries

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Profiles: allow admins to select other rows
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_admin'
  ) THEN
    CREATE POLICY profiles_select_admin
      ON public.profiles
      FOR SELECT
      USING (
        auth.uid() = id
        OR EXISTS (
          SELECT 1 FROM public.profiles AS me WHERE me.id = auth.uid() AND me.role = 'admin'
        )
      );
  END IF;

  -- Profiles: allow admins to update other rows
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_admin'
  ) THEN
    CREATE POLICY profiles_update_admin
      ON public.profiles
      FOR UPDATE
      USING (
        auth.uid() = id
        OR EXISTS (
          SELECT 1 FROM public.profiles AS me WHERE me.id = auth.uid() AND me.role = 'admin'
        )
      )
      WITH CHECK (
        auth.uid() = id
        OR EXISTS (
          SELECT 1 FROM public.profiles AS me WHERE me.id = auth.uid() AND me.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_delete_admin'
  ) THEN
    CREATE POLICY profiles_delete_admin
      ON public.profiles
      FOR DELETE
      USING (
        auth.uid() = id
        OR EXISTS (
          SELECT 1 FROM public.profiles AS me WHERE me.id = auth.uid() AND me.role = 'admin'
        )
      );
  END IF;

  -- Inquiries: allow admins to select/update/delete other rows
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inquiries' AND policyname = 'inquiries_select_admin'
  ) THEN
    CREATE POLICY inquiries_select_admin
      ON public.inquiries
      FOR SELECT
      USING (
        auth.uid() = sender_id
        OR auth.uid() = recipient_id
        OR EXISTS (
          SELECT 1 FROM public.profiles AS me WHERE me.id = auth.uid() AND me.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inquiries' AND policyname = 'inquiries_insert_admin'
  ) THEN
    CREATE POLICY inquiries_insert_admin
      ON public.inquiries
      FOR INSERT
      WITH CHECK (
        auth.uid() = sender_id
        OR EXISTS (
          SELECT 1 FROM public.profiles AS me WHERE me.id = auth.uid() AND me.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inquiries' AND policyname = 'inquiries_update_admin'
  ) THEN
    CREATE POLICY inquiries_update_admin
      ON public.inquiries
      FOR UPDATE
      USING (
        auth.uid() = recipient_id
        OR EXISTS (
          SELECT 1 FROM public.profiles AS me WHERE me.id = auth.uid() AND me.role = 'admin'
        )
      )
      WITH CHECK (
        auth.uid() = recipient_id
        OR EXISTS (
          SELECT 1 FROM public.profiles AS me WHERE me.id = auth.uid() AND me.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inquiries' AND policyname = 'inquiries_delete_admin'
  ) THEN
    CREATE POLICY inquiries_delete_admin
      ON public.inquiries
      FOR DELETE
      USING (
        auth.uid() = recipient_id
        OR auth.uid() = sender_id
        OR EXISTS (
          SELECT 1 FROM public.profiles AS me WHERE me.id = auth.uid() AND me.role = 'admin'
        )
      );
  END IF;
END $$;
