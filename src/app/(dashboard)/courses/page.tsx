"use client";

import { useState } from 'react';
import { useCourses } from '@/features/courses/hooks/useCourses';
import CourseCard from '@/features/courses/components/CourseCard';
import AddCourseModal from '@/features/courses/components/AddCourseModal';
import { BookOpen, Plus, Loader2 } from 'lucide-react';
import { FadeIn } from '@/components/ui/transition';

export default function CoursesPage() {
    const { data: courses, isLoading } = useCourses();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    return (
        <div className="w-full">
            <div className="sticky top-0 z-30 bg-gray-50/80 backdrop-blur-md border-b border-gray-100">
                <div className="px-4 md:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center">
                                <BookOpen size={20} className="text-purple-600" />
                            </div>
                            <div>
                                <h1 className="text-lg font-black text-gray-900">الدورات</h1>
                                <p className="text-xs text-gray-500 font-bold">{courses?.length || 0} دورة</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="h-10 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} />
                            إضافة دورة
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={32} className="text-purple-600 animate-spin" />
                    </div>
                ) : !courses || courses.length === 0 ? (
                    <FadeIn show={true}>
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <BookOpen size={36} className="text-purple-300" />
                            </div>
                            <h2 className="text-lg font-black text-gray-400 mb-2">لا توجد دورات بعد</h2>
                            <p className="text-sm text-gray-400">أضف أول دورة الآن</p>
                        </div>
                    </FadeIn>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {courses.map((course) => (
                            <FadeIn key={course.id} show={true}>
                                <CourseCard course={course} />
                            </FadeIn>
                        ))}
                    </div>
                )}
            </div>

            <AddCourseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        </div>
    );
}
