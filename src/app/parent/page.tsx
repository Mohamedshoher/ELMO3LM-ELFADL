"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useState, useEffect, useRef } from "react";
import { useStudents } from "@/features/students/hooks/useStudents";
import { useGroups } from "@/features/groups/hooks/useGroups";
import { useCourses } from "@/features/courses/hooks/useCourses";
import { useStudentRecords } from "@/features/students/hooks/useStudentRecords";
import { useTeachers } from "@/features/teachers/hooks/useTeachers";
import { ParentChatModal } from "@/features/chat/components/ParentChatModal";
import { ParentStudentDetailModal } from "@/features/students/components/ParentStudentDetailModal";
import {
    LogOut, Home, User, Calendar, ChevronLeft, AlertCircle, MessageCircle, X,
    BookOpen, TrendingUp, Clock, Award, Headphones, BarChart3, ExternalLink, Book,
    GraduationCap, PlusCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { logout } from "@/features/auth/services/authService";
import { cn } from "@/lib/utils";
import { FadeIn, SlideIn } from '@/components/ui/transition';
import { Button } from "@/components/ui/button";
import { PresenceTracker } from "@/components/PresenceTracker";
import { useChatStore } from "@/store/useChatStore";
import { playNotificationSound } from "@/lib/notificationSound";
import { chatService } from "@/features/chat/services/chatService";

export default function ParentDashboard() {
    const { user, setUser } = useAuthStore();
    const router = useRouter();
    const { data: students, isLoading } = useStudents();

    useEffect(() => {
        if (!user) router.replace('/parent-login');
    }, [user, router]);

    const { data: groups } = useGroups();
    const { data: courses } = useCourses();
    const { data: teachers } = useTeachers();
    const { unreadCount, setConversations } = useChatStore();
    const [mounted, setMounted] = useState(false);
    const [selectedKid, setSelectedKid] = useState<any>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showLeave, setShowLeave] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showPulse, setShowPulse] = useState(false);
    const prevUnreadCount = useRef(0);

    useEffect(() => { setMounted(true); }, []);

    // استخراج رقم هاتف الطالب من التخزين المحلي
    const phone = typeof window !== 'undefined' ? localStorage.getItem('almoalem_student_phone') || '' : '';
    const studentName = user?.displayName || "";
    const myKids = students?.filter(s => s.studentPhone === phone || s.fullName === studentName) || [];

    useEffect(() => {
        if (!user?.uid) return;
        const userId = user.uid.replace('mock-', '');
        const unsubscribe = chatService.subscribeToConversations(userId, (conversations) => {
            setConversations(conversations);
        });
        return () => unsubscribe();
    }, [user?.uid, setConversations]);

    useEffect(() => {
        if (unreadCount > prevUnreadCount.current && prevUnreadCount.current >= 0) {
            playNotificationSound();
            setShowPulse(true);
            setTimeout(() => setShowPulse(false), 2000);
        }
        prevUnreadCount.current = unreadCount;
    }, [unreadCount]);

    const allowedContacts = teachers?.filter(t => {
        if (t.role === 'supervisor') return true;
        const kidTeacherIds = myKids.map(k => k.groupIds?.[0] ?? k.groupId).map(gid => groups?.find(g => g.id === gid)?.teacherId);
        if (kidTeacherIds.includes(t.id)) return true;
        return false;
    }) || [];

    const contacts = [
        { id: 'director', fullName: 'المدير العام', role: 'director' },
        ...allowedContacts
    ];

    const handleLogout = async () => {
        await logout();
        setUser(null);
        router.push("/login");
    };

    if (isLoading || !mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-emerald-600 font-bold text-sm">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-28" dir="rtl">
            <PresenceTracker />

            <header className="bg-white/70 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={handleLogout}
                        className="flex items-center gap-2 px-3.5 py-2 bg-red-50 text-red-500 rounded-xl text-[11px] font-black hover:bg-red-500 hover:text-white transition-all active:scale-95">
                        <LogOut size={15} />
                        <span className="hidden xs:inline">خروج</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                            <Home size={16} className="text-white" />
                        </div>
                    </div>

                    <button onClick={() => router.push('/parent/courses')}
                        className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[11px] font-black hover:bg-emerald-600 hover:text-white transition-all active:scale-95">
                        <GraduationCap size={15} />
                        <span className="hidden sm:inline">الدورات</span>
                    </button>
                    <button onClick={() => setIsChatOpen(true)}
                        className={cn("relative flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[11px] font-black hover:bg-emerald-600 hover:text-white transition-all active:scale-95", showPulse && "animate-bounce")}>
                        <MessageCircle size={15} />
                        <span className="hidden sm:inline">مراسلة</span>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                                {unreadCount > 9 ? '+9' : unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-6">
                {/* Welcome */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900">
                        {myKids.length > 0
                            ? `أهلاً بك يا ${myKids.map(k => k.fullName.split(' ')[0]).join(' و ')}`
                            : "أهلاً بك"}
                    </h1>
                    <p className="text-sm text-gray-400 font-bold mt-1">نظام متابعة الدورات والاختبارات</p>
                </div>

                {/* Course Title */}
                <div className="flex items-center gap-3 mb-6 border-r-4 border-emerald-500 pr-3">
                    <BookOpen size={20} className="text-emerald-600" />
                    <h2 className="text-xl font-black text-gray-800">دوراتي</h2>
                    <span className="bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                        {myKids.length}
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {myKids.map((kid) => (
                        <StudentCard
                            key={kid.id}
                            kid={kid}
                            groups={groups || []}
                            courses={courses || []}
                            teachers={teachers || []}
                            onSelect={() => { setSelectedKid(kid); setShowDetail(true); }}
                            onLeaveRequest={() => { setSelectedKid(kid); setShowLeave(true); }}
                        />
                    ))}

                    {myKids.length === 0 && (
                        <div className="col-span-full py-24 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={40} className="text-gray-300" />
                            </div>
                            <h3 className="text-xl font-black text-gray-400 mb-1">لا توجد بيانات</h3>
                            <p className="text-sm text-gray-300 font-bold">لم نجد طلاباً مرتبطين بهذا الرقم</p>
                        </div>
                    )}
                </div>
            </main>

            {showDetail && selectedKid && (
                <ParentStudentDetailModal
                    isOpen={showDetail}
                    onClose={() => setShowDetail(false)}
                    student={selectedKid}
                    group={groups?.find(g => g.id === (selectedKid.groupId ?? selectedKid.groupIds?.[0] ?? null))}
                    teacher={teachers?.find(t => t.id === groups?.find(g => g.id === (selectedKid.groupId ?? selectedKid.groupIds?.[0] ?? null))?.teacherId)}
                />
            )}

            {showLeave && selectedKid && (
                <LeaveRequestModal kid={selectedKid} onClose={() => setShowLeave(false)} />
            )}

            {isChatOpen && (
                <ParentChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} contacts={contacts} />
            )}

            <button onClick={() => setIsChatOpen(true)}
                className={cn("fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-all hover:shadow-emerald-500/40 hover:scale-110", showPulse && "animate-bounce")}>
                <div className="relative">
                    <MessageCircle size={28} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-black shadow-lg">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </div>
            </button>
        </div>
    );
}

function LeaveRequestModal({ kid, onClose }: { kid: any, onClose: () => void }) {
    const { addLeave } = useStudentRecords(kid.id);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate || !reason) return alert('يرجى ملء جميع الحقول');
        try {
            await addLeave.mutateAsync({
                studentId: kid.id, studentName: kid.fullName, startDate, endDate, reason
            });
            onClose();
        } catch (err) { console.error("خطأ:", err); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="rtl">
            <FadeIn show={true}>
                <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            </FadeIn>
            <SlideIn show={true} className="bg-white rounded-3xl w-full max-w-md p-6 relative z-10 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-black text-gray-900 border-r-4 border-emerald-500 pr-3">طلب إجازة</h2>
                    <button onClick={onClose} className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                        <X size={18} />
                    </button>
                </div>
                <div className="bg-gradient-to-l from-emerald-50 to-teal-50 rounded-2xl p-4 mb-5 border border-emerald-100/50">
                    <p className="text-[10px] text-emerald-600/60 font-bold mb-0.5">الطالب</p>
                    <p className="font-black text-gray-800 text-sm">{kid.fullName}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 mr-1">من تاريخ</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                className="w-full h-11 bg-gray-50 border border-gray-100 rounded-2xl px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 mr-1">إلى تاريخ</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                                className="w-full h-11 bg-gray-50 border border-gray-100 rounded-2xl px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 mr-1">السبب</label>
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="اكتب سبب الإجازة..."
                            className="w-full h-22 bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <Button type="submit" disabled={addLeave.isPending}
                        className="w-full h-12 bg-gradient-to-l from-emerald-500 to-teal-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/20">
                        {addLeave.isPending ? 'جاري الإرسال...' : 'إرسال الطلب'}
                    </Button>
                </form>
            </SlideIn>
        </div>
    );
}

function StudentCard({ kid, groups, courses: allCourses, teachers, onSelect, onLeaveRequest }: {
    kid: any, groups: any[], courses: any[], teachers: any[], onSelect: () => void, onLeaveRequest: () => void
}) {
    const { attendance, exams, fees, listens } = useStudentRecords(kid.id);

    const kidGroupIds: string[] = kid.groupIds?.length
        ? kid.groupIds
        : (kid.groupId ? [kid.groupId] : []);
    const kidGroups = kidGroupIds.map(gid => groups.find((g: any) => g.id === gid)).filter(Boolean);
    const kidCourses = kidGroups.map((g: any) => allCourses.find((c: any) => c.id === g?.courseId)).filter(Boolean);
    const kidTeachers = kidGroups.map((g: any) => teachers.find((t: any) => t.id === g?.teacherId)).filter(Boolean);
    const uniqueTeachers = [...new Map(kidTeachers.map((t: any) => [t?.id, t])).values()].filter(Boolean);

    const presentCount = attendance.filter((a: any) => a.status === 'present').length;
    const totalAttendance = attendance.length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
    const totalListened = listens?.reduce((s: any, l: any) => s + (l.lecturesCount || 0), 0) || 0;
    const courseExams = exams.filter((e: any) => e.type !== 'quran');

    return (
        <div onClick={onSelect}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group relative overflow-hidden cursor-pointer active:scale-[0.98]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-bl-[120px] -mr-16 -mt-16 group-hover:scale-125 transition-transform" />

            <div className="absolute top-3 left-3 z-10">
                {kid.status === 'archived' && (
                    <span className="bg-red-500 text-white px-2.5 py-0.5 rounded-full text-[8px] font-black shadow-lg border border-white/20">
                        مفصول
                    </span>
                )}
            </div>

            <div className="relative z-10">
                {/* Student Header */}
                <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:rotate-6 transition-transform shrink-0">
                        <User size={28} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-black text-gray-900 text-lg">{kid.fullName}</h3>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {kidGroups.map((g: any) => (
                                <span key={g.id} className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                    {g.name}
                                </span>
                            ))}
                            {kidGroups.length === 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-100">
                                    بدون مجموعة
                                </span>
                            )}
                            {uniqueTeachers.map((t: any) => (
                                <span key={t.id} className="text-[10px] text-gray-400 font-bold">أ/ {t.fullName}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Courses */}
                {kidCourses.length > 0 ? kidCourses.map((course: any, idx: number) => {
                    const totalLectures = course?.lecturesCount || 0;
                    const progress = totalLectures > 0 ? Math.min(Math.round((totalListened / totalLectures) * 100), 100) : 0;
                    return (
                        <div key={course.id} className={`bg-gradient-to-l from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100/50 ${idx < kidCourses.length - 1 ? 'mb-3' : 'mb-4'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={16} className="text-emerald-600" />
                                    <span className="font-black text-gray-800 text-sm">{course.name}</span>
                                </div>
                                <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[9px] font-black",
                                    progress >= 100 ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-700"
                                )}>
                                    {progress >= 100 ? 'مكتملة' : `${progress}%`}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-emerald-200/50 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-l from-emerald-500 to-teal-600 rounded-full transition-all"
                                    style={{ width: `${progress}%` }} />
                            </div>
                            <div className="flex items-center justify-between mt-2 text-[9px] text-gray-400 font-bold">
                                <span>المستمع: {totalListened}</span>
                                <span>المحاضرات: {totalLectures}</span>
                            </div>
                            {(course?.link || course?.bookLink) && (
                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-emerald-200/50">
                                    {course.link && (
                                        <a href={course.link} target="_blank" rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                                            <ExternalLink size={18} />
                                            رابط الدورة
                                        </a>
                                    )}
                                    {course.bookLink && (
                                        <a href={course.bookLink} target="_blank" rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-2xl text-sm font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-200">
                                            <Book size={18} />
                                            رابط الكتاب
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                }) : (
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-4 text-center">
                        <p className="text-xs font-bold text-gray-400 mb-2">غير مسجل في دورة</p>
                        <button onClick={(e) => { e.stopPropagation(); window.location.href = '/parent/courses'; }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                            <PlusCircle size={13} />
                            سجل في دورة
                        </button>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="bg-gray-50/80 rounded-2xl p-3 text-center border border-gray-100">
                        <Calendar size={14} className="mx-auto text-emerald-500 mb-1" />
                        <p className="text-base font-black text-gray-900">{attendanceRate}%</p>
                        <p className="text-[7px] text-gray-400 font-bold">حضور</p>
                    </div>
                    <div className="bg-gray-50/80 rounded-2xl p-3 text-center border border-gray-100">
                        <Award size={14} className="mx-auto text-amber-500 mb-1" />
                        <p className="text-base font-black text-gray-900">{courseExams.length}</p>
                        <p className="text-[7px] text-gray-400 font-bold">اختبارات</p>
                    </div>
                    <div className="bg-gray-50/80 rounded-2xl p-3 text-center border border-gray-100">
                        <Headphones size={14} className="mx-auto text-blue-500 mb-1" />
                        <p className="text-base font-black text-gray-900">{listens?.length || 0}</p>
                        <p className="text-[7px] text-gray-400 font-bold">متابعات</p>
                    </div>
                    <div className="bg-gray-50/80 rounded-2xl p-3 text-center border border-gray-100">
                        <BarChart3 size={14} className="mx-auto text-purple-500 mb-1" />
                        <p className="text-base font-black text-gray-900">{Math.max(...kidCourses.map((c: any) => {
                            const total = c?.lecturesCount || 0;
                            return total > 0 ? Math.min(Math.round((totalListened / total) * 100), 100) : 0;
                        }), 0)}%</p>
                        <p className="text-[7px] text-gray-400 font-bold">تقدم</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onSelect(); }}
                        className="flex-1 h-11 bg-gradient-to-l from-emerald-500 to-teal-600 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-95">
                        عرض التفاصيل
                        <ChevronLeft size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onLeaveRequest(); }}
                        className="h-11 px-4 bg-orange-50 text-orange-600 text-[10px] font-black rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-orange-500 hover:text-white border border-orange-100">
                        <Calendar size={12} />
                        إجازة
                    </button>
                </div>
            </div>
        </div>
    );
}
