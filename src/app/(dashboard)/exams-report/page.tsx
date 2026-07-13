"use client";

import { useState, useMemo } from 'react';
import {
    Trophy,
    TrendingUp,
    ChevronDown,
    Bell,
    Share2,
    ChevronRight,
    ChevronLeft,
    User,
    AlertCircle,
    Calendar,
    MessageCircle,
    Headphones,
    BookOpen,
    BarChart3,
    Book
} from 'lucide-react';
import { cn, getWhatsAppUrl } from '@/lib/utils';
import { FadeIn } from '@/components/ui/transition';

// --- استيراد الـ Hooks والـ Stores الخاصة بالتطبيق ---
import { useStudents } from '@/features/students/hooks/useStudents';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useTeachers } from '@/features/teachers/hooks/useTeachers';
import { useAuthStore } from '@/store/useAuthStore';

import dynamic from 'next/dynamic';
import { useAllExams } from '@/features/students/hooks/useAllExams';
import { useAllListens } from '@/features/students/hooks/useAllListens';
import { useCourses } from '@/features/courses/hooks/useCourses';

const StudentDetailModal = dynamic(() => import('@/features/students/components/StudentDetailModal'), { ssr: false });

// --- تعريف الأنواع والقواميس المساعدة ---
type TabType = 'notTested' | 'mostTested' | 'performance' | 'followUp';



export default function ExamsReportPage() {
    // --- 1. جلب البيانات الأساسية من الـ Hooks ---
    const { data: students } = useStudents();
    const { data: groups } = useGroups();
    const { data: teachers } = useTeachers();
    const { user } = useAuthStore();

    // --- 2. إعدادات الفلترة والأذونات ---
    // إذا كان المستخدم "مدرس"، نقوم بتصفية المجموعات لتظهر مجموعاته فقط
    const filteredGroupsList = groups?.filter((g: any) => {
        if (user?.role === 'teacher') return g.teacherId === user.teacherId;
        if (user?.role === 'supervisor') {
            const sections = user.responsibleSections || [];
            return sections.some(section => g.name.includes(section));
        }
        return true;
    }) || [];
    const assignedGroupIds = filteredGroupsList.map((g: any) => g.id);
    const relevantStudentIds = useMemo(() => {
        if (!students || user?.role === 'director') return undefined;
        return students.filter(s => (s.groupIds?.some((gid: string) => assignedGroupIds.includes(gid)) || (s.groupId && assignedGroupIds.includes(s.groupId)))).map(s => s.id);
    }, [students, assignedGroupIds, user?.role]);

    // --- 3. حالات الصفحة (State Management) ---
    const [activeTab, setActiveTab] = useState<TabType>('performance'); // التبويب النشط
    const [selectedGroupId, setSelectedGroupId] = useState('all'); // المجموعة المختارة للفلترة
    const [examsLimit, setExamsLimit] = useState('1'); // الحد الأدنى للاختبارات (لتبويب الأكثر اختباراً)

    // --- 4. إدارة الوقت والتاريخ ---
    const [selectedDate, setSelectedDate] = useState(new Date()); // التاريخ المختار للتقارير الشهرية
    const [selectedHalf, setSelectedHalf] = useState<1 | 2>(new Date().getDate() <= 15 ? 1 : 2); // نصف الشهر المختار
    const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<any>(null); // الطالب المختار لعرض تفاصيله

    // تحويل التاريخ إلى مفتاح (مثل 2023-10) لجلب بيانات الاختبارات من السيرفر
    const monthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
    const { data: allExams = [] } = useAllExams(monthKey, selectedHalf, relevantStudentIds);
    const { data: allListens = [] } = useAllListens(monthKey, selectedHalf, relevantStudentIds);
    const { data: courses = [] } = useCourses();

    // تسميات الشهور باللغة العربية
    const currentMonthLabel = selectedDate.toLocaleDateString('ar-EG', { month: 'long' });
    const monthLabelWithYear = selectedDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });

    // التنقل بين الشهور
    const goToPreviousMonth = () => {
        const d = new Date(selectedDate);
        d.setMonth(d.getMonth() - 1);
        setSelectedDate(d);
    };

    const goToNextMonth = () => {
        const d = new Date(selectedDate);
        d.setMonth(d.getMonth() + 1);
        setSelectedDate(d);
    };

    const isCurrentMonth = useMemo(() => {
        const now = new Date();
        return now.getMonth() === selectedDate.getMonth() && now.getFullYear() === selectedDate.getFullYear();
    }, [selectedDate]);

    // --- 5. منطق حساب البيانات (Business Logic) باستخدام useMemo لتحسين الأداء ---



    // --- دالة مساعدة لحساب تقدم الطالب في الدورة ---
    const getStudentCourseProgress = useMemo(() => {
        return (student: any) => {
            const group = groups?.find((g: any) => g.id === (student.groupId ?? student.groupIds?.[0] ?? null));
            const course = courses?.find((c: any) => c.id === group?.courseId);
            if (!course) return { course: null, totalCompleted: 0, totalRequired: 0, remaining: 0, progress: 0 };

            const courseExams = allExams.filter((e: any) => e.courseId === course.id && e.studentId === student.id);
            const courseListens = allListens.filter((l: any) => l.courseId === course.id && l.studentId === student.id);
            const testedLectures = courseExams.reduce((sum: number, e: any) => sum + (e.lecturesTested || 0), 0);
            const listenedLectures = courseListens.reduce((sum: number, l: any) => sum + (l.lecturesCount || 1), 0);
            const totalCompleted = testedLectures + listenedLectures;
            const totalRequired = course.lecturesCount || 0;
            const remaining = Math.max(0, totalRequired - totalCompleted);
            const progress = totalRequired > 0 ? Math.min(Math.round((totalCompleted / totalRequired) * 100), 100) : 0;

            return { course, totalCompleted, totalRequired, remaining, progress };
        };
    }, [groups, courses, allExams, allListens]);

    // --- د- بيانات الطلاب غير المكتملين في نظام الدورات ---
    const courseNotCompletedStudents = useMemo(() => {
        let base = (students || []).filter((s: any) => s.status === 'active');

        if (selectedGroupId !== 'all') {
            base = base.filter((s: any) => s.groupIds?.includes(selectedGroupId) || s.groupId === selectedGroupId);
        } else if (user?.role === 'teacher' || user?.role === 'supervisor') {
            base = base.filter((s: any) => s.groupIds?.some((gid: string) => assignedGroupIds.includes(gid)) || (s.groupId && assignedGroupIds.includes(s.groupId)));
        }

        return base
            .map((s: any) => {
                const progress = getStudentCourseProgress(s);
                if (!progress.course) return null;
                const groupName = groups?.find((g: any) => g.id === (s.groupId ?? s.groupIds?.[0] ?? null))?.name || 'غير محدد';
                return {
                    ...s,
                    groupName,
                    ...progress,
                    rank: 0
                };
            })
            .filter((s: any) => s && s.remaining > 0)
            .map((s: any, i: number) => ({ ...s, rank: i + 1 }));
    }, [students, groups, selectedGroupId, user, assignedGroupIds, getStudentCourseProgress]);

    // --- هـ- الطلاب الأكثر اختباراً في نظام الدورات ---
    const courseMostTestedStudents = useMemo(() => {
        let base = (students || []).filter((s: any) => s.status === 'active');

        if (selectedGroupId !== 'all') {
            base = base.filter((s: any) => s.groupIds?.includes(selectedGroupId) || s.groupId === selectedGroupId);
        } else if (user?.role === 'teacher' || user?.role === 'supervisor') {
            base = base.filter((s: any) => s.groupIds?.some((gid: string) => assignedGroupIds.includes(gid)) || (s.groupId && assignedGroupIds.includes(s.groupId)));
        }

        return base
            .map((s: any) => {
                const group = groups?.find((g: any) => g.id === (s.groupId ?? s.groupIds?.[0] ?? null));
                const course = courses?.find((c: any) => c.id === group?.courseId);
                if (!course) return null;
                const groupName = group?.name || 'غير محدد';

                const courseExams = allExams.filter((e: any) => e.courseId === course.id && e.studentId === s.id);
                const totalTested = courseExams.reduce((sum: number, e: any) => sum + (e.lecturesTested || 0), 0);
                if (totalTested === 0) return null;
                const required = course.lecturesCount || 0;
                const pct = required > 0 ? Math.min(Math.round((totalTested / required) * 100), 100) : 0;

                return {
                    ...s,
                    groupName,
                    totalCompleted: totalTested,
                    totalRequired: required,
                    progress: pct,
                };
            })
            .filter((s: any) => s !== null)
            .sort((a: any, b: any) => b.totalCompleted - a.totalCompleted)
            .map((s: any, i: number) => ({ ...s, rank: i + 1 }));
    }, [students, groups, selectedGroupId, user, assignedGroupIds, allExams, courses]);

    // --- و- بيانات أداء المجموعات في نظام الدورات ---
    const coursePerformanceData = useMemo(() => {
        let baseGroups = (groups || []);
        if (user?.role === 'teacher' || user?.role === 'supervisor') {
            baseGroups = baseGroups.filter((g: any) => assignedGroupIds.includes(g.id));
        }

        if (selectedGroupId !== 'all') {
            baseGroups = baseGroups.filter((g: any) => g.id === selectedGroupId);
        }

        return baseGroups.map((g: any) => {
            const groupStudents = (students || []).filter((s: any) => (s.groupIds?.includes(g.id) || s.groupId === g.id) && s.status === 'active');
            let totalRequired = 0;
            let totalTested = 0;
            const studentDetails = groupStudents.map((s: any) => {
                const group = groups?.find((gr: any) => gr.id === (s.groupId ?? s.groupIds?.[0] ?? null));
                const course = courses?.find((c: any) => c.id === group?.courseId);
                if (!course) return null;

                const courseExams = allExams.filter((e: any) => e.courseId === course.id && e.studentId === s.id);
                const testedLectures = courseExams.reduce((sum: number, e: any) => sum + (e.lecturesTested || 0), 0);
                const required = course.lecturesCount || 0;
                const remaining = Math.max(0, required - testedLectures);
                const pct = required > 0 ? Math.min(Math.round((testedLectures / required) * 100), 100) : 0;
                const groupName = groups?.find((gr: any) => gr.id === (s.groupId ?? s.groupIds?.[0] ?? null))?.name || 'غير محدد';

                totalRequired += required;
                totalTested += testedLectures;

                return { ...s, groupName, course, totalCompleted: testedLectures, totalRequired: required, remaining, progress: pct };
            }).filter((s: any) => s !== null);

            const avgProgress = totalRequired > 0 ? Math.round((totalTested / totalRequired) * 100) : 0;

            return {
                id: g.id,
                name: g.name,
                totalStudents: studentDetails.length,
                totalRequired,
                totalCompleted: totalTested,
                avgProgress,
                studentDetails
            };
        }).filter((g: any) => g.totalStudents > 0);
    }, [groups, students, user, assignedGroupIds, allExams, courses, selectedGroupId]);

    // --- ز- بيانات متابعة الاستماع ---
    const listeningProgressData = useMemo(() => {
        let baseStudents = (students || []).filter((s: any) => s.status === 'active');

        if (selectedGroupId !== 'all') {
            baseStudents = baseStudents.filter((s: any) => s.groupIds?.includes(selectedGroupId) || s.groupId === selectedGroupId);
        } else if (user?.role === 'teacher' || user?.role === 'supervisor') {
            baseStudents = baseStudents.filter((s: any) => s.groupIds?.some((gid: string) => assignedGroupIds.includes(gid)) || (s.groupId && assignedGroupIds.includes(s.groupId)));
        }

        return baseStudents
            .map((s: any) => {
                const group = groups?.find((g: any) => g.id === (s.groupId ?? s.groupIds?.[0] ?? null));
                const course = courses?.find((c: any) => c.id === group?.courseId);
                if (!course) return null;

                const studentListens = allListens.filter((l: any) => l.studentId === s.id && (!l.courseId || l.courseId === course.id));
                const totalListened = studentListens.reduce((sum: number, l: any) => sum + (l.lecturesCount || 1), 0);
                const totalRequired = course.lecturesCount || 0;
                const progress = totalRequired > 0 ? Math.min(Math.round((totalListened / totalRequired) * 100), 100) : 0;
                const remaining = Math.max(0, totalRequired - totalListened);
                const groupName = group?.name || 'غير محدد';

                return {
                    ...s,
                    groupName,
                    courseName: course.name,
                    totalListened,
                    totalRequired,
                    progress,
                    remaining,
                    rank: 0
                };
            })
            .filter((s: any) => s !== null)
            .sort((a: any, b: any) => b.progress - a.progress)
            .map((s: any, i: number) => ({ ...s, rank: i + 1 }));
    }, [students, groups, courses, allListens, selectedGroupId, user, assignedGroupIds]);

    return (
        <div className="min-h-screen bg-gray-50/50 pb-24 text-right font-sans overflow-x-hidden" dir="rtl">

            {/* --- الهيدر (رأس الصفحة) --- */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 px-2 md:px-6 py-3">
                <div className="flex items-center max-w-4xl mx-auto gap-1 md:gap-4">
                    <h1 className="text-sm md:text-lg font-black text-gray-800 shrink-0">
                    تقدم الدورات <span className="md:inline hidden">({currentMonthLabel})</span>
                    </h1>

                    {/* مبدل النصف (للجوال) */}
                    <button 
                        onClick={() => setSelectedHalf(selectedHalf === 1 ? 2 : 1)}
                        className="md:hidden flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-1.5 py-1 shadow-sm"
                        title={selectedHalf === 1 ? 'النصف الأول' : 'النصف الثاني'}
                    >
                        <span className={cn("text-[9px] font-black transition-colors", selectedHalf === 1 ? "text-blue-600" : "text-gray-300")}>1</span>
                        <div className="relative w-5 h-3 rounded-full bg-gray-200">
                            <div className={cn("absolute top-0.5 w-2 h-2 rounded-full bg-blue-500 transition-all", selectedHalf === 1 ? "right-0.5" : "right-2.5")} />
                        </div>
                        <span className={cn("text-[9px] font-black transition-colors", selectedHalf === 2 ? "text-blue-600" : "text-gray-300")}>2</span>
                    </button>

                    {/* زر اختيار الشهر والنصف */}
                    <div className="flex bg-gray-100/50 p-1 rounded-xl items-center gap-1 border border-gray-100 flex-row-reverse mr-auto">
                        <div className="hidden md:flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm flex-row-reverse">
                            <button onClick={() => setSelectedHalf(1)} className={cn("px-2 py-1 text-xs font-bold rounded transition-colors", selectedHalf === 1 ? "bg-blue-50 text-blue-600" : "text-gray-500")}>النصف الأول</button>
                            <button onClick={() => setSelectedHalf(2)} className={cn("px-2 py-1 text-xs font-bold rounded transition-colors", selectedHalf === 2 ? "bg-blue-50 text-blue-600" : "text-gray-500")}>النصف الثاني</button>
                        </div>
                        <div className="flex items-center gap-0.5 md:gap-1 bg-white p-0.5 md:p-1 rounded-lg border border-gray-200 shadow-sm justify-center">
                            <button onClick={goToNextMonth} className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center hover:bg-gray-100 rounded text-gray-600 transition-colors">
                                <ChevronLeft size={12} />
                            </button>
                            <div className="flex items-center gap-0.5 md:gap-1.5 px-0.5 md:px-2">
                                <Calendar size={10} className="text-blue-500" />
                                <span className="text-[8px] md:text-xs font-black text-gray-700">{monthLabelWithYear}</span>
                            </div>
                            <button onClick={goToPreviousMonth} className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center hover:bg-gray-100 rounded text-gray-600 transition-colors">
                                <ChevronRight size={12} />
                            </button>
                        </div>
                    </div>

                    {/* شارة تقدم الدورات */}
                    <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] md:text-xs font-bold text-purple-600 bg-purple-50 px-2 md:px-3 py-1 rounded-md border border-purple-100">
                            <BarChart3 size={10} className="inline ml-0.5 md:ml-1" />الدورات
                        </span>
                    </div>
                </div>

                {/* --- شريط التنقل بين التبويبات --- */}
                <div className="max-w-4xl mx-auto mt-2 md:mt-4 flex bg-gray-100/80 p-0.5 md:p-1 rounded-xl gap-0.5 md:gap-1 overflow-x-auto no-scrollbar px-1 md:px-0">

                    <button
                        onClick={() => setActiveTab('performance')}
                        className={cn(
                            "flex-1 py-1.5 md:py-2.5 rounded-lg text-[10px] md:text-sm font-bold transition-all flex items-center justify-center gap-0.5 md:gap-1.5",
                            activeTab === 'performance' ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <TrendingUp size={12} />
                        الأداء
                    </button>
                    <button
                        onClick={() => setActiveTab('mostTested')}
                        className={cn(
                            "flex-1 py-1.5 md:py-2.5 rounded-lg text-[10px] md:text-sm font-bold transition-all flex items-center justify-center gap-0.5 md:gap-1.5",
                            activeTab === 'mostTested' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Trophy size={12} />
                        الأكثر
                        <span className={cn("text-[8px] md:text-[10px] font-black px-1 md:px-1.5 py-0.5 rounded-full font-sans", activeTab === 'mostTested' ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500")}>{courseMostTestedStudents.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('notTested')}
                        className={cn(
                            "flex-1 py-1.5 md:py-2.5 rounded-lg text-[10px] md:text-sm font-bold transition-all flex items-center justify-center gap-0.5 md:gap-1.5",
                            activeTab === 'notTested' ? "bg-white text-amber-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <AlertCircle size={12} />
                        غير مكتمل
                        <span className={cn("text-[8px] md:text-[10px] font-black px-1 md:px-1.5 py-0.5 rounded-full font-sans", activeTab === 'notTested' ? "bg-amber-100 text-amber-600" : "bg-gray-200 text-gray-500")}>{courseNotCompletedStudents.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('followUp')}
                        className={cn(
                            "flex-1 py-1.5 md:py-2.5 rounded-lg text-[10px] md:text-sm font-bold transition-all flex items-center justify-center gap-0.5 md:gap-1.5",
                            activeTab === 'followUp' ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Headphones size={12} />
                        المتابعات
                        <span className={cn("text-[8px] md:text-[10px] font-black px-1 md:px-1.5 py-0.5 rounded-full font-sans", activeTab === 'followUp' ? "bg-purple-100 text-purple-600" : "bg-gray-200 text-gray-500")}>{listeningProgressData.length}</span>
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-2 md:px-6 py-4 space-y-6">
                {/* --- التبويب 1: غير مكتمل --- */}
                {activeTab === 'notTested' && (
                    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                        <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-4">
                            <div className="flex flex-row-reverse items-center gap-1 md:gap-3 w-full md:w-auto flex-wrap justify-center">
                                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                                    الطلاب المسجلين في دورات ولم يكملوها بعد
                                </span>
                                <div className="relative">
                                    <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}
                                        className="appearance-none bg-white border border-gray-100 px-5 py-2 pr-3 rounded-lg md:rounded-2xl text-[10px] md:text-sm font-bold text-gray-600 focus:outline-none text-right">
                                        <option value="all">كل المجموعات</option>
                                        {filteredGroupsList?.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                    <ChevronDown size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1 mb-2">
                                <span className="text-xs font-bold text-gray-400">طلاب القائمة</span>
                                <span className="bg-amber-100 text-amber-700 text-xs font-black px-3 py-1 rounded-full font-sans">
                                    {courseNotCompletedStudents.length} طالب
                                </span>
                            </div>
                            {courseNotCompletedStudents.map((student: any) => (
                                <div key={student.id} onClick={() => setSelectedStudentForDetails(student)}
                                    className="bg-white rounded-[20px] p-3 flex items-center justify-between border border-gray-100 shadow-sm group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                                            <User size={18} />
                                        </div>
                                        <div className="text-right">
                                            <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors text-base">
                                                {student.fullName}
                                                <span className="text-[10px] text-purple-500 mr-2 font-normal">بقي {student.remaining} محاضرة</span>
                                            </h3>
                                            <span className="text-xs text-gray-400 font-bold">{student.groupName}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 bg-purple-50 px-2 py-1 rounded-lg">
                                            <span className="text-[10px] font-black text-purple-600 font-sans">{student.progress}%</span>
                                        </div>
                                        <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {courseNotCompletedStudents.length === 0 && (
                                <div className="text-center py-20 bg-white/40 rounded-[32px] border-2 border-dashed border-gray-100">
                                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Trophy size={32} />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-800">ممتاز! الكل أكمل الدورات</h3>
                                    <p className="text-sm text-gray-400 font-bold mt-1">جميع طلاب هذا الفلتر أكملوا متطلبات دوراتهم</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- التبويب 2: الأكثر تقدماً في الدورات --- */}
                {activeTab === 'mostTested' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1 mb-2">
                            <span className="text-[10px] md:text-xs font-bold text-gray-400">طلاب القائمة</span>
                            <span className="bg-blue-100 text-blue-700 text-[10px] md:text-xs font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full font-sans">
                                {courseMostTestedStudents.length} طالب
                            </span>
                        </div>
                        {courseMostTestedStudents.map((student: any) => (
                            <div key={student.id} onClick={() => setSelectedStudentForDetails(student)}
                                className="bg-white rounded-[16px] md:rounded-[20px] p-2.5 md:p-3 flex items-center justify-between border border-gray-100 shadow-sm group cursor-pointer">
                                <div className="flex-1 min-w-0 flex items-center gap-2 md:gap-3">
                                    <div className="w-7 h-7 md:w-9 md:h-9 bg-purple-50 rounded-[10px] md:rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                                        <User size={14} className="md:size-[18px]" />
                                    </div>
                                    <div className="text-right flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors text-sm md:text-base truncate">{student.fullName}</h3>
                                        <span className="text-[10px] md:text-xs text-gray-400 font-bold truncate block">{student.groupName}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                                    <div className="bg-purple-50 px-2 md:px-3 py-1 md:py-1.5 rounded-[8px] md:rounded-lg flex items-center gap-1 md:gap-2">
                                        <span className="text-purple-600 font-black text-xs md:text-sm font-sans">{student.totalCompleted}</span>
                                        <span className="text-[9px] md:text-xs text-purple-400 font-bold">/ {student.totalRequired}</span>
                                    </div>
                                    <button className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                        <ChevronRight size={12} className="md:size-[16px]" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- التبويب 3: أداء المجموعات --- */}
                {activeTab === 'performance' && (
                    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
                        {/* شريط الفلاتر */}
                        <div className="flex items-center justify-center gap-4 py-3 border-y border-gray-100 flex-wrap">
                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                                نسبة إنجاز الدورات لكل مجموعة
                            </span>
                            <div className="relative">
                                <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}
                                    className="appearance-none bg-white border border-gray-100 px-3 md:px-5 py-1.5 md:py-2 pr-2 md:pr-3 rounded-lg md:rounded-xl text-[9px] md:text-sm font-bold text-gray-600 focus:outline-none text-right cursor-pointer">
                                    <option value="all">كل المجموعات</option>
                                    {filteredGroupsList?.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* أشرطة التقدم */}
                        <div className="space-y-6">
                            {coursePerformanceData.map((data: any) => (
                                <div key={data.id} className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
                                    <div className="flex flex-row-reverse items-center justify-between">
                                        <span className="text-sm font-bold text-gray-700">{data.name}</span>
                                        <span className="text-xs font-black text-gray-400 font-sans">{data.totalStudents} طالب</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-gray-400 w-16 shrink-0 text-left">الإنجاز</span>
                                        <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner relative">
                                            <div style={{ width: `${data.avgProgress}%` }}
                                                className="absolute right-0 top-0 h-full bg-gradient-to-l from-purple-400 to-violet-500 rounded-full animate-[chartFill_0.7s_ease-out]" />
                                        </div>
                                        <span className="flex items-center gap-1 text-[11px] font-black text-gray-500 font-sans">
                                            <span className="text-purple-600">{data.totalCompleted}</span>
                                            <span className="text-gray-300">/</span>
                                            <span className="text-gray-400">{data.totalRequired}</span>
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold text-left">{data.avgProgress}%</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- التبويب 4: المتابعات (الاستماع) --- */}
                {activeTab === 'followUp' && (
                    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                                تقدم الاستماع للمحاضرات
                            </span>
                            <span className="text-xs font-black text-gray-500 font-sans">{listeningProgressData.length} طالب</span>
                        </div>
                        <div className="space-y-3">
                            {listeningProgressData.map((student: any) => (
                                <div key={student.id} onClick={() => setSelectedStudentForDetails(student)}
                                    className="bg-white rounded-[20px] p-3 border border-gray-100 shadow-sm group cursor-pointer">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 shrink-0">
                                                <Headphones size={18} />
                                            </div>
                                            <div className="text-right">
                                                <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors text-sm">
                                                    {student.fullName}
                                                </h3>
                                                <span className="text-[10px] text-gray-400 font-bold">{student.groupName} · {student.courseName}</span>
                                            </div>
                                        </div>
                                        <span className={cn("text-xs font-black px-2 py-1 rounded-lg", student.progress >= 100 ? "bg-green-50 text-green-600" : "bg-purple-50 text-purple-600")}>
                                            {student.progress}%
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full transition-all duration-500", student.progress >= 100 ? "bg-green-500" : "bg-purple-500")}
                                                style={{ width: `${student.progress}%` }} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-1.5">
                                        <span className="text-[10px] text-gray-400 font-bold">
                                            {student.totalListened} / {student.totalRequired} محاضرة
                                        </span>
                                        {student.remaining > 0 && (
                                            <span className="text-[10px] text-amber-500 font-bold">بقي {student.remaining}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {listeningProgressData.length === 0 && (
                                <div className="text-center py-20 bg-white/40 rounded-[32px] border-2 border-dashed border-gray-100">
                                    <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Headphones size={32} />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-800">لا توجد متابعات</h3>
                                    <p className="text-sm text-gray-400 font-bold mt-1">لا يوجد طلاب مسجلين في دورات أو لا توجد متابعات بعد</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* --- مودال تفاصيل الطالب (يظهر عند النقر على أي طالب) --- */}
            {selectedStudentForDetails && (
                <StudentDetailModal
                    isOpen={!!selectedStudentForDetails}
                    student={selectedStudentForDetails}
                    onClose={() => setSelectedStudentForDetails(null)}
                />
            )}
        </div>
    );
}