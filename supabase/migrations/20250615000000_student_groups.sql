-- =========================================================================
-- إنشاء جدول وسيط student_groups (علاقة متعدد إلى متعدد)
-- =========================================================================
create table if not exists student_groups (
  id uuid default gen_random_uuid() primary key,
  student_id uuid not null references students(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id, group_id)
);

-- إنشاء فهارس للتسريع
create index if not exists idx_student_groups_student_id on student_groups(student_id);
create index if not exists idx_student_groups_group_id on student_groups(group_id);

-- ترحيل البيانات الحالية من students.group_id إلى student_groups
insert into student_groups (student_id, group_id)
select id, group_id from students where group_id is not null
on conflict (student_id, group_id) do nothing;

-- تمكين RLS
alter table student_groups enable row level security;
create policy "Public access" on student_groups for all using (true);
