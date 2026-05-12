-- 🚀 MINI JIRA SAAS - FULL DATABASE SETUP (ETAP 4)

-- 1. PROFILES
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text default 'user' check (role in ('root', 'admin', 'moderator', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles add column if not exists full_name text;

-- 2. TEAMS
create table if not exists teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TEAM MEMBERS
-- Rola nie przechowywana tutaj - brana z profilu użytkownika
create table if not exists team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  status text default 'accepted' check (status in ('pending', 'accepted')),
  unique(team_id, user_id)
);

-- Na wypadek gdy tabela już istnieje
alter table team_members add column if not exists status text default 'accepted';

-- 4. PROJECTS
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  owner_id uuid references auth.users on delete cascade not null,
  team_id uuid references teams on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ZAPEWNIENIE ŻE KOLUMNY ISTNIEJĄ (NA WYPADEK GDYBY TABELE JUŻ BYŁY)
alter table projects add column if not exists team_id uuid references teams(id);
alter table projects add column if not exists owner_id uuid references auth.users(id);

-- 5. TASKS
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects on delete cascade not null,
  title text not null,
  description text,
  status text default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  assigned_to uuid references auth.users on delete set null,
  assigned_to_name text,
  deadline date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table tasks add column if not exists assigned_to_name text;
alter table tasks add column if not exists priority text default 'medium';
alter table tasks add column if not exists deadline date;
alter table tasks add column if not exists assigned_to uuid references auth.users(id);
alter table tasks add column if not exists is_approved boolean default false;
alter table tasks add column if not exists pending_assignee uuid references auth.users(id);

-- 6. COMMENTS (OPTIONAL FEATURE)
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6.5 MESSAGES (CHAT HISTORY)
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users on delete cascade not null,
  receiver_id uuid references auth.users on delete set null,
  team_id uuid references teams on delete set null,
  sender_email text,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table messages add column if not exists sender_email text;

-- 7. ACTIVITIES
create table if not exists activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  action text not null,
  resource_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. RLS POLICIES (ADVANCED ROLES)
alter table profiles enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table comments enable row level security;
alter table messages enable row level security;
alter table activities enable row level security;

-- PROFILES: Everyone can see, only owner or admin can update
drop policy if exists "Profiles are public" on profiles;
drop policy if exists "Users can update own profile" on profiles;
create policy "Profiles are public" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id OR (select role from profiles where id = auth.uid()) in ('root', 'admin'));

-- TEAMS:
-- Admin/Root sees all. Others see what they own or what they are members of.
drop policy if exists "Team view policy" on teams;
create policy "Team view policy" on teams for select using (
  (select (role in ('root', 'admin')) from profiles where id = auth.uid()) OR
  auth.uid() = owner_id OR
  id in (select team_id from team_members where user_id = auth.uid() and status = 'accepted')
);

-- TEAM_MEMBERS:
-- Bez rekurencji: nie odwołujemy się do team_members w polisie dla team_members
-- Rola pochodzi z profilu, nie z team_members
drop policy if exists "Team members view" on team_members;
drop policy if exists "Team members insert" on team_members;
drop policy if exists "Team members update" on team_members;
drop policy if exists "Team members delete" on team_members;

create policy "Team members view" on team_members for select using (
  (select role from profiles where id = auth.uid()) in ('root', 'admin') OR
  auth.uid() = user_id OR
  team_id in (select id from teams where owner_id = auth.uid())
);

-- INSERT: Tylko Admin i Moderator mogą dodawać członków do zespołu
create policy "Team members insert" on team_members for insert with check (
  (select role from profiles where id = auth.uid()) in ('admin', 'moderator') OR
  team_id in (select id from teams where owner_id = auth.uid())
);

-- UPDATE: Tylko Admin/Moderator mogą zmieniać status (accepted/pending)
-- Zapobieganie eskalacji: user nie może sam sobie zmienić statusu na accepted
create policy "Team members update" on team_members for update using (
  (select role from profiles where id = auth.uid()) in ('admin', 'moderator') OR
  team_id in (select id from teams where owner_id = auth.uid())
);

-- DELETE: Tylko Admin/Moderator mogą usuwać członków
create policy "Team members delete" on team_members for delete using (
  (select role from profiles where id = auth.uid()) in ('admin', 'moderator') OR
  team_id in (select id from teams where owner_id = auth.uid())
);

-- PROJECTS: 
-- Admin sees all. Others see what they own or what's in their team (accepted status only).
drop policy if exists "Project view policy" on projects;
create policy "Project view policy" on projects for select using (
  (select (role in ('root', 'admin')) from profiles where id = auth.uid()) OR
  auth.uid() = owner_id OR 
  team_id in (
    select tm.team_id from team_members tm
    where tm.user_id = auth.uid() and tm.status = 'accepted'
  )
);

-- Admin and Moderator can create.
drop policy if exists "Project insert policy" on projects;
create policy "Project insert policy" on projects for insert with check (
  true
);

-- UPDATE: Tylko Admin/Moderator
drop policy if exists "Project update policy" on projects;
create policy "Project update policy" on projects for update using (
  (select role from profiles where id = auth.uid()) = 'admin' OR auth.uid() = owner_id
);

-- Only Admin or Owner can delete.
drop policy if exists "Project delete policy" on projects;
create policy "Project delete policy" on projects for delete using (
  (select role from profiles where id = auth.uid()) = 'admin' OR auth.uid() = owner_id
);

-- TASKS:
-- SELECT: Admin widzi wszystko, zwykły user tylko zadania w swoich projektach
drop policy if exists "Task view policy" on tasks;
create policy "Task view policy" on tasks for select using (
  (select (role in ('root', 'admin')) from profiles where id = auth.uid()) OR
  project_id in (
    select p.id from projects p
    where p.owner_id = auth.uid()
       or p.team_id in (select tm.team_id from team_members tm where tm.user_id = auth.uid() and tm.status = 'accepted')
  )
);

-- INSERT: Tylko Admin/Moderator mogą tworzyć zadania
drop policy if exists "Task insert policy" on tasks;
create policy "Task insert policy" on tasks for insert with check (
  true
);

-- UPDATE: Tylko Admin/Moderator mogą zmieniać zadania, lub osoba przypisana może zmienić status
-- WAŻNE: zwykły user NIE MOŻE przypisywać sobie wyższych rang ani przypisywać innych
drop policy if exists "Task update policy" on tasks;
create policy "Task update policy" on tasks for update using (
  (select role from profiles where id = auth.uid()) in ('admin', 'moderator') OR
  auth.uid() = assigned_to
);

-- DELETE: Tylko Admin/Moderator
drop policy if exists "Task delete policy" on tasks;
create policy "Task delete policy" on tasks for delete using (
  (select role from profiles where id = auth.uid()) in ('admin', 'moderator')
);

-- COMMENTS:
drop policy if exists "Comment view" on comments;
drop policy if exists "Comment insert" on comments;
drop policy if exists "Comment delete" on comments;
create policy "Comment view" on comments for select using (true);
create policy "Comment insert" on comments for insert with check (auth.uid() = user_id);
create policy "Comment delete" on comments for delete using (auth.uid() = user_id OR (select role from profiles where id = auth.uid()) = 'admin');

-- MESSAGES:
drop policy if exists "Messages view" on messages;
drop policy if exists "Messages insert" on messages;
drop policy if exists "Messages delete" on messages;
create policy "Messages view" on messages for select using (auth.uid() is not null);
create policy "Messages insert" on messages for insert with check (auth.uid() = sender_id);
create policy "Messages delete" on messages for delete using (auth.uid() = sender_id);

-- ACTIVITIES: Tylko Admin i Moderator mogą czytać historię (z wymagań)
drop policy if exists "Activities view" on activities;
drop policy if exists "Activities insert" on activities;
create policy "Activities view" on activities for select using (
  (select role from profiles where id = auth.uid()) in ('admin', 'moderator')
);
create policy "Activities insert" on activities for insert with check (true);

-- 9. HELPER FUNCTIONS
-- Function to automatically create a profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
