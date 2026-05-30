-- إنشاء جدول أقسام الدورات
create table if not exists course_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table course_categories enable row level security;
create policy "Public access" on course_categories for all using (true);

-- إضافة حقل القسم إلى جدول الدورات
alter table courses add column if not exists category_id uuid references course_categories(id) on delete set null;
