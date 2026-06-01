"use client";

import { useState, useMemo } from 'react';
import {
    Headphones,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    User,
    Calendar,
    BookOpen,
    BarChart3,
    Search,
    FileText,
    Trash2,
    ExternalLink,
    Book,
    TrendingUp,
    AlertCircle,
    Clock,
    MessageCircle,
    MessageSquare
} from 'lucide-react';
import { cn, getWhatsAppUrl } from '@/lib/utils';
import { FadeIn } from '@/components/ui/transition';
import { useStudents } from '@/features/students/hooks/useStudents';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useTeachers } from '@/features/teachers/hooks/useTeachers';
import { useAuthStore } from '@/store/useAuthStore';
import dynamic from 'next/dynamic';
import { useAllListens } from '@/features/students/hooks/useAllListens';
import { useCourses } from '@/features/courses/hooks/useCourses';
import { deleteListenRecord } from '@/features/students/services/recordsService';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

const StudentDetailModal = dynamic(() => import('@/features/students/components/StudentDetailModal'), { ssr: false });

type ViewType = 'log' | 'students' | 'groups';
type SortField = 'date' | 'studentName' | 'lecturesCount' | 'courseName';
type SortDir = 'asc' | 'desc';

export default function FollowUpReportPage() {
    const queryClient = useQueryClient();
    const router = useRouter();

    const { data: students } = useStudents();
    const { data: groups } = useGroups();
    const { data: teachers } = useTeachers();
    const { data: courses } = useCourses();
    const { user } = useAuthStore();

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
        return students.filter(s => s.groupId && assignedGroupIds.includes(s.groupId)).map(s => s.id);
    }, [students, assignedGroupIds, user?.role]);

    const [view, setView] = useState<ViewType>('log');
    const [selectedGroupId, setSelectedGroupId] = useState('all');
    const [selectedCourseId, setSelectedCourseId] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedHalf, setSelectedHalf] = useState<1 | 2 | null>(null);
    const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<any>(null);

    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    const monthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
    const { data: allListens = [] } = useAllListens(monthKey, selectedHalf || undefined, relevantStudentIds);

    const currentMonthLabel = selectedDate.toLocaleDateString('ar-EG', { month: 'long' });
    const monthLabelWithYear = selectedDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });

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

    const getStudentName = (studentId: string) => {
        return students?.find((s: any) => s.id === studentId)?.fullName || 'غير معروف';
    };

    const getStudentGroupId = (studentId: string) => {
        return students?.find((s: any) => s.id === studentId)?.groupId;
    };

    const getGroupName = (groupId?: string) => {
        if (!groupId) return 'غير محدد';
        return groups?.find((g: any) => g.id === groupId)?.name || 'غير محدد';
    };

    const getCourseName = (courseId?: string) => {
        if (!courseId) return 'غير محدد';
        return courses?.find((c: any) => c.id === courseId)?.name || 'غير محدد';
    };

    const getCourseLink = (courseId?: string) => {
        if (!courseId) return undefined;
        return courses?.find((c: any) => c.id === courseId)?.link || undefined;
    };

    const getCourseBookLink = (courseId?: string) => {
        if (!courseId) return undefined;
        return courses?.find((c: any) => c.id === courseId)?.bookLink || undefined;
    };

    const getCourseLecturesCount = (courseId?: string) => {
        if (!courseId) return 0;
        return courses?.find((c: any) => c.id === courseId)?.lecturesCount || 0;
    };

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه المتابعة؟')) return;
        try {
            await deleteListenRecord(id);
            queryClient.invalidateQueries({ queryKey: ['all-listens'] });
        } catch (err) {
            alert('حدث خطأ أثناء الحذف');
        }
    };

    const isTeacherOrSupervisorRestricted = user?.role === 'teacher' || user?.role === 'supervisor';

    const studentMap = useMemo(() => {
        const map: Record<string, any> = {};
        (students || []).forEach((s: any) => { map[s.id] = s; });
        return map;
    }, [students]);

    const groupMap = useMemo(() => {
        const map: Record<string, any> = {};
        (groups || []).forEach((g: any) => { map[g.id] = g; });
        return map;
    }, [groups]);

    const courseMap = useMemo(() => {
        const map: Record<string, any> = {};
        (courses || []).forEach((c: any) => { map[c.id] = c; });
        return map;
    }, [courses]);

    // --- Filtered Listens (Log View) ---
    const filteredListens = useMemo(() => {
        let items = [...allListens];

        if (selectedGroupId !== 'all') {
            items = items.filter(l => getStudentGroupId(l.studentId) === selectedGroupId);
        } else if (isTeacherOrSupervisorRestricted) {
            items = items.filter(l => {
                const gId = getStudentGroupId(l.studentId);
                return gId && assignedGroupIds.includes(gId);
            });
        }

        if (selectedCourseId !== 'all') {
            items = items.filter(l => l.courseId === selectedCourseId);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            items = items.filter(l => getStudentName(l.studentId).toLowerCase().includes(q));
        }

        items.sort((a: any, b: any) => {
            let cmp = 0;
            switch (sortField) {
                case 'date':
                    cmp = (a.date || '').localeCompare(b.date || '');
                    break;
                case 'studentName':
                    cmp = getStudentName(a.studentId).localeCompare(getStudentName(b.studentId));
                    break;
                case 'lecturesCount':
                    cmp = (a.lecturesCount || 0) - (b.lecturesCount || 0);
                    break;
                case 'courseName':
                    cmp = getCourseName(a.courseId).localeCompare(getCourseName(b.courseId));
                    break;
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });

        return items;
    }, [allListens, selectedGroupId, selectedCourseId, searchQuery, sortField, sortDir, students, groups, assignedGroupIds, isTeacherOrSupervisorRestricted]);

    // --- Student Aggregate Data (Students View) ---
    const studentAggregateData = useMemo(() => {
        let baseStudents = (students || []).filter((s: any) => s.status === 'active');

        if (selectedGroupId !== 'all') {
            baseStudents = baseStudents.filter((s: any) => s.groupId === selectedGroupId);
        } else if (isTeacherOrSupervisorRestricted) {
            baseStudents = baseStudents.filter((s: any) => s.groupId && assignedGroupIds.includes(s.groupId));
        }

        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            baseStudents = baseStudents.filter((s: any) => s.fullName.toLowerCase().includes(q));
        }

        return baseStudents
            .map((s: any) => {
                const group = groupMap[s.groupId];
                const courseId = group?.courseId;
                const course = courseMap[courseId];
                if (!course) return null;

                const studentListens = allListens.filter(
                    (l: any) => l.studentId === s.id && (!l.courseId || l.courseId === courseId)
                );
                const totalListened = studentListens.reduce((sum: number, l: any) => sum + (l.lecturesCount || 1), 0);
                const totalRequired = course.lecturesCount || 0;
                const progress = totalRequired > 0 ? Math.min(Math.round((totalListened / totalRequired) * 100), 100) : 0;
                const remaining = Math.max(0, totalRequired - totalListened);
                const monthListens = studentListens.filter((l: any) => l.date?.startsWith(monthKey)).length;
                const monthTotal = studentListens.filter((l: any) => l.date?.startsWith(monthKey))
                    .reduce((sum: number, l: any) => sum + (l.lecturesCount || 1), 0);

                return {
                    ...s,
                    groupName: getGroupName(s.groupId),
                    courseId,
                    courseName: course.name,
                    totalListened,
                    totalRequired,
                    progress,
                    remaining,
                    monthListens,
                    monthTotal,
                };
            })
            .filter((s: any) => s !== null)
            .sort((a: any, b: any) => b.progress - a.progress)
            .map((s: any, i: number) => ({ ...s, rank: i + 1 }));
    }, [students, allListens, groupMap, courseMap, selectedGroupId, assignedGroupIds, isTeacherOrSupervisorRestricted, searchQuery, monthKey]);

    // --- Group Aggregate Data (Groups View) ---
    const groupAggregateData = useMemo(() => {
        let baseGroups = filteredGroupsList;
        if (selectedCourseId !== 'all') {
            baseGroups = baseGroups.filter((g: any) => g.courseId === selectedCourseId);
        }

        return baseGroups
            .map((g: any) => {
                const course = courseMap[g.courseId];
                const groupStudents = (students || []).filter(
                    (s: any) => s.groupId === g.id && s.status === 'active'
                );

                let totalRequired = 0;
                let totalListened = 0;
                let totalRecords = 0;
                const studentEntries: any[] = [];

                groupStudents.forEach((s: any) => {
                    if (!course) return;
                    const studentListens = allListens.filter(
                        (l: any) => l.studentId === s.id && (!l.courseId || l.courseId === course.id)
                    );
                    totalRecords += studentListens.length;
                    const listened = studentListens.reduce((sum: number, l: any) => sum + (l.lecturesCount || 1), 0);
                    totalListened += listened;
                    totalRequired += course.lecturesCount || 0;
                    studentEntries.push({
                        studentId: s.id,
                        studentName: s.fullName,
                        listened,
                        required: course.lecturesCount || 0,
                        progress: (course.lecturesCount || 0) > 0
                            ? Math.min(Math.round((listened / (course.lecturesCount || 0)) * 100), 100) : 0,
                    });
                });

                const avgProgress = totalRequired > 0 ? Math.round((totalListened / totalRequired) * 100) : 0;

                return {
                    id: g.id,
                    name: g.name,
                    courseName: course?.name || 'غير محدد',
                    teacherName: teachers?.find((t: any) => t.id === g.teacherId)?.fullName || 'غير محدد',
                    totalStudents: groupStudents.length,
                    totalRequired,
                    totalListened,
                    avgProgress,
                    totalRecords,
                    studentEntries,
                };
            })
            .filter((g: any) => g.totalStudents > 0)
            .sort((a: any, b: any) => b.avgProgress - a.avgProgress);
    }, [filteredGroupsList, courseMap, students, allListens, selectedCourseId, teachers]);

    // --- Stats ---
    const stats = useMemo(() => {
        const uniqueStudents = new Set(allListens.map((l: any) => l.studentId));
        const totalLectures = allListens.reduce((sum: number, l: any) => sum + (l.lecturesCount || 1), 0);
        return {
            totalRecords: allListens.length,
            totalStudents: uniqueStudents.size,
            totalLectures,
            avgPerStudent: uniqueStudents.size > 0 ? Math.round(totalLectures / uniqueStudents.size) : 0,
        };
    }, [allListens]);

    return (
        <div className="min-h-screen bg-gray-50/50 pb-24 text-right font-sans overflow-x-hidden" dir="rtl">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 px-2 md:px-6 py-3">
                <div className="flex items-center max-w-4xl mx-auto gap-1 md:gap-4">
                    <h1 className="text-sm md:text-lg font-black text-gray-800 shrink-0">
                        تقارير المتابعات <span className="md:inline hidden">({currentMonthLabel})</span>
                    </h1>

                    <button
                        onClick={() => setSelectedHalf(selectedHalf === 1 ? 2 : selectedHalf === 2 ? null : 1)}
                        className="md:hidden flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-1.5 py-1 shadow-sm"
                        title={
                            selectedHalf === 1 ? 'النصف الأول'
                            : selectedHalf === 2 ? 'النصف الثاني'
                            : 'الشهر كامل'
                        }
                    >
                        <span className={cn("text-[9px] font-black transition-colors",
                            selectedHalf === null ? "text-blue-600" : selectedHalf === 1 ? "text-blue-600" : "text-gray-300"
                        )}>1</span>
                        <div className="relative w-5 h-3 rounded-full bg-gray-200">
                            <div className={cn(
                                "absolute top-0.5 w-2 h-2 rounded-full bg-blue-500 transition-all",
                                selectedHalf === null ? "right-1.5"
                                : selectedHalf === 1 ? "right-0.5"
                                : "right-2.5"
                            )} />
                        </div>
                        <span className={cn("text-[9px] font-black transition-colors",
                            selectedHalf === 2 ? "text-blue-600" : "text-gray-300"
                        )}>2</span>
                    </button>

                    <div className="flex bg-gray-100/50 p-1 rounded-xl items-center gap-1 border border-gray-100 flex-row-reverse mr-auto">
                        <div className="hidden md:flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm flex-row-reverse">
                            <button onClick={() => setSelectedHalf(null)}
                                className={cn("px-2 py-1 text-xs font-bold rounded transition-colors",
                                    selectedHalf === null ? "bg-blue-50 text-blue-600" : "text-gray-500"
                                )}>الكل</button>
                            <button onClick={() => setSelectedHalf(1)}
                                className={cn("px-2 py-1 text-xs font-bold rounded transition-colors",
                                    selectedHalf === 1 ? "bg-blue-50 text-blue-600" : "text-gray-500"
                                )}>النصف الأول</button>
                            <button onClick={() => setSelectedHalf(2)}
                                className={cn("px-2 py-1 text-xs font-bold rounded transition-colors",
                                    selectedHalf === 2 ? "bg-blue-50 text-blue-600" : "text-gray-500"
                                )}>النصف الثاني</button>
                        </div>
                        <div className="flex items-center gap-0.5 md:gap-1 bg-white p-0.5 md:p-1 rounded-lg border border-gray-200 shadow-sm justify-center">
                            <button onClick={goToNextMonth}
                                className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center hover:bg-gray-100 rounded text-gray-600 transition-colors">
                                <ChevronLeft size={12} />
                            </button>
                            <div className="flex items-center gap-0.5 md:gap-1.5 px-0.5 md:px-2">
                                <Calendar size={10} className="text-purple-500" />
                                <span className="text-[8px] md:text-xs font-black text-gray-700">{monthLabelWithYear}</span>
                            </div>
                            <button onClick={goToPreviousMonth}
                                className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center hover:bg-gray-100 rounded text-gray-600 transition-colors">
                                <ChevronRight size={12} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] md:text-xs font-bold text-purple-600 bg-purple-50 px-2 md:px-3 py-1 rounded-md border border-purple-100">
                            <Headphones size={10} className="inline ml-0.5 md:ml-1" />المتابعات
                        </span>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="max-w-4xl mx-auto mt-2 md:mt-4 flex bg-gray-100/80 p-0.5 md:p-1 rounded-xl gap-0.5 md:gap-1 overflow-x-auto no-scrollbar px-1 md:px-0">
                    <button
                        onClick={() => setView('log')}
                        className={cn(
                            "flex-1 py-1.5 md:py-2.5 rounded-lg text-[10px] md:text-sm font-bold transition-all flex items-center justify-center gap-0.5 md:gap-1.5",
                            view === 'log' ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <FileText size={12} />
                        سجل المتابعات
                        <span className={cn("text-[8px] md:text-[10px] font-black px-1 md:px-1.5 py-0.5 rounded-full font-sans",
                            view === 'log' ? "bg-purple-100 text-purple-600" : "bg-gray-200 text-gray-500"
                        )}>{stats.totalRecords}</span>
                    </button>
                    <button
                        onClick={() => setView('students')}
                        className={cn(
                            "flex-1 py-1.5 md:py-2.5 rounded-lg text-[10px] md:text-sm font-bold transition-all flex items-center justify-center gap-0.5 md:gap-1.5",
                            view === 'students' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <User size={12} />
                        الطلاب
                        <span className={cn("text-[8px] md:text-[10px] font-black px-1 md:px-1.5 py-0.5 rounded-full font-sans",
                            view === 'students' ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"
                        )}>{studentAggregateData.length}</span>
                    </button>
                    <button
                        onClick={() => setView('groups')}
                        className={cn(
                            "flex-1 py-1.5 md:py-2.5 rounded-lg text-[10px] md:text-sm font-bold transition-all flex items-center justify-center gap-0.5 md:gap-1.5",
                            view === 'groups' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <TrendingUp size={12} />
                        المجموعات
                        <span className={cn("text-[8px] md:text-[10px] font-black px-1 md:px-1.5 py-0.5 rounded-full font-sans",
                            view === 'groups' ? "bg-emerald-100 text-emerald-600" : "bg-gray-200 text-gray-500"
                        )}>{groupAggregateData.length}</span>
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-2 md:px-6 py-4 space-y-6">
                {/* Stats Bar */}
                <div className="grid grid-cols-4 gap-1.5 md:gap-3">
                    <div className="bg-white rounded-2xl p-2.5 md:p-4 border border-gray-100 text-center">
                        <Headphones size={14} className="mx-auto text-purple-500 mb-1" />
                        <p className="text-sm md:text-lg font-black text-gray-900">{stats.totalRecords}</p>
                        <p className="text-[7px] md:text-[10px] text-gray-400 font-bold">متابعة</p>
                    </div>
                    <div className="bg-white rounded-2xl p-2.5 md:p-4 border border-gray-100 text-center">
                        <User size={14} className="mx-auto text-blue-500 mb-1" />
                        <p className="text-sm md:text-lg font-black text-gray-900">{stats.totalStudents}</p>
                        <p className="text-[7px] md:text-[10px] text-gray-400 font-bold">طالب</p>
                    </div>
                    <div className="bg-white rounded-2xl p-2.5 md:p-4 border border-gray-100 text-center">
                        <BarChart3 size={14} className="mx-auto text-emerald-500 mb-1" />
                        <p className="text-sm md:text-lg font-black text-gray-900">{stats.totalLectures}</p>
                        <p className="text-[7px] md:text-[10px] text-gray-400 font-bold">محاضرة</p>
                    </div>
                    <div className="bg-white rounded-2xl p-2.5 md:p-4 border border-gray-100 text-center">
                        <TrendingUp size={14} className="mx-auto text-amber-500 mb-1" />
                        <p className="text-sm md:text-lg font-black text-gray-900">{stats.avgPerStudent}</p>
                        <p className="text-[7px] md:text-[10px] text-gray-400 font-bold">معدل/طالب</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 py-2">
                    <div className="relative">
                        <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}
                            className="appearance-none bg-white border border-gray-100 px-5 py-2 pr-3 rounded-xl text-[10px] md:text-xs font-bold text-gray-600 focus:outline-none text-right cursor-pointer">
                            <option value="all">كل المجموعات</option>
                            {filteredGroupsList?.map((g: any) => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="appearance-none bg-white border border-gray-100 px-5 py-2 pr-3 rounded-xl text-[10px] md:text-xs font-bold text-gray-600 focus:outline-none text-right cursor-pointer">
                            <option value="all">كل الدورات</option>
                            {courses?.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative flex-1 min-w-[120px]">
                        <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="بحث باسم الطالب..."
                            className="w-full bg-white border border-gray-100 px-8 py-2 pr-8 rounded-xl text-[10px] md:text-xs font-bold text-gray-600 focus:outline-none placeholder:text-gray-300"
                        />
                    </div>
                </div>

                {/* View: Log */}
                {view === 'log' && (
                    <div className="space-y-2 animate-[fadeIn_0.3s_ease-out]">
                        <div className="flex items-center justify-between px-1 mb-1">
                            <span className="text-[10px] md:text-xs font-bold text-gray-400">سجل متابعات الاستماع</span>
                            <span className="bg-purple-100 text-purple-700 text-[10px] md:text-xs font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full font-sans">
                                {filteredListens.length} متابعة
                            </span>
                        </div>

                        {/* Sort headers (desktop) */}
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-gray-400 border-b border-gray-100">
                            <button onClick={() => toggleSort('date')} className="flex items-center gap-1 flex-1 text-right">
                                التاريخ {sortField === 'date' && (sortDir === 'asc' ? '↑' : '↓')}
                            </button>
                            <button onClick={() => toggleSort('studentName')} className="flex items-center gap-1 flex-1 text-right">
                                الطالب {sortField === 'studentName' && (sortDir === 'asc' ? '↑' : '↓')}
                            </button>
                            <button onClick={() => toggleSort('courseName')} className="flex items-center gap-1 flex-1 text-right">
                                الدورة {sortField === 'courseName' && (sortDir === 'asc' ? '↑' : '↓')}
                            </button>
                            <button onClick={() => toggleSort('lecturesCount')} className="flex items-center gap-1 w-16 text-center">
                                المحاضرات {sortField === 'lecturesCount' && (sortDir === 'asc' ? '↑' : '↓')}
                            </button>
                            <div className="w-8" />
                        </div>

                        {filteredListens.length === 0 ? (
                            <div className="text-center py-20 bg-white/40 rounded-[32px] border-2 border-dashed border-gray-100">
                                <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Headphones size={32} />
                                </div>
                                <h3 className="text-lg font-black text-gray-800">لا توجد متابعات</h3>
                                <p className="text-sm text-gray-400 font-bold mt-1">لا توجد متابعات لهذا الفلتر</p>
                            </div>
                        ) : (
                            filteredListens.map((listen: any) => {
                                const student = studentMap[listen.studentId];
                                const group = groupMap[student?.groupId];
                                const course = courseMap[listen.courseId || group?.courseId];
                                return (
                                    <div key={listen.id}
                                        onClick={() => setSelectedStudentForDetails(student)}
                                        className="bg-white rounded-[16px] md:rounded-[20px] p-2.5 md:p-3 flex items-center justify-between border border-gray-100 shadow-sm group cursor-pointer hover:border-purple-100 transition-all"
                                    >
                                        <div className="flex-1 min-w-0 flex items-center gap-2 md:gap-3">
                                            <div className="w-7 h-7 md:w-9 md:h-9 bg-purple-50 rounded-[10px] md:rounded-xl flex items-center justify-center text-purple-500 shrink-0">
                                                <Headphones size={14} className="md:size-[18px]" />
                                            </div>
                                            <div className="text-right flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors text-sm md:text-base truncate">
                                                        {getStudentName(listen.studentId)}
                                                    </h3>
                                                    <span className="text-[9px] text-gray-400 font-bold shrink-0">
                                                        {getGroupName(student?.groupId)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-blue-500 font-bold">{course?.name || 'غير محدد'}</span>
                                                    <span className="text-[9px] text-gray-300">|</span>
                                                    <span className="text-[10px] text-gray-400 font-bold">{listen.date}</span>
                                                    {listen.notes && (
                                                        <>
                                                            <span className="text-[9px] text-gray-300">|</span>
                                                            <span className="text-[9px] text-gray-400 truncate max-w-[100px]">{listen.notes}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                                            <div className="bg-purple-50 px-2 md:px-3 py-1 md:py-1.5 rounded-[8px] md:rounded-lg flex items-center gap-1">
                                                <Headphones size={10} className="text-purple-400" />
                                                <span className="text-purple-600 font-black text-xs md:text-sm font-sans">{listen.lecturesCount || 1}</span>
                                            </div>
                                            {user?.role === 'director' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(listen.id); }}
                                                    className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-100 transition-all"
                                                >
                                                    <Trash2 size={12} className="md:size-[14px]" />
                                                </button>
                                            )}
                                            <button className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                                <ChevronRight size={12} className="md:size-[16px]" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* View: Students */}
                {view === 'students' && (
                    <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
                        <div className="flex items-center justify-between px-1 mb-1">
                            <span className="text-[10px] md:text-xs font-bold text-gray-400">تقدم الاستماع للطلاب</span>
                            <span className="bg-blue-100 text-blue-700 text-[10px] md:text-xs font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full font-sans">
                                {studentAggregateData.length} طالب
                            </span>
                        </div>
                        {studentAggregateData.map((student: any) => (
                            <div key={student.id}
                                onClick={() => setSelectedStudentForDetails(student)}
                                className="bg-white rounded-[20px] p-3 border border-gray-100 shadow-sm group cursor-pointer"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                                            <User size={18} />
                                        </div>
                                        <div className="text-right">
                                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                                                {student.fullName}
                                            </h3>
                                            <span className="text-[10px] text-gray-400 font-bold">{student.groupName} · {student.courseName}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {student.parentPhone && (
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); window.open(getWhatsAppUrl(student.parentPhone), '_blank'); }}
                                                    className="w-8 h-8 rounded-xl bg-green-50 text-green-500 flex items-center justify-center hover:bg-green-100 transition-all"
                                                    title="واتساب">
                                                    <MessageCircle size={15} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); router.push('/chat'); }}
                                                    className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-all"
                                                    title="راسلة داخلية">
                                                    <MessageSquare size={15} />
                                                </button>
                                            </>
                                        )}
                                        <span className={cn(
                                            "text-xs font-black px-2 py-1 rounded-lg",
                                            student.progress >= 100 ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                                        )}>
                                            {student.progress}%
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            student.progress >= 100 ? "bg-green-500" : "bg-blue-500"
                                        )} style={{ width: `${student.progress}%` }} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-1.5">
                                    <span className="text-[10px] text-gray-400 font-bold">
                                        {student.totalListened} / {student.totalRequired} محاضرة
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {student.monthTotal > 0 && (
                                            <span className="text-[9px] text-purple-500 font-bold bg-purple-50 px-2 py-0.5 rounded-lg">
                                                هذا الشهر: {student.monthTotal}
                                            </span>
                                        )}
                                        {student.remaining > 0 && (
                                            <span className="text-[10px] text-amber-500 font-bold">بقي {student.remaining}</span>
                                        )}
                                    </div>
                                </div>
                                {/* Course & Book Links */}
                                {(() => {
                                    const courseLink = getCourseLink(student.courseId);
                                    const bookLink = getCourseBookLink(student.courseId);
                                    if (!courseLink && !bookLink) return null;
                                    return (
                                        <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
                                            {courseLink && (
                                                <a href={courseLink} target="_blank" rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[9px] font-bold hover:bg-blue-700 transition-all shadow-sm">
                                                    <ExternalLink size={11} />
                                                    رابط الدورة
                                                </a>
                                            )}
                                            {bookLink && (
                                                <a href={bookLink} target="_blank" rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-xl text-[9px] font-bold hover:bg-amber-600 transition-all shadow-sm">
                                                    <Book size={11} />
                                                    رابط الكتاب
                                                </a>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        ))}
                        {studentAggregateData.length === 0 && (
                            <div className="text-center py-20 bg-white/40 rounded-[32px] border-2 border-dashed border-gray-100">
                                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User size={32} />
                                </div>
                                <h3 className="text-lg font-black text-gray-800">لا يوجد طلاب</h3>
                                <p className="text-sm text-gray-400 font-bold mt-1">لا يوجد طلاب مسجلين في دورات لهذا الفلتر</p>
                            </div>
                        )}
                    </div>
                )}

                {/* View: Groups */}
                {view === 'groups' && (
                    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                        <div className="flex items-center justify-between px-1 mb-1">
                            <span className="text-[10px] md:text-xs font-bold text-gray-400">تقدم الاستماع لكل مجموعة</span>
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] md:text-xs font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full font-sans">
                                {groupAggregateData.length} مجموعة
                            </span>
                        </div>
                        {groupAggregateData.map((data: any) => (
                            <div key={data.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
                                <div className="flex flex-row-reverse items-center justify-between">
                                    <div>
                                        <span className="text-sm font-bold text-gray-700">{data.name}</span>
                                        <span className="text-[10px] text-gray-400 font-bold mr-2">{data.courseName} · {data.teacherName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-gray-400 font-sans">{data.totalStudents} طالب</span>
                                        <span className="text-[10px] text-purple-500 font-bold bg-purple-50 px-2 py-0.5 rounded-lg font-sans">{data.totalRecords} متابعة</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-gray-400 w-16 shrink-0 text-left">الإنجاز</span>
                                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner relative">
                                        <div style={{ width: `${data.avgProgress}%` }}
                                            className="absolute right-0 top-0 h-full bg-gradient-to-l from-emerald-400 to-teal-500 rounded-full animate-[chartFill_0.7s_ease-out]" />
                                    </div>
                                    <span className="flex items-center gap-1 text-[11px] font-black text-gray-500 font-sans">
                                        <span className="text-emerald-600">{data.totalListened}</span>
                                        <span className="text-gray-300">/</span>
                                        <span className="text-gray-400">{data.totalRequired}</span>
                                    </span>
                                </div>
                                {/* Student list within group */}
                                <details className="group/students">
                                    <summary className="text-[10px] text-gray-400 font-bold cursor-pointer hover:text-gray-600 select-none list-none flex items-center gap-1">
                                        <ChevronRight size={12} className="transition-transform group-open/students:rotate-90" />
                                        عرض تفاصيل الطلاب ({data.studentEntries.length})
                                    </summary>
                                    <div className="mt-2 space-y-1.5">
                                        {data.studentEntries.map((entry: any) => (
                                            <div key={entry.studentId}
                                                onClick={() => setSelectedStudentForDetails(
                                                    students?.find((s: any) => s.id === entry.studentId)
                                                )}
                                                className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                                            >
                                                <span className="text-xs font-bold text-gray-700">{entry.studentName}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className={cn(
                                                            "h-full rounded-full",
                                                            entry.progress >= 100 ? "bg-green-500" : "bg-blue-500"
                                                        )} style={{ width: `${entry.progress}%` }} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-500 font-sans">
                                                        {entry.listened}/{entry.required}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[9px] font-bold",
                                                        entry.progress >= 100 ? "text-green-600" : "text-blue-600"
                                                    )}>{entry.progress}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            </div>
                        ))}
                        {groupAggregateData.length === 0 && (
                            <div className="text-center py-20 bg-white/40 rounded-[32px] border-2 border-dashed border-gray-100">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <TrendingUp size={32} />
                                </div>
                                <h3 className="text-lg font-black text-gray-800">لا توجد مجموعات</h3>
                                <p className="text-sm text-gray-400 font-bold mt-1">لا توجد مجموعات مسجلة في دورات لهذا الفلتر</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

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
