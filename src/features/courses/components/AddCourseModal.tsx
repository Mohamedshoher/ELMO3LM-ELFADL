"use client";

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2, BookOpen } from 'lucide-react';
import { useAddCourse, useUpdateCourse } from '../hooks/useCourses';
import { useCourseCategories, useAddCategory, useDeleteCategory } from '../hooks/useCourseCategories';
import { Course } from '@/types';
import { cn } from '@/lib/utils';

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

    useEffect(() => {
        if (editCourse) {
            setName(editCourse.name);
            setLecturesCount(editCourse.lecturesCount);
            setLink(editCourse.link);
            setBookLink(editCourse.bookLink || '');
            setCategoryId(editCourse.categoryId || '');
        } else {
            setName('');
            setLecturesCount(1);
            setLink('');
            setBookLink('');
            setCategoryId('');
        }
    }, [editCourse, isOpen]);

    const addMutation = useAddCourse();
    const updateMutation = useUpdateCourse();

    const isEditing = !!editCourse;
    const mutation = isEditing ? updateMutation : addMutation;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { name, lecturesCount, link, bookLink: bookLink || undefined, categoryId: categoryId || undefined };
        if (isEditing) {
            updateMutation.mutate({ id: editCourse.id, ...payload }, {
                onSuccess: () => { onClose(); }
            });
        } else {
            addMutation.mutate(payload, {
                onSuccess: () => { onClose(); }
            });
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

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? (
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
