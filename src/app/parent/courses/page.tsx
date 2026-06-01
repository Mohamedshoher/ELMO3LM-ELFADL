"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCourses } from "@/features/courses/hooks/useCourses";
import { useStudents } from "@/features/students/hooks/useStudents";
import { useGroups } from "@/features/groups/hooks/useGroups";
import {
    BookOpen, ArrowRight, ExternalLink, Book, CheckCircle,
    Loader2, User, LogOut, Play, GraduationCap, X, Clock, AlertCircle
} from "lucide-react";
import { logout } from "@/features/auth/services/authService";
import { cn } from "@/lib/utils";
import { FadeIn, SlideIn } from '@/components/ui/transition';
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";

async function getJoinRequests(studentId: string) {
    try {
        const res = await fetch('/api/join-requests');
        if (!res.ok) return [];
        const all = await res.json();
        return all.filter((r: any) => r.studentId === studentId);
    } catch { return []; }
}

export default function ParentCoursesPage() {
    const { user, setUser } = useAuthStore();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: courses, isLoading } = useCourses();
    const { data: students } = useStudents();
    const { data: groups } = useGroups();
    const [registering, setRegistering] = useState<string | null>(null);
    const [selectedKidId, setSelectedKidId] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState<{ studentId: string; courseId: string; courseName: string } | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!user) router.replace('/parent-login');
    }, [user, router]);

    const handleLogout = async () => {
        await logout();
        setUser(null);
        router.push("/login");
    };

    const phone = typeof window !== 'undefined' ? localStorage.getItem('almoalem_student_phone') || '' : '';
    const studentName = user?.displayName || "";
    const myKids = students?.filter(s => s.studentPhone === phone || s.fullName === studentName) || [];
    const selectedKid = myKids.find(k => k.id === selectedKidId) || myKids[0];

    useEffect(() => {
        if (myKids.length > 0 && !selectedKidId) {
            setSelectedKidId(myKids[0].id);
        }
    }, [myKids, selectedKidId]);

    const { data: joinRequests = [] } = useQuery({
        queryKey: ['join-requests', selectedKid?.id],
        queryFn: () => selectedKid ? getJoinRequests(selectedKid.id) : [],
        enabled: !!selectedKid,
        refetchInterval: 10000,
    });

    const getKidCourse = (kid: any) => {
        const group = groups?.find((g: any) => g.id === kid.groupId);
        return courses?.find((c: any) => c.id === group?.courseId);
    };

    const getJoinRequestStatus = (courseId: string) => {
        const req = joinRequests.find((r: any) => r.courseId === courseId);
        return req?.status || null;
    };

    const handleRegisterRequest = async (studentId: string, courseId: string) => {
        setRegistering(studentId);
        try {
            const res = await fetch('/api/join-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, courseId }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'فشل إرسال الطلب');
            }
            queryClient.invalidateQueries({ queryKey: ['join-requests'] });
            setShowConfirm(null);
        } catch (err: any) {
            alert(err.message || 'حدث خطأ أثناء إرسال الطلب');
        }
        setRegistering(null);
    };

    const getDomain = (url: string) => {
        try {
            const host = new URL(url).hostname;
            if (host.includes('youtube') || host.includes('youtu.be')) return 'يوتيوب';
            if (host.includes('telegram') || host.includes('t.me')) return 'تليجرام';
            return host;
        } catch { return 'رابط'; }
    };

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-emerald-600 font-bold text-sm">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    const kidCourse = selectedKid ? getKidCourse(selectedKid) : null;

    return (
        <div className="min-h-screen bg-gray-50 pb-28" dir="rtl">
            <header className="bg-white/70 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => router.back()}
                        className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 text-gray-500 rounded-xl text-[11px] font-black hover:bg-gray-100 transition-all active:scale-95">
                        <ArrowRight size={15} />
                        <span className="hidden xs:inline">رجوع</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                            <BookOpen size={16} className="text-white" />
                        </div>
                        <span className="font-black text-gray-800 text-sm">الدورات المتاحة</span>
                    </div>
                    <button onClick={handleLogout}
                        className="flex items-center gap-2 px-3.5 py-2 bg-red-50 text-red-500 rounded-xl text-[11px] font-black hover:bg-red-500 hover:text-white transition-all active:scale-95">
                        <LogOut size={15} />
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-6">
                {myKids.length > 1 && (
                    <div className="mb-6">
                        <p className="text-[10px] font-bold text-gray-400 mb-2 mr-1">اختر الطالب</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {myKids.map(kid => (
                                <button
                                    key={kid.id}
                                    onClick={() => setSelectedKidId(kid.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all whitespace-nowrap",
                                        selectedKidId === kid.id
                                            ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                                            : "bg-white text-gray-600 border-gray-100 hover:border-emerald-200"
                                    )}
                                >
                                    <User size={14} />
                                    {kid.fullName}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {selectedKid && (
                    <div className="bg-gradient-to-l from-emerald-50 to-teal-50 rounded-3xl p-5 border border-emerald-100/50 mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                <User size={22} />
                            </div>
                            <div>
                                <h2 className="font-black text-gray-900">{selectedKid.fullName}</h2>
                                <p className="text-[10px] text-gray-500 font-bold">
                                    {kidCourse
                                        ? `مسجل في: ${kidCourse.name}`
                                        : selectedKid.courseRegisteredAt
                                            ? 'تم التسجيل في دورة'
                                            : 'غير مسجل في أي دورة'}
                                </p>
                            </div>
                        </div>
                        {kidCourse && (
                            <div className="flex items-center gap-2">
                                <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1">
                                    <CheckCircle size={11} />
                                    {kidCourse.name}
                                </span>
                            </div>
                        )}
                        {!kidCourse && selectedKid.courseRegisteredAt && (
                            <div className="flex items-center gap-2">
                                <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black border border-amber-100">
                                    في انتظار التخصيص
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-3 mb-5 border-r-4 border-emerald-500 pr-3">
                    <GraduationCap size={20} className="text-emerald-600" />
                    <h2 className="text-lg font-black text-gray-800">جميع الدورات</h2>
                    <span className="bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                        {courses?.length || 0}
                    </span>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={32} className="text-emerald-500 animate-spin" />
                    </div>
                ) : !courses || courses.length === 0 ? (
                    <FadeIn show={true}>
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <BookOpen size={36} className="text-emerald-300" />
                            </div>
                            <h2 className="text-lg font-black text-gray-400 mb-2">لا توجد دورات متاحة حالياً</h2>
                            <p className="text-sm text-gray-400">سيتم إضافة دورات قريباً</p>
                        </div>
                    </FadeIn>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courses.map((course) => {
                            const platform = getDomain(course.link);
                            const platformColor = platform === 'يوتيوب'
                                ? 'bg-red-50 text-red-600 border-red-100'
                                : platform === 'تليجرام'
                                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                                    : 'bg-gray-50 text-gray-600 border-gray-100';
                            const isRegistered = kidCourse?.id === course.id;
                            const requestStatus = getJoinRequestStatus(course.id);

                            return (
                                <FadeIn key={course.id} show={true}>
                                    <div className={cn(
                                        "bg-white rounded-2xl border shadow-sm transition-all group",
                                        isRegistered
                                            ? "border-emerald-200 shadow-emerald-500/5"
                                            : requestStatus === 'pending'
                                                ? "border-amber-200 shadow-amber-500/5"
                                                : "border-gray-100 hover:shadow-md"
                                    )}>
                                        <div className="p-5">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                                                    isRegistered ? "bg-emerald-50" : requestStatus === 'pending' ? "bg-amber-50" : "bg-purple-50"
                                                )}>
                                                    <BookOpen size={22} className={
                                                        isRegistered ? "text-emerald-600" : requestStatus === 'pending' ? "text-amber-600" : "text-purple-600"
                                                    } />
                                                </div>
                                                {isRegistered && (
                                                    <span className="bg-emerald-500 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1">
                                                        <CheckCircle size={10} />
                                                        مسجل
                                                    </span>
                                                )}
                                                {requestStatus === 'pending' && (
                                                    <span className="bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1">
                                                        <Clock size={10} />
                                                        قيد المراجعة
                                                    </span>
                                                )}
                                                {requestStatus === 'rejected' && (
                                                    <span className="bg-red-500 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1">
                                                        <AlertCircle size={10} />
                                                        مرفوض
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-base font-black text-gray-900 mb-3 line-clamp-2">{course.name}</h3>

                                            <div className="flex items-center gap-1.5 mb-4 text-sm text-gray-500">
                                                <Play size={14} />
                                                <span className="font-bold">{course.lecturesCount} محاضرات</span>
                                            </div>

                                            <div className="flex items-center gap-2 flex-wrap mb-4">
                                                <a href={course.link} target="_blank" rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors", platformColor, "hover:brightness-95")}>
                                                    <ExternalLink size={12} />
                                                    {platform}
                                                </a>
                                                {course.bookLink && (
                                                    <a href={course.bookLink} target="_blank" rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-100 bg-amber-50 text-amber-600 hover:brightness-95 transition-colors">
                                                        <Book size={12} />
                                                        الكتاب
                                                    </a>
                                                )}
                                            </div>

                                            {selectedKid && !isRegistered && requestStatus !== 'pending' && requestStatus !== 'rejected' && (
                                                <button onClick={() => setShowConfirm({ studentId: selectedKid.id, courseId: course.id, courseName: course.name })}
                                                    disabled={registering === selectedKid.id}
                                                    className="w-full h-11 bg-gradient-to-l from-emerald-500 to-teal-600 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50">
                                                    {registering === selectedKid.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <><GraduationCap size={15} /> طلب الانضمام</>
                                                    )}
                                                </button>
                                            )}

                                            {requestStatus === 'pending' && (
                                                <div className="w-full h-11 bg-amber-50 text-amber-600 text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 border border-amber-100">
                                                    <Clock size={15} />
                                                    في انتظار موافقة الإدارة
                                                </div>
                                            )}

                                            {requestStatus === 'rejected' && (
                                                <div className="w-full h-11 bg-red-50 text-red-600 text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 border border-red-100">
                                                    <AlertCircle size={15} />
                                                    تم رفض الطلب
                                                </div>
                                            )}

                                            {isRegistered && (
                                                <div className="w-full h-11 bg-emerald-50 text-emerald-600 text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 border border-emerald-100">
                                                    <CheckCircle size={15} />
                                                    أنت مسجل في هذه الدورة
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </FadeIn>
                            );
                        })}
                    </div>
                )}
            </main>

            {showConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="rtl">
                    <FadeIn show={true}>
                        <div onClick={() => setShowConfirm(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    </FadeIn>
                    <SlideIn show={true} className="bg-white rounded-3xl w-full max-w-sm p-6 relative z-10 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-black text-gray-900 border-r-4 border-emerald-500 pr-3">تأكيد طلب الانضمام</h2>
                            <button onClick={() => setShowConfirm(null)} className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="bg-gradient-to-l from-emerald-50 to-teal-50 rounded-2xl p-4 mb-5 border border-emerald-100/50 text-center">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                                <GraduationCap size={24} className="text-white" />
                            </div>
                            <p className="font-black text-gray-900 text-sm mb-1">{selectedKid?.fullName}</p>
                            <p className="text-xs text-gray-500 font-bold">سيتم إرسال طلب للانضمام إلى دورة</p>
                            <p className="text-base font-black text-emerald-600 mt-1">{showConfirm.courseName}</p>
                            <p className="text-[10px] text-amber-600 font-bold mt-2">سيتم مراجعة الطلب من قبل الإدارة</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirm(null)}
                                className="flex-1 h-12 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs border border-gray-100 active:scale-95 transition-all">
                                إلغاء
                            </button>
                            <Button onClick={() => handleRegisterRequest(showConfirm.studentId, showConfirm.courseId)}
                                disabled={registering === showConfirm.studentId}
                                className="flex-1 h-12 bg-gradient-to-l from-emerald-500 to-teal-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/20">
                                {registering === showConfirm.studentId ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : 'إرسال الطلب'}
                            </Button>
                        </div>
                    </SlideIn>
                </div>
            )}
        </div>
    );
}
