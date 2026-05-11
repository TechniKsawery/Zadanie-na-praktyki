-- 🚀 MINI JIRA SAAS - FULL DATABASE SETUP (ETAP 4)

-- 1. PROFILES
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  role text default 'user' check (role in ('admin', 'moderator', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TEAMS
create table if not exists teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TEAM MEMBERS
create table if not exists team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role_in_team text default 'member' check (role_in_team in ('owner', 'member')),
  unique(team_id, user_id)
);

-- 4. PROJECTS
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  owner_id uuid references auth.users on delete cascade not null,
  team_id uuid references teams on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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

-- 6. COMMENTS (OPTIONAL FEATURE)
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. ACTIVITIES
create table if not exists activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  action text not null,
  resource_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. RLS POLICIES (BASIC)
alter table profiles enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table comments enable row level security;
alter table activities enable row level security;

-- Simple policy: users can see their own profile and everyone's public info
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Projects: users can see projects they own OR projects in their teams
create policy "Users can see their projects" on projects for select using (
  auth.uid() = owner_id OR 
  team_id in (select team_id from team_members where user_id = auth.uid())
);
create policy "Users can create projects" on projects for insert with check (auth.uid() = owner_id);

-- Tasks: same as projects
create policy "Users can see tasks" on tasks for select using (
  project_id in (select id from projects where owner_id = auth.uid() or team_id in (select team_id from team_members where user_id = auth.uid()))
);
create policy "Users can manage tasks" on tasks for all using (
  project_id in (select id from projects where owner_id = auth.uid() or team_id in (select team_id from team_members where user_id = auth.uid()))
);

-- Comments & Activities
create policy "Everyone can see comments" on comments for select using (true);
create policy "Users can post comments" on comments for insert with check (auth.uid() = user_id);
create policy "Everyone can see activity" on activities for select using (true);
