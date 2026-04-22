-- 1. Utwórz tabelę 'notes'
create table notes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  content text not null,
  user_id uuid default auth.uid() not null references auth.users(id) on delete cascade
);

-- 2. Włącz Row Level Security (zabezpieczenia na poziomie wierszy)
alter table notes enable row level security;

-- 3. Utwórz polityki bezpieczeństwa (RLS)
-- Każdy użytkownik widzi TYLKO swoje notatki

-- Polityka: Widoczność (SELECT)
create policy "Users can view their own notes" 
on notes for select 
using (auth.uid() = user_id);

-- Polityka: Dodawanie (INSERT)
create policy "Users can insert their own notes" 
on notes for insert 
with check (auth.uid() = user_id);

-- Polityka: Usuwanie (DELETE)
create policy "Users can delete their own notes" 
on notes for delete 
using (auth.uid() = user_id);

-- POLSKA INSTRUKCJA:
-- Skopiuj ten kod i wklej go w zakładce "SQL Editor" w panelu Supabase, a następnie kliknij "Run".
