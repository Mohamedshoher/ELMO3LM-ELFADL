"use client";

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2, BookOpen, Image, X } from 'lucide-react';
import { useAddCourse, useUpdateCourse } from '../hooks/useCourses';
import { useCourseCategories, useAddCategory, useDeleteCategory } from '../hooks/useCourseCategories';
import { Course } from '@/types';
import { supabase } from '@/lib/supabase';

interface AddCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    editCourse?: Course | null;
}

export default function AddCourseModal({ isOpen, onClose, editCourse }: AddCourseModalProps) {
    const [name, setName] = useState('');
    const [lecturesCount, setLecturesCount] = useState(1);
    const [link, setLink] = useState('');
    const [bookLink, setBookLink] = useState('');
    const [categoryId, setCategoryId] = useState('');

    const { data: categories = [] } = useCourseCategories();
    const addCategoryMutation = useAddCategory();
    const deleteCategoryMutation = useDeleteCategory();

    const [newCategoryName, setNewCategoryName] = useState('');
    const [showCategoryInput, setShowCategoryInput] = useState(false);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (editCourse) {
            setName(editCourse.name);
            setLecturesCount(editCourse.lecturesCount);
            setLink(editCourse.link);
            setBookLink(editCourse.bookLink || '');
            setCategoryId(editCourse.categoryId || '');
            setImagePreview(editCourse.imageUrl || '');
        } else {
            setName('');
            setLecturesCount(1);
            setLink('');
            setBookLink('');
            setCategoryId('');
            setImagePreview('');
        }
        setImageFile(null);
    }, [editCourse, isOpen]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
            return;
        }

        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            alert('يرجى اختيار صورة من نوع PNG أو JPG أو WebP');
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        if (imagePreview && !editCourse?.imageUrl) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(editCourse?.imageUrl ? '' : '');
    };

    const uploadImage = async (): Promise<string | null> => {
        if (!imageFile) return imagePreview || null;

        const ext = imageFile.name.split('.').pop();
        const filePath = `courses/${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage
            .from('course-images')
            .upload(filePath, imageFile);

        if (error) {
            console.error('Error uploading image:', error);
            throw new Error('فشل رفع الصورة');
        }

        const { data: { publicUrl } } = supabase.storage
            .from('course-images')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const addMutation = useAddCourse();
    const updateMutation = useUpdateCourse();

    const isEditing = !!editCourse;
    const mutation = isEditing ? updateMutation : addMutation;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        let imageUrl: string | null | undefined = undefined;
        try {
            imageUrl = await uploadImage();
        } catch (err: any) {
            console.error('فشل رفع الصورة:', err);
        }

        try {
            const payload = { name, lecturesCount, link, imageUrl, bookLink: bookLink || undefined, categoryId: categoryId || undefined };
            if (isEditing) {
                await updateMutation.mutateAsync({ id: editCourse.id, ...payload });
            } else {
                await addMutation.mutateAsync(payload);
            }
            onClose();
        } catch (err: any) {
            console.error('خطأ في حفظ الدورة:', err);
            alert('حدث خطأ أثناء حفظ الدورة، يرجى المحاولة مرة أخرى');
        } finally {
            setUploading(false);
        }
    };

    const handleAddCategory = () => {
        const trimmed = newCategoryName.trim();
        if (!trimmed) return;
        addCategoryMutation.mutate(trimmed, {
            onSuccess: (id) => {
                if (id) setCategoryId(id);
                setNewCategoryName('');
                setShowCategoryInput(false);
            }
        });
    };

    const handleDeleteCategory = (catId: string, catName: string) => {
        if (confirm(`هل أنت متأكد من حذف القسم "${catName}"؟`)) {
            deleteCategoryMutation.mutate(catId);
            if (categoryId === catId) setCategoryId('');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'تعديل الدورة' : 'إضافة دورة جديدة'}>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <Input
                    label="اسم الدورة"
                    placeholder="مثال: دورة تجويد القرآن"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <Input
                    label="عدد المحاضرات"
                    type="number"
                    min="1"
                    placeholder="10"
                    value={lecturesCount}
                    onChange={(e) => setLecturesCount(Number(e.target.value))}
                    required
                />

                {/* القسم */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 block">القسم</label>
                    <div className="flex gap-2">
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="flex-1 h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/10 appearance-none"
                        >
                            <option value="">بدون قسم</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => setShowCategoryInput(!showCategoryInput)}
                            className="h-12 px-4 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0"
                        >
                            <Plus size={16} />
                            إدارة
                        </button>
                    </div>

                    {/* إضافة/مسح الأقسام */}
                    {showCategoryInput && (
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100 mt-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="اسم القسم الجديد..."
                                    className="flex-1 h-10 bg-white border border-gray-100 rounded-xl px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/10"
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCategory}
                                    disabled={addCategoryMutation.isPending || !newCategoryName.trim()}
                                    className="h-10 px-4 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-1 disabled:opacity-50 shrink-0"
                                >
                                    {addCategoryMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    إضافة
                                </button>
                            </div>
                            {categories.length > 0 && (
                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                    {categories.map((cat) => (
                                        <div key={cat.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-gray-50">
                                            <div className="flex items-center gap-2">
                                                <BookOpen size={14} className="text-purple-400" />
                                                <span className="text-xs font-bold text-gray-700">{cat.name}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 block">الرابط</label>
                    <input
                        required
                        type="url"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        placeholder="https://youtube.com/..."
                        dir="ltr"
                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-left font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/10"
                    />
                    <p className="text-xs text-gray-400">رابط الدورة على يوتيوب أو تليجرام</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 block">رابط الكتاب</label>
                    <input
                        type="url"
                        value={bookLink}
                        onChange={(e) => setBookLink(e.target.value)}
                        placeholder="https://..."
                        dir="ltr"
                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-left font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/10"
                    />
                    <p className="text-xs text-gray-400">رابط الكتاب الخاص بالدورة (اختياري)</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 block">صورة الدورة</label>
                    <div className="flex items-center gap-4">
                        {imagePreview ? (
                            <div className="relative w-20 h-20 shrink-0">
                                <img
                                    src={imagePreview}
                                    alt="صورة الدورة"
                                    className="w-full h-full object-cover rounded-2xl border border-gray-100"
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <label className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 hover:border-purple-200 transition-colors shrink-0">
                                <Image size={20} className="text-gray-300" />
                                <span className="text-[8px] text-gray-400 font-bold mt-1">إضافة</span>
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />
                            </label>
                        )}
                        <p className="text-[10px] text-gray-400 font-medium">PNG, JPG, WebP • حد أقصى 5MB</p>
                    </div>
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20"
                        disabled={mutation.isPending || uploading}
                    >
                        {mutation.isPending || uploading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>جاري الحفظ...</span>
                            </div>
                        ) : isEditing ? 'حفظ التعديلات' : 'إضافة الدورة'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
