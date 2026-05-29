"use client";

import { Course } from '@/types';
import { BookOpen, Play, Trash2, ExternalLink } from 'lucide-react';
import { useDeleteCourse } from '../hooks/useCourses';

interface CourseCardProps {
    course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
    const deleteMutation = useDeleteCourse();

    const handleDelete = () => {
        if (confirm(`هل أنت متأكد من حذف "${course.name}"؟`)) {
            deleteMutation.mutate(course.id);
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0">
                        <BookOpen size={22} className="text-purple-600" />
                    </div>
                    <button
                        onClick={handleDelete}
                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="حذف الدورة"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

                <h3 className="text-base font-black text-gray-900 mb-3 line-clamp-2">{course.name}</h3>

                <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Play size={14} />
                        <span className="font-bold">{course.lecturesCount} محاضرات</span>
                    </div>
                </div>

                <a
                    href={course.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${platformColor} hover:brightness-95`}
                >
                    <ExternalLink size={12} />
                    {platform}
                </a>
            </div>
        </div>
    );
}
