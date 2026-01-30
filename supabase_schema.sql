-- 1. Create a table for public profiles (linked to auth.users)
create table public.profiles (
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
alter table public.interview_records 
add column if not exists user_id uuid references auth.users(id);

-- Enable RLS
alter table public.interview_records enable row level security;

-- 6. RLS Policies for interview_records

-- ADMIN Policy: Can do EVERYTHING (Select, Insert, Update, Delete)
create policy "Admins can do everything"
  on public.interview_records
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- MANAGER Policy: Can only View/Edit THEIR OWN records
create policy "Managers can view own records"
  on public.interview_records
  for select
  using (
    auth.uid() = user_id
  );

create policy "Managers can insert own records"
  on public.interview_records
  for insert
  with check (
    auth.uid() = user_id
  );

create policy "Managers can update own records"
  on public.interview_records
  for update
  using (
    auth.uid() = user_id
  );

create policy "Managers can delete own records"
  on public.interview_records
  for delete
  using (
    auth.uid() = user_id
  );
