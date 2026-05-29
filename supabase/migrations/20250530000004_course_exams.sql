-- إضافة أعمدة ربط الاختبارات بالدورات
alter table exams add column if not exists course_id uuid references courses(id);
alter table exams add column if not exists lectures_tested integer default 0;
alter table exams add column if not exists exam_location text; -- 'حضوري' أو 'أون لاين'
alter table exams add column if not exists amount numeric default 0;

-- إضافة التقدير النهائي للدورة للطالب
alter table students add column if not exists course_final_grade text;
