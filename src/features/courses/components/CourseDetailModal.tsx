"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, BookOpen, Users, BarChart3, CheckCircle, Clock, Search, Award, GraduationCap, Headphones } from 'lucide-react';
import Modal from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useAuthStore } from '@/store/useAuthStore';
import dynamic from 'next/dynamic';
import { Course, Student } from '@/types';

const StudentDetailModal = dynamic(() => import('@/features/students/components/StudentDetailModal'), { ssr: false });

interface Props {
    course: Course;
    isOpen: boolean;
    onClose: () => void;
}

export default function CourseDetailModal({ course, isOpen, onClose }: Props) {
    const { data: groups } = useGroups();
    const user = useAuthStore((s) => s.user);
    const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'followup'>('students');
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in-progress'>('all');
    const [teacherFilter, setTeacherFilter] = useState('all');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const isTeacher = user?.role === 'teacher';

    const { data: students = [], isLoading } = useQuery({
        queryKey: ['course-progress', course.id],
        queryFn: async () => {
            const res = await fetch(`/api/courses/progress?courseId=${encodeURIComponent(course.id)}`);
            if (!res.ok) return [];
            return res.json();
        },
        enabled: isOpen,
    });

    const courseGroups = groups?.filter((g: any) => g.courseId === course.id) || [];
    const teacherGroupIds = isTeacher
        ? courseGroups.filter((g: any) => g.teacherId === user?.teacherId).map((g: any) => g.id)
        : [];
    const teachers = [...new Set(students.map((s: any) => s.teacherName).filter(Boolean))] as string[];

    const filteredStudents = students.filter((s: any) => {
        if (isTeacher && !teacherGroupIds.includes(s.groupId)) return false;
        if (statusFilter === 'completed' && !s.courseCompletedAt) return false;
        if (statusFilter === 'in-progress' && s.courseCompletedAt) return false;
        if (teacherFilter !== 'all' && s.teacherName !== teacherFilter) return false;
        return true;
    });

    const teacherStats = teachers.map((t) => {
        const total = students.filter((s: any) => s.teacherName === t).length;
        const completed = students.filter((s: any) => s.teacherName === t && s.courseCompletedAt).length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { name: t, total, completed, pct };
    });

    const allTabs = [
        { id: 'students' as const, label: 'الطلاب المشتركين', icon: Users },
        { id: 'teachers' as const, label: 'مقارنة المدرسين', icon: GraduationCap },
        { id: 'followup' as const, label: 'المتابعات', icon: Headphones },
    ];
    const tabs = isTeacher ? allTabs.filter(t => t.id !== 'teachers') : allTabs;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={course.name} className="max-w-3xl h-[90vh] md:h-auto">
            {/* تبويبات رئيسية */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                            activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
                        )}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'students' && (
                <div className="space-y-4">
                    {/* الفلاتر */}
                    <div className="flex gap-2 flex-wrap">
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as any)}
                            className="h-9 rounded-xl text-xs font-bold px-3 border-gray-100 bg-white"
                        >
                            <option value="all">الكل</option>
                            <option value="completed">مكتمل</option>
                            <option value="in-progress">مستمر</option>
                        </select>
                        {!isTeacher && (
                            <select
                                value={teacherFilter}
                                onChange={e => setTeacherFilter(e.target.value)}
                                className="h-9 rounded-xl text-xs font-bold px-3 border-gray-100 bg-white"
                            >
                                <option value="all">جميع المدرسين</option>
                                {teachers.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        )}
                        <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1 mr-auto">
                            <Users size={12} />
                            {filteredStudents.length} طالب
                        </div>
                    </div>

                    {/* قائمة الطلاب */}
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-400 text-xs font-bold">جاري التحميل...</div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-xs font-bold">لا يوجد طلاب</div>
                    ) : (
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {filteredStudents.map((s: any) => {
                                const pct = course.lecturesCount > 0
                                    ? Math.min(Math.round((s.lecturesTested / course.lecturesCount) * 100), 100)
                                    : 0;
                                const isCompleted = !!s.courseCompletedAt;

                                return (
                                    <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                                                    <BookOpen size={16} className="text-purple-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900">{s.fullName}</p>
                                                    <p className="text-[10px] font-black text-gray-700">{s.teacherName || 'بدون مشرف'} • {s.groupName}</p>
                                                </div>
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-black px-2.5 py-1 rounded-lg border flex items-center gap-1",
                                                isCompleted
                                                    ? "bg-green-50 text-green-600 border-green-100"
                                                    : "bg-blue-50 text-blue-600 border-blue-100"
                                            )}>
                                                {isCompleted ? <CheckCircle size={11} /> : <Clock size={11} />}
                                                {isCompleted ? 'تمت' : 'مستمرة'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-green-500" : "bg-purple-500")}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500 min-w-[40px] text-left">{pct}%</span>
                                        </div>

                                        {s.courseFinalGrade && (
                                            <div className="mt-2 flex items-center gap-1.5">
                                                <Award size={11} className="text-amber-500" />
                                                <span className={cn(
                                                    "text-[10px] font-black px-2 py-0.5 rounded",
                                                    s.courseFinalGrade === 'ممتاز' && "bg-green-50 text-green-600",
                                                    s.courseFinalGrade === 'جيد جداً' && "bg-blue-50 text-blue-600",
                                                    s.courseFinalGrade === 'جيد' && "bg-amber-50 text-amber-600"
                                                )}>
                                                    {s.courseFinalGrade}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'teachers' && (
                <div className="space-y-3">
                    {teacherStats.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-xs font-bold">لا يوجد مدرسون</div>
                    ) : (
                        teacherStats.map(t => (
                            <div key={t.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                                            <GraduationCap size={16} className="text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{t.name}</p>
                                            <p className="text-[10px] font-bold text-gray-500">إجمالي الطلاب: {t.total}</p>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-lg font-black text-green-600">{t.completed}</p>
                                        <p className="text-[10px] text-gray-500 font-bold">منجز</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-green-500 transition-all"
                                            style={{ width: `${t.pct}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500 min-w-[40px] text-left">{t.pct}%</span>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                                    <div className="bg-gray-50 rounded-xl py-2">
                                        <p className="text-xs font-black text-gray-700">{t.total - t.completed}</p>
                                        <p className="text-[9px] text-gray-400 font-bold">مستمر</p>
                                    </div>
                                    <div className="bg-green-50 rounded-xl py-2">
                                        <p className="text-xs font-black text-green-600">{t.completed}</p>
                                        <p className="text-[9px] text-green-500 font-bold">مكتمل</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'followup' && (
                <div className="space-y-4">
                    {/* الفلاتر */}
                    <div className="flex gap-2 flex-wrap">
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as any)}
                            className="h-9 rounded-xl text-xs font-bold px-3 border-gray-100 bg-white"
                        >
                            <option value="all">الكل</option>
                            <option value="completed">مكتمل</option>
                            <option value="in-progress">مستمر</option>
                        </select>
                        {!isTeacher && (
                            <select
                                value={teacherFilter}
                                onChange={e => setTeacherFilter(e.target.value)}
                                className="h-9 rounded-xl text-xs font-bold px-3 border-gray-100 bg-white"
                            >
                                <option value="all">جميع المدرسين</option>
                                {teachers.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        )}
                        <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1 mr-auto">
                            <Headphones size={12} />
                            {filteredStudents.length} طالب
                        </div>
                    </div>

                    {/* قائمة الطلاب مع تقدم الاستماع */}
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-400 text-xs font-bold">جاري التحميل...</div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-xs font-bold">لا يوجد طلاب</div>
                    ) : (
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {filteredStudents.map((s: any) => {
                                const pct = course.lecturesCount > 0
                                    ? Math.min(Math.round((s.totalListened || 0) / course.lecturesCount * 100), 100)
                                    : 0;
                                const isCompleted = pct >= 100;

                                return (
                                    <div key={s.id}
                                        onClick={() => setSelectedStudent({ id: s.id, fullName: s.fullName } as Student)}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-purple-200 transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                                                    <Headphones size={16} className="text-purple-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 hover:text-purple-600 transition-colors">{s.fullName}</p>
                                                    <p className="text-[10px] font-black text-gray-700">{s.teacherName || 'بدون مشرف'} • {s.groupName}</p>
                                                </div>
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-black px-2.5 py-1 rounded-lg border flex items-center gap-1",
                                                isCompleted
                                                    ? "bg-green-50 text-green-600 border-green-100"
                                                    : "bg-blue-50 text-blue-600 border-blue-100"
                                            )}>
                                                {isCompleted ? <CheckCircle size={11} /> : <Clock size={11} />}
                                                {isCompleted ? 'مكتمل' : 'مستمر'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-green-500" : "bg-purple-500")}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500 min-w-[40px] text-left">
                                                {s.totalListened || 0}/{course.lecturesCount}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* نافذة تفاصيل الطالب */}
            {selectedStudent && (
                <StudentDetailModal
                    student={selectedStudent}
                    isOpen={!!selectedStudent}
                    onClose={() => setSelectedStudent(null)}
                    initialTab="followup"
                />
            )}
        </Modal>
    );
}
