-- إضافة عمود is_pinned إلى جدول الرسائل
alter table messages add column if not exists is_pinned boolean default false;
