"use client";

import { useState, useMemo } from 'react';
import { useCourses } from '@/features/courses/hooks/useCourses';
import { useCourseCategories } from '@/features/courses/hooks/useCourseCategories';
import CourseCard from '@/features/courses/components/CourseCard';
import AddCourseModal from '@/features/courses/components/AddCourseModal';
import CourseDetailModal from '@/features/courses/components/CourseDetailModal';
import { BookOpen, Plus, Loader2, SlidersHorizontal } from 'lucide-react';
import { FadeIn } from '@/components/ui/transition';
import { Course } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

export default function CoursesPage() {
    const { data: courses, isLoading } = useCourses();
    const { data: categories = [] } = useCourseCategories();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'director' || user?.role === 'supervisor';
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editCourse, setEditCourse] = useState<Course | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [categoryFilter, setCategoryFilter] = useState('الكل');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const getCategoryName = (course: Course) => {
        const cat = categories.find(c => c.id === course.categoryId);
        return cat?.name || '';
    };

    const filteredCourses = useMemo(() => {
        if (!courses) return [];
        if (categoryFilter === 'الكل') return courses;
        return courses.filter(c => c.categoryId === categoryFilter);
    }, [courses, categoryFilter]);

    const uniqueCategories = useMemo(() => {
        if (!courses || !categories) return [];
        const usedIds = new Set(courses.map(c => c.categoryId).filter(Boolean));
        return categories.filter(c => usedIds.has(c.id));
    }, [courses, categories]);

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
                        <div className="flex items-center gap-2">
                            {uniqueCategories.length > 0 && (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className={cn(
                                            "h-10 w-10 rounded-xl border flex items-center justify-center transition-all",
                                            isFilterOpen || categoryFilter !== 'الكل' ? "bg-purple-50 border-purple-200 text-purple-600" : "bg-gray-50 border-gray-100 text-gray-400 hover:text-purple-600"
                                        )}
                                    >
                                        <SlidersHorizontal size={18} />
                                    </button>
                                    {isFilterOpen && (
                                        <div className="absolute top-[115%] left-0 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 z-50 min-w-[160px]">
                                            <button
                                                onClick={() => { setCategoryFilter('الكل'); setIsFilterOpen(false); }}
                                                className={cn(
                                                    "w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-colors mb-1",
                                                    categoryFilter === 'الكل' ? "bg-purple-50 text-purple-600" : "text-gray-600 hover:bg-gray-50"
                                                )}
                                            >
                                                الكل
                                            </button>
                                            {uniqueCategories.map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => { setCategoryFilter(cat.id); setIsFilterOpen(false); }}
                                                    className={cn(
                                                        "w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-colors mb-1",
                                                        categoryFilter === cat.id ? "bg-purple-50 text-purple-600" : "text-gray-600 hover:bg-gray-50"
                                                    )}
                                                >
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {isAdmin && (
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="h-10 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
                                >
                                    <Plus size={18} />
                                    إضافة دورة
                                </button>
                            )}
                        </div>
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
                            {isAdmin && <p className="text-sm text-gray-400">أضف أول دورة الآن</p>}
                        </div>
                    </FadeIn>
                ) : filteredCourses.length === 0 ? (
                    <FadeIn show={true}>
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <BookOpen size={36} className="text-purple-300" />
                            </div>
                            <h2 className="text-lg font-black text-gray-400 mb-2">لا توجد دورات في هذا القسم</h2>
                        </div>
                    </FadeIn>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredCourses.map((course) => (
                            <FadeIn key={course.id} show={true}>
                                <CourseCard course={course} onClick={() => setSelectedCourse(course)} onEdit={isAdmin ? () => setEditCourse(course) : undefined} canModify={isAdmin} />
                            </FadeIn>
                        ))}
                    </div>
                )}
            </div>

            <AddCourseModal isOpen={isAddModalOpen || !!editCourse} onClose={() => { setIsAddModalOpen(false); setEditCourse(null); }} editCourse={editCourse} />
            {selectedCourse && (
                <CourseDetailModal
                    course={selectedCourse}
                    isOpen={true}
                    onClose={() => setSelectedCourse(null)}
                />
            )}
        </div>
    );
}
