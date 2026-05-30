-- =========================================================================
-- جدول متابعة استماع الطلاب للمحاضرات (Student Listens)
-- يُستخدم لتسجيل عدد المحاضرات التي استمع إليها الطالب في كل مرة
-- =========================================================================
create table if not exists student_listens (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade,
  date date not null,
  lectures_count int default 1,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- فهارس لتسريع البحث
create index if not exists idx_student_listens_student on student_listens(student_id);
create index if not exists idx_student_listens_date on student_listens(date);

-- تمكين حماية مستوى الصف (RLS)
alter table student_listens enable row level security;
create policy "Public access" on student_listens for all using (true);
