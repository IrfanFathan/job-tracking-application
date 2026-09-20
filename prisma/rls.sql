-- Supabase Row Level Security (RLS) Setup Script
-- Executed against Supabase PostgreSQL database to enforce database-level multi-tenant isolation.

-- 1. Create profiles sidecar table referencing auth.users(id) if not created by Prisma
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- 2. Enable RLS on applications table
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own applications"
  ON public.applications FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Enable RLS on interviews table (joined through application_id -> applications.user_id)
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage interviews for their own applications"
  ON public.interviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = interviews.application_id
        AND applications.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = interviews.application_id
        AND applications.user_id = auth.uid()
    )
  );

-- 1b. Ensure default on updated_at in case table was created via Prisma db push
ALTER TABLE public.profiles ALTER COLUMN updated_at SET DEFAULT NOW();

-- 4. Trigger to automatically create a public.profiles row when a new auth.users row is inserted
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

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Backfill any existing orphaned accounts
INSERT INTO public.profiles (id, name, role)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)), 'user'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
