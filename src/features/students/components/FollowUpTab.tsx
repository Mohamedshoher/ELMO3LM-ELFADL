"use client";

import { useState, useMemo } from 'react';
import { Headphones, Plus, Trash2, Calendar, BookOpen, BarChart3, ExternalLink, Book, Clock } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import { useAuthStore } from '../../../store/useAuthStore';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useCourses } from '@/features/courses/hooks/useCourses';

export default function FollowUpTab({ student, records }: any) {
    const { user } = useAuthStore();
    const { listens, addListen, deleteListen } = records;
    const { data: groups } = useGroups();
    const { data: courses } = useCourses();
    const canAdd = user?.role === 'parent';
    const canDelete = user?.role === 'director';

    const studentGroup = groups?.find((g: any) => g.id === student.groupId);
    const course = courses?.find((c: any) => c.id === studentGroup?.courseId);

    const courseListens = useMemo(() => {
        if (!course) return [];
        return listens.filter((r: any) => !r.courseId || r.courseId === course.id);
    }, [listens, course]);

    const totalListened = useMemo(() => {
        return courseListens.reduce((sum: number, r: any) => sum + (r.lecturesCount || 1), 0);
    }, [courseListens]);

    const totalLectures = course?.lecturesCount || 0;
    const progress = totalLectures > 0 ? Math.min(Math.round((totalListened / totalLectures) * 100), 100) : 0;
    const isCompleted = progress >= 100;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthListened = useMemo(() => {
        return courseListens
            .filter((r: any) => r.date?.startsWith(currentMonth))
            .reduce((sum: number, r: any) => sum + (r.lecturesCount || 1), 0);
    }, [courseListens, currentMonth]);

    const [listenDate, setListenDate] = useState(new Date().toISOString().split('T')[0]);
    const [lecturesCount, setLecturesCount] = useState(1);
    const [notes, setNotes] = useState('');

    const handleAdd = () => {
        if (!course) return alert('الطالب غير مسجل في دورة');
        if (lecturesCount < 1) return alert('عدد المحاضرات يجب أن يكون 1 على الأقل');
        addListen.mutate({
            studentId: student.id,
            courseId: course.id,
            date: listenDate,
            lecturesCount,
            notes: notes || undefined
        });
        setLecturesCount(1);
        setNotes('');
        setListenDate(new Date().toISOString().split('T')[0]);
    };

    if (!course) {
        return (
            <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen size={36} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-black text-gray-400 mb-1">غير مسجل في دورة</h3>
                <p className="text-sm text-gray-400">الطالب غير مرتبط بأي دورة حالياً</p>
                <p className="text-xs text-gray-300 mt-2">يمكن ربط دورة بالطالب من خلال تعديل المجموعة</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* بطاقة الدورة */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                            <BookOpen size={22} className="text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base font-black text-gray-900">{course.name}</h3>
                            <p className="text-xs text-gray-500 font-bold">{course.lecturesCount} محاضرات</p>
                        </div>
                        <span className={cn(
                            "px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap",
                            isCompleted
                                ? "bg-green-50 text-green-600 border border-green-100"
                                : "bg-blue-50 text-blue-600 border border-blue-100"
                        )}>
                            {isCompleted ? <Clock size={14} /> : <Headphones size={14} />}
                            {isCompleted ? 'اكتملت' : 'مستمرة'}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {course.link && (
                            <a href={course.link} target="_blank" rel="noopener noreferrer"
                                className="px-3 py-1 rounded-xl text-xs font-bold bg-gray-50 text-gray-600 border border-gray-100 flex items-center gap-1.5 hover:bg-gray-100 transition-colors">
                                <ExternalLink size={14} /> فتح الرابط
                            </a>
                        )}
                        {course.bookLink && (
                            <a href={course.bookLink} target="_blank" rel="noopener noreferrer"
                                className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1.5 hover:brightness-95 transition-colors">
                                <Book size={14} /> الكتاب
                            </a>
                        )}
                    </div>

                    {/* شريط التقدم */}
                    <div className="mb-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                                <BarChart3 size={14} /> التقدم في الاستماع
                            </span>
                            <span className="text-xs font-black text-gray-700">
                                {totalListened} / {totalLectures} محاضرة
                            </span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className={cn(
                                "h-full rounded-full transition-all duration-500",
                                progress >= 100 ? "bg-green-500" : "bg-purple-500"
                            )} style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold mt-1 text-left">{progress}%</p>
                    </div>
                </div>
            </div>

            {/* نموذج الإضافة */}
            {canAdd && (
                <div className="bg-gray-50 p-5 rounded-[24px] border border-gray-100 space-y-3">
                    <h4 className="font-bold text-sm text-gray-800">تسجيل استماع محاضرات</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 block mb-1">التاريخ</label>
                            <input type="date" value={listenDate} onChange={e => setListenDate(e.target.value)}
                                className="w-full rounded-2xl p-3 text-sm bg-white text-gray-900 border-none shadow-inner" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 block mb-1">عدد المحاضرات</label>
                            <input type="number" min={1} max={50} value={lecturesCount}
                                onChange={e => setLecturesCount(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full rounded-2xl p-3 text-sm bg-white text-gray-900 border-none shadow-inner" />
                        </div>
                    </div>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                        className="w-full h-20 rounded-2xl p-4 text-sm bg-white text-gray-900 border-none shadow-inner"
                        placeholder="ملاحظات (اختياري)..." />
                    <Button onClick={handleAdd} className="w-full bg-purple-600 hover:bg-purple-700">
                        <Plus size={16} className="ml-1" /> تسجيل الاستماع
                    </Button>
                </div>
            )}

            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 flex flex-col items-center text-center">
                    <Headphones size={20} className="text-purple-500 mb-1" />
                    <span className="text-[10px] font-black text-gray-400">الإجمالي</span>
                    <span className="text-2xl font-black text-purple-700">{totalListened}</span>
                </div>
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col items-center text-center">
                    <Calendar size={20} className="text-indigo-500 mb-1" />
                    <span className="text-[10px] font-black text-gray-400">هذا الشهر</span>
                    <span className="text-2xl font-black text-indigo-700">{monthListened}</span>
                </div>
                <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 flex flex-col items-center text-center">
                    <BarChart3 size={20} className="text-teal-500 mb-1" />
                    <span className="text-[10px] font-black text-gray-400">النسبة</span>
                    <span className="text-2xl font-black text-teal-700">{progress}%</span>
                </div>
            </div>

            {/* سجل المتابعة */}
            <div className="space-y-3">
                <h4 className="font-bold text-sm text-gray-800 pr-2">سجل المتابعة</h4>
                {courseListens.length === 0 ? (
                    <div className="py-12 text-center space-y-3 bg-white rounded-[32px] border border-dashed border-gray-200">
                        <Headphones size={40} className="mx-auto text-gray-200" />
                        <p className="text-sm font-black text-gray-400">لا توجد متابعات مسجلة</p>
                    </div>
                ) : (
                    courseListens.map((listen: any) => (
                        <div key={listen.id} className="p-4 rounded-2xl border bg-white border-gray-100 shadow-sm relative text-right">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                                        <Headphones size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-800">{listen.lecturesCount || 1} محاضرات</p>
                                        <p className="text-[10px] text-gray-400 font-bold">{listen.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {canDelete && (
                                        <Trash2 size={16} className="text-gray-300 hover:text-red-500 cursor-pointer"
                                            onClick={() => deleteListen.mutate(listen.id)} />
                                    )}
                                </div>
                            </div>
                            {listen.notes && (
                                <p className="text-xs text-gray-500 font-bold bg-gray-50 p-3 rounded-xl mt-2">{listen.notes}</p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
