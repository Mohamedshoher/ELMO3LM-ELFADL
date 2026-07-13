-- =========================================================================
-- Storage RLS Policies for course-images bucket
-- تسمح لأي مستخدم مصادق عليه برفع وقراءة وحذف صور الدورات
-- =========================================================================

-- إنشاء bucket إذا لم يكن موجوداً
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'course-images',
    'course-images',
    true,
    5242880,  -- 5MB
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- حذف أي سياسات قديمة إن وُجدت
drop policy if exists "course-images: public read" on storage.objects;
drop policy if exists "course-images: authenticated upload" on storage.objects;
drop policy if exists "course-images: authenticated update" on storage.objects;
drop policy if exists "course-images: authenticated delete" on storage.objects;

-- قراءة عامة للجميع (الصور عامة)
create policy "course-images: public read"
on storage.objects for select
using (bucket_id = 'course-images');

-- رفع الصور للمستخدمين المصادق عليهم
create policy "course-images: authenticated upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'course-images');

-- تحديث الصور للمستخدمين المصادق عليهم
create policy "course-images: authenticated update"
on storage.objects for update
to authenticated
using (bucket_id = 'course-images');

-- حذف الصور للمستخدمين المصادق عليهم
create policy "course-images: authenticated delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'course-images');
