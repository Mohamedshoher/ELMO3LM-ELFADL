"use client";

import { Course } from '@/types';
import { BookOpen, Play, Trash2, ExternalLink, Pencil, Book } from 'lucide-react';
import { useDeleteCourse } from '../hooks/useCourses';
import { useCourseCategories } from '../hooks/useCourseCategories';

interface CourseCardProps {
    course: Course;
    onClick?: () => void;
    onEdit?: () => void;
    canModify?: boolean;
}

export default function CourseCard({ course, onClick, onEdit, canModify = true }: CourseCardProps) {
    const deleteMutation = useDeleteCourse();
    const { data: categories = [] } = useCourseCategories();
    const categoryName = categories.find(c => c.id === course.categoryId)?.name;

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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={onClick}>
            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0">
                        <BookOpen size={22} className="text-purple-600" />
                    </div>
                    {canModify && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                                onClick={handleEditClick}
                                className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-purple-500 hover:bg-purple-50 rounded-xl transition-all"
                                title="تعديل الدورة"
                            >
                                <Pencil size={16} />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="حذف الدورة"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </div>

                <h3 className="text-base font-black text-gray-900 mb-3 line-clamp-2">{course.name}</h3>

                <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Play size={14} />
                        <span className="font-bold">{course.lecturesCount} محاضرات</span>
                    </div>
                </div>

                {categoryName && (
                    <div className="mb-3">
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-lg">
                            {categoryName}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                    <a
                        href={course.link}
                        target="_blank"
                        rel="noopener noreferrer"
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
