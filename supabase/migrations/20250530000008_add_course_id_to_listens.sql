-- إضافة حقل معرف الدورة إلى جدول متابعة الاستماع
alter table student_listens add column if not exists course_id uuid references courses(id) on delete set null;

-- فهرس للبحث حسب الدورة
create index if not exists idx_student_listens_course on student_listens(course_id);
