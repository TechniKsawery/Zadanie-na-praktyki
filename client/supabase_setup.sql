-- ==========================================
-- SKRYPT KONFIGURACYJNY BAZY DANYCH (SQL)
-- ETAP 3: Mini Jira / Trello
-- ==========================================

-- 1. TABELA PROJEKTÓW
create table projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  owner_id uuid default auth.uid() not null references auth.users(id) on delete cascade
);

-- 2. TABELA ZADAŃ
create table tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  status text default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  deadline timestamp with time zone,
  assigned_user_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. WŁĄCZENIE RLS (Row Level Security)
alter table projects enable row level security;
alter table tasks enable row level security;

-- 4. POLITYKI DLA PROJEKTÓW
-- Użytkownik widzi tylko swoje projekty
create policy "Users can see their own projects" on projects
  for select using (auth.uid() = owner_id);

create policy "Users can create their own projects" on projects
  for insert with check (auth.uid() = owner_id);

create policy "Users can update their own projects" on projects
  for update using (auth.uid() = owner_id);

create policy "Users can delete their own projects" on projects
  for delete using (auth.uid() = owner_id);

-- 5. POLITYKI DLA ZADAŃ
-- Użytkownik widzi zadania w projektach, których jest właścicielem
create policy "Users can see tasks in their projects" on tasks
  for select using (
    exists (
      select 1 from projects 
      where projects.id = tasks.project_id 
      and projects.owner_id = auth.uid()
    )
  );

create policy "Users can insert tasks in their projects" on tasks
  for insert with check (
    exists (
      select 1 from projects 
      where projects.id = tasks.project_id 
      and projects.owner_id = auth.uid()
    )
  );

create policy "Users can update tasks in their projects" on tasks
  for update using (
    exists (
      select 1 from projects 
      where projects.id = tasks.project_id 
      and projects.owner_id = auth.uid()
    )
  );

create policy "Users can delete tasks in their projects" on tasks
  for delete using (
    exists (
      select 1 from projects 
      where projects.id = tasks.project_id 
      and projects.owner_id = auth.uid()
    )
  );
