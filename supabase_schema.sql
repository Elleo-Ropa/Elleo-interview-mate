-- 1. Create a table for public profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'manager' check (role in ('admin', 'manager'))
);

-- 2. Enable RLS on profiles
alter table public.profiles enable row level security;

-- 3. Create policies for profiles
-- Public read access (so we can check roles)
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

-- Users can insert their own profile
create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

-- Users can update own profile
create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- 4. Trigger to automatically create a profile after signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'manager'); -- Default role is 'manager'
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 5. Update interview_records table
-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interview_records' AND column_name='user_id') THEN
    ALTER TABLE public.interview_records ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Enable RLS
alter table public.interview_records enable row level security;

-- [IMPORTANT] DROPPING OLD POLICIES TO PREVENT DUPLICATES
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins can do everything" ON interview_records;
    DROP POLICY IF EXISTS "Managers can view own records" ON interview_records;
    DROP POLICY IF EXISTS "Managers can insert own records" ON interview_records;
    DROP POLICY IF EXISTS "Managers can update own records" ON interview_records;
    DROP POLICY IF EXISTS "Managers can delete own records" ON interview_records;
    DROP POLICY IF EXISTS "Enable read access for all users" ON interview_records; 
END $$;

-- 6. RLS Policies for interview_records (Refined)

-- ADMIN Policy
CREATE POLICY "Admins can do everything"
  ON public.interview_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- MANAGER Policy
CREATE POLICY "Managers can view own records"
  ON public.interview_records
  FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Managers can insert own records"
  ON public.interview_records
  FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Managers can update own records"
  ON public.interview_records
  FOR UPDATE
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Managers can delete own records"
  ON public.interview_records
  FOR DELETE
  USING ( auth.uid() = user_id );
