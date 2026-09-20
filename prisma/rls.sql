-- Supabase Row Level Security (RLS) & Performance Setup Script
-- Executed against Supabase PostgreSQL database to enforce database-level multi-tenant isolation and optimal indexing.

-- 1. Create profiles sidecar table referencing auth.users(id) if not created by Prisma
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1b. Ensure default on updated_at in case table was created via Prisma db push
ALTER TABLE public.profiles ALTER COLUMN updated_at SET DEFAULT NOW();

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- 2. Enable RLS on applications table
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own applications" ON public.applications;
CREATE POLICY "Users manage their own applications"
  ON public.applications FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 3. Enable RLS on interviews table (joined through application_id -> applications.user_id)
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage interviews for their own applications" ON public.interviews;
CREATE POLICY "Users manage interviews for their own applications"
  ON public.interviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = interviews.application_id
        AND applications.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = interviews.application_id
        AND applications.user_id = (SELECT auth.uid())
    )
  );

-- 4. Foreign Key Covering Indexes (resolves unindexed_foreign_keys performance advisor)
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications (user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON public.interviews (application_id);

-- 5. Trigger to automatically create a public.profiles row when a new auth.users row is inserted
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO UPDATE
  SET name = COALESCE(EXCLUDED.name, profiles.name),
      updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Revoke public execution of SECURITY DEFINER function to prevent RPC exposure
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Backfill any existing orphaned accounts
INSERT INTO public.profiles (id, name, role)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)), 'user'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
