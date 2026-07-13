"use client";

import { useState } from 'react';
import { Course } from '@/types';
import { BookOpen, Play, Trash2, ExternalLink, Pencil, Book, Check, X } from 'lucide-react';
import { useDeleteCourse, useUpdateCourse } from '../hooks/useCourses';
import { useCourseCategories } from '../hooks/useCourseCategories';

interface CourseCardProps {
    course: Course;
    onClick?: () => void;
    onEdit?: () => void;
    canModify?: boolean;
}

export default function CourseCard({ course, onClick, onEdit, canModify = true }: CourseCardProps) {
    const deleteMutation = useDeleteCourse();
    const updateMutation = useUpdateCourse();
    const { data: categories = [] } = useCourseCategories();
    const categoryName = categories.find(c => c.id === course.categoryId)?.name;

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(course.name);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`هل أنت متأكد من حذف "${course.name}"؟`)) {
            deleteMutation.mutate(course.id);
        }
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit?.();
    };

    const startInlineEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditName(course.name);
        setIsEditing(true);
    };

    const saveInlineEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        const trimmed = editName.trim();
        if (trimmed && trimmed !== course.name) {
            updateMutation.mutate({ id: course.id, name: trimmed });
        }
        setIsEditing(false);
    };

    const cancelInlineEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditName(course.name);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const trimmed = editName.trim();
            if (trimmed && trimmed !== course.name) {
                updateMutation.mutate({ id: course.id, name: trimmed });
            }
            setIsEditing(false);
        }
        if (e.key === 'Escape') {
            setEditName(course.name);
            setIsEditing(false);
        }
    };

    const getDomain = (url: string) => {
        try {
            const host = new URL(url).hostname;
            if (host.includes('youtube') || host.includes('youtu.be')) return 'يوتيوب';
            if (host.includes('telegram') || host.includes('t.me')) return 'تليجرام';
            return host;
        } catch { return 'رابط'; }
    };

    const platform = getDomain(course.link);
    const platformColor = platform === 'يوتيوب'
        ? 'bg-red-50 text-red-600 border-red-100'
        : platform === 'تليجرام'
            ? 'bg-blue-50 text-blue-600 border-blue-100'
            : 'bg-gray-50 text-gray-600 border-gray-100';

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer overflow-hidden" onClick={onClick}>
            {/* الصورة كخلفية رئيسية */}
            {course.imageUrl ? (
                <div className="relative h-40 sm:h-48 bg-gray-100">
                    <img src={course.imageUrl} alt={course.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    {canModify && (
                        <div className="absolute top-3 left-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={handleEditClick} className="w-8 h-8 bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-600 hover:text-purple-600 rounded-xl transition-all shadow-sm" title="تعديل الدورة">
                                <Pencil size={14} />
                            </button>
                            <button onClick={handleDelete} className="w-8 h-8 bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-600 hover:text-red-600 rounded-xl transition-all shadow-sm" title="حذف الدورة">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative h-32 sm:h-36 bg-gradient-to-l from-purple-500 to-violet-600 flex items-center justify-center">
                    <BookOpen size={48} className="text-white/30" />
                    {canModify && (
                        <div className="absolute top-3 left-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={handleEditClick} className="w-8 h-8 bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-600 hover:text-purple-600 rounded-xl transition-all shadow-sm" title="تعديل الدورة">
                                <Pencil size={14} />
                            </button>
                            <button onClick={handleDelete} className="w-8 h-8 bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-600 hover:text-red-600 rounded-xl transition-all shadow-sm" title="حذف الدورة">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="p-4 sm:p-5">
                {isEditing ? (
                    <div className="flex items-center gap-1 mb-3" onClick={e => e.stopPropagation()}>
                        <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 text-base font-black text-gray-900 bg-gray-50 border border-purple-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-purple-300"
                            autoFocus
                        />
                        <button onClick={saveInlineEdit} className="w-7 h-7 flex items-center justify-center bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shrink-0">
                            <Check size={14} />
                        </button>
                        <button onClick={cancelInlineEdit} className="w-7 h-7 flex items-center justify-center bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-300 transition-colors shrink-0">
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 mb-3 group/name">
                        <h3 className="text-base font-black text-gray-900 line-clamp-2 flex-1">{course.name}</h3>
                        {canModify && (
                            <button onClick={startInlineEdit} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-all opacity-0 group-hover/name:opacity-100 shrink-0" title="تعديل الاسم">
                                <Pencil size={12} />
                            </button>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Play size={14} />
                        <span className="font-bold">{course.lecturesCount} محاضرات</span>
                    </div>
                    {categoryName && (
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-lg">
                            {categoryName}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <a
                        href={course.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${platformColor} hover:brightness-95`}
                    >
                        <ExternalLink size={12} />
                        {platform}
                    </a>
                    {course.bookLink && (
                        <a
                            href={course.bookLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-100 bg-amber-50 text-amber-600 hover:brightness-95 transition-colors"
                        >
                            <Book size={12} />
                            الكتاب
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
