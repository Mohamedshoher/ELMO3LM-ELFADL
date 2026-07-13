'use client';

import { useState, useMemo } from 'react';
import {
    X, Calendar, BookOpen, TrendingUp, CheckCircle2, XCircle,
    User, Clock, Award, Headphones, Book, BarChart3, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudentRecords } from '../hooks/useStudentRecords';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useCourses } from '@/features/courses/hooks/useCourses';
import { Group, Teacher } from '@/types';
import FollowUpTab from './FollowUpTab';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    student: any;
    group?: Group;
    teacher?: Teacher;
}

type TabType = 'attendance' | 'exams' | 'courses' | 'schedule' | 'followup';

export const ParentStudentDetailModal: React.FC<Props> = ({
    isOpen, onClose, student, group, teacher
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('courses');
    const { data: groups } = useGroups();
    const { data: courses } = useCourses();

    const studentGroup = groups?.find((g: any) => g.id === (student.groupId ?? student.groupIds?.[0] ?? null));
    const studentCourse = courses?.find((c: any) => c.id === studentGroup?.courseId);

    const {
        attendance, exams, listens, addListen, deleteListen,
        isLoadingAttendance, isLoadingExams
    } = useStudentRecords(student?.id || '');

    const courseExams = useMemo(() => {
        if (!studentCourse) return [];
        return exams.filter((e: any) => e.type !== 'quran' && !e.surah?.includes('سورة'));
    }, [exams, studentCourse]);

    if (!student) return null;

    const tabs: { id: TabType; label: string; icon: any; color: string }[] = [
        { id: 'courses', label: 'الدورات', icon: Book, color: 'text-emerald-600' },
        { id: 'schedule', label: 'المواعيد', icon: Clock, color: 'text-indigo-600' },
        { id: 'attendance', label: 'الحضور', icon: Calendar, color: 'text-blue-600' },
        { id: 'exams', label: 'الاختبارات', icon: Award, color: 'text-teal-600' },
        { id: 'followup', label: 'المتابعات', icon: Headphones, color: 'text-purple-600' }
    ];

    const renderCourses = () => {
        if (!studentCourse) {
            return (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <BookOpen size={36} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-black text-gray-400 mb-1">غير مسجل في دورة</h3>
                    <p className="text-sm text-gray-400">الطالب غير مرتبط بأي دورة حالياً</p>
                </div>
            );
        }

        const totalListened = listens?.reduce((s: number, l: any) => s + (l.lecturesCount || 1), 0) || 0;
        const totalLectures = studentCourse.lecturesCount || 0;
        const progress = totalLectures > 0 ? Math.min(Math.round((totalListened / totalLectures) * 100), 100) : 0;

        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black">{studentCourse.name}</h3>
                            <p className="text-emerald-100/80 text-xs font-bold">{studentCourse.lecturesCount} محاضرة</p>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-emerald-100/80 mb-1">
                            <span>التقدم في الاستماع</span>
                            <span>{totalListened} / {totalLectures}</span>
                        </div>
                        <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full transition-all"
                                style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-left text-xs text-emerald-100/80 mt-1">{progress}%</p>
                    </div>
                    <div className="flex gap-2 mt-4 flex-wrap">
                        {studentCourse.link && (
                            <a href={studentCourse.link} target="_blank" rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-white/20 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-white/30">
                                <ExternalLink size={14} /> رابط الدورة
                            </a>
                        )}
                        {studentCourse.bookLink && (
                            <a href={studentCourse.bookLink} target="_blank" rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-white/20 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-white/30">
                                <Book size={14} /> الكتاب
                            </a>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center text-center">
                        <Headphones size={20} className="text-emerald-500 mb-1" />
                        <span className="text-[10px] font-black text-gray-400">المستمع</span>
                        <span className="text-2xl font-black text-emerald-700">{totalListened}</span>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center text-center">
                        <BarChart3 size={20} className="text-blue-500 mb-1" />
                        <span className="text-[10px] font-black text-gray-400">النسبة</span>
                        <span className="text-2xl font-black text-blue-700">{progress}%</span>
                    </div>
                    <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 flex flex-col items-center text-center">
                        <Award size={20} className="text-teal-500 mb-1" />
                        <span className="text-[10px] font-black text-gray-400">الباقي</span>
                        <span className="text-2xl font-black text-teal-700">{Math.max(0, totalLectures - totalListened)}</span>
                    </div>
                </div>

                {(studentCourse as any).description && (
                    <div className="bg-white p-5 rounded-2xl border border-gray-100">
                        <p className="text-xs font-bold text-gray-500 leading-relaxed">{(studentCourse as any).description}</p>
                    </div>
                )}
            </div>
        );
    };

    const renderSchedule = () => (
        <div className="space-y-6">
            <div className="bg-indigo-50/50 p-6 rounded-[32px] border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <Clock size={28} />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-indigo-900">مواعيد الحضور</h4>
                        <p className="text-xs text-indigo-600 font-bold">الأيام والساعات المتفق عليها</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {student.appointment ? student.appointment.split(',').map((part: string, i: number) => {
                    const colonIdx = part.indexOf(':');
                    const day = colonIdx !== -1 ? part.slice(0, colonIdx).trim() : part.trim();
                    const time = colonIdx !== -1 ? part.slice(colonIdx + 1).trim() : '';
                    return (
                        <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-indigo-300 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h5 className="text-sm font-black text-gray-900">{day}</h5>
                                    <p className="text-xs font-bold text-indigo-600">{time}</p>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full py-16 text-center space-y-3 bg-white rounded-[40px] border border-dashed border-gray-200">
                        <Clock size={40} className="mx-auto text-gray-200" />
                        <p className="text-sm font-black text-gray-400">لم يتم تحديد مواعيد حضور بعد</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderAttendance = () => {
        const presentCount = attendance.filter((a: any) => a.status === 'present').length;
        const total = attendance.length;

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50/50 p-6 rounded-[32px] border border-blue-100 flex flex-col items-center text-center">
                        <CheckCircle2 size={24} className="text-blue-500 mb-2" />
                        <span className="text-[10px] font-black text-gray-400">مرات الحضور</span>
                        <span className="text-3xl font-black text-blue-700">{presentCount}</span>
                    </div>
                    <div className="bg-red-50/50 p-6 rounded-[32px] border border-red-100 flex flex-col items-center text-center">
                        <XCircle size={24} className="text-red-500 mb-2" />
                        <span className="text-[10px] font-black text-gray-400">مرات الغياب</span>
                        <span className="text-3xl font-black text-red-700">{total - presentCount}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-black text-gray-900 pr-2">آخر السجلات</h4>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {attendance.sort((a: any, b: any) => b.day - a.day).slice(0, 10).map((record: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        record.status === 'present' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                    )}>
                                        {record.status === 'present' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">{record.day} - {record.month}</span>
                                </div>
                                <span className={cn(
                                    "text-[10px] font-black px-3 py-1 rounded-full",
                                    record.status === 'present' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                )}>
                                    {record.status === 'present' ? 'حاضر' : 'غائب'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderExams = () => (
        <div className="space-y-6">
            <div className="bg-teal-50/50 p-6 rounded-[32px] border border-teal-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                        <Award size={28} />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-teal-900">الاختبارات</h4>
                        <p className="text-xs text-teal-600 font-bold">{studentCourse ? `دورة ${studentCourse.name}` : 'جميع الاختبارات'}</p>
                    </div>
                </div>
            </div>

            {courseExams.length === 0 ? (
                <div className="py-16 text-center space-y-3 bg-white rounded-[40px] border border-dashed border-gray-200">
                    <Award size={40} className="mx-auto text-gray-200" />
                    <p className="text-sm font-black text-gray-400">لا توجد اختبارات مسجلة</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {courseExams.slice(0, 10).map((exam: any, i: number) => (
                        <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-teal-300 transition-all">
                            <div className="space-y-1">
                                <h5 className="text-sm font-black text-gray-900 group-hover:text-teal-600">{exam.surah || exam.name}</h5>
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                                    <Calendar size={12} />
                                    <span>{exam.date}</span>
                                    <span>•</span>
                                    <span>اختبار دورة</span>
                                </div>
                            </div>
                            <div className="px-4 py-2 rounded-2xl text-xs font-black shadow-sm bg-teal-50 text-teal-700">
                                {exam.grade || exam.result || '—'}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100]" dir="rtl">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="bg-gray-50 w-full max-w-5xl h-[90vh] rounded-[48px] overflow-hidden flex flex-col relative shadow-2xl border border-white/20 animate-[fadeIn_0.2s_ease-out]"
                    onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white p-6 pb-4 shrink-0 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

                        <div className="flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[22px] sm:rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 shrink-0">
                                    <User size={32} />
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                    <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight truncate">
                                        {student.fullName}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black border border-emerald-100 flex items-center gap-1 whitespace-nowrap">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                            {group?.name || 'بدون مجموعة'}
                                        </span>
                                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black border border-blue-100 flex items-center gap-1 whitespace-nowrap">
                                            أ/ {teacher?.fullName || 'غير محدد'}
                                        </span>
                                        {studentCourse && (
                                            <span className="bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black border border-teal-100 flex items-center gap-1 whitespace-nowrap">
                                                {studentCourse.name}
                                            </span>
                                        )}
                                        {student.status === 'archived' && (
                                            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] sm:text-xs font-black shadow-lg whitespace-nowrap">
                                                مفصول
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 mt-6 bg-gray-50 p-1 rounded-[20px] overflow-x-auto no-scrollbar">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex-1 md:min-w-[120px] py-4 rounded-2xl flex items-center justify-center gap-3 text-sm font-black transition-all",
                                        activeTab === tab.id
                                            ? "bg-white text-emerald-600 shadow-md scale-[1.02]"
                                            : "text-gray-400 hover:bg-white/50 hover:text-gray-600"
                                    )}
                                >
                                    <tab.icon size={20} className={cn(activeTab === tab.id ? tab.color : "text-gray-300")} />
                                    <span className="hidden md:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                        {activeTab === 'courses' && renderCourses()}
                        {activeTab === 'schedule' && renderSchedule()}
                        {activeTab === 'attendance' && renderAttendance()}
                        {activeTab === 'exams' && renderExams()}
                        {activeTab === 'followup' && <FollowUpTab student={student} records={{ listens, addListen, deleteListen }} />}
                    </div>

                    <div className="p-6 bg-white border-t border-gray-100 shrink-0 text-center">
                        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">المعلم الفاضل • 2026</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
