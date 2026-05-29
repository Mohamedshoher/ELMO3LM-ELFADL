-- =========================================================================
-- جدول الدورات
-- =========================================================================
create table if not exists courses (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  lectures_count integer default 0,
  link text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table courses enable row level security;
create policy "Public access" on courses for all using (true);
