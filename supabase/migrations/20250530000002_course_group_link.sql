alter table groups add column if not exists course_id uuid references courses(id);
alter table students add column if not exists course_registered_at timestamp with time zone;
