-- DODAJEMY KOLUMNĘ NA NAZWĘ UŻYTKOWNIKA (TEXT), ŻEBY BYŁO PROŚCIEJ NIŻ Z UUID
alter table tasks add column if not exists assigned_to_name text;
