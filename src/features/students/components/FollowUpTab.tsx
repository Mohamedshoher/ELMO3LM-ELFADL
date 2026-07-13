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

    const studentGroupIds: string[] = student.groupIds?.length
        ? student.groupIds
        : (student.groupId ? [student.groupId] : []);

    const studentCourses = studentGroupIds
        .map(gid => groups?.find((g: any) => g.id === gid))
        .filter(Boolean)
        .map((g: any) => {
            const course = courses?.find((c: any) => c.id === g?.courseId);
            return course ? { group: g, course } : null;
        })
        .filter(Boolean);

    const [listenDate, setListenDate] = useState(new Date().toISOString().split('T')[0]);
    const [lecturesCount, setLecturesCount] = useState(1);
    const [notes, setNotes] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

    const listenCourseId = selectedCourseId || studentCourses[0]?.course?.id || null;

    const handleAdd = async () => {
        if (!listenCourseId) return alert('الطالب غير مسجل في دورة');
        if (lecturesCount < 1) return alert('عدد المحاضرات يجب أن يكون 1 على الأقل');

        const listenCourse = studentCourses.find((sc: any) => sc.course.id === listenCourseId);
        const course = listenCourse?.course;
        const courseListens = listens.filter((r: any) => !r.courseId || r.courseId === course?.id);
        const totalListened = courseListens.reduce((sum: number, r: any) => sum + (r.lecturesCount || 1), 0);
        const remaining = Math.max(0, (course?.lecturesCount || 0) - totalListened);
        if (lecturesCount > remaining) return alert(`لا يمكن تجاوز عدد محاضرات الدورة. المتبقي: ${remaining} محاضرات`);

        try {
            const { supabase } = await import('@/lib/supabase');
            await supabase
                .from('attendance')
                .delete()
                .eq('student_id', student.id)
                .eq('date', listenDate);

            const monthPart = listenDate.substring(0, 7);
            await supabase
                .from('attendance')
                .insert([{
                    student_id: student.id,
                    date: listenDate,
                    month_key: monthPart,
                    status: 'present',
                }]);
        } catch (e) {
            console.error('Error updating attendance:', e);
        }

        addListen.mutate({
            studentId: student.id,
            courseId: listenCourseId,
            date: listenDate,
            lecturesCount,
            notes: notes || undefined
        });
        setLecturesCount(1);
        setNotes('');
        setListenDate(new Date().toISOString().split('T')[0]);
    };

    if (studentCourses.length === 0) {
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
        <div className="space-y-6">
            {studentCourses.map(({ group, course }: any) => {
                const courseListens = listens.filter((r: any) => !r.courseId || r.courseId === course.id);
                const totalListened = courseListens.reduce((sum: number, r: any) => sum + (r.lecturesCount || 1), 0);
                const totalLectures = course?.lecturesCount || 0;
                const progress = totalLectures > 0 ? Math.min(Math.round((totalListened / totalLectures) * 100), 100) : 0;
                const isCompleted = progress >= 100;
                const currentMonth = new Date().toISOString().slice(0, 7);
                const monthListened = courseListens
                    .filter((r: any) => r.date?.startsWith(currentMonth))
                    .reduce((sum: number, r: any) => sum + (r.lecturesCount || 1), 0);
                const isExpanded = expandedCourseId === course.id;

                return (
                    <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <button
                            onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                            className="w-full text-right p-4 sm:p-5 hover:bg-gray-50/50 transition-colors"
                        >
                            <div className="flex items-center gap-2 sm:gap-3 mb-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                                    <BookOpen size={18} className="text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm sm:text-base font-black text-gray-900 truncate">{course.name}</h3>
                                    <p className="text-[10px] sm:text-xs text-gray-500 font-bold">{course.lecturesCount} محاضرات • {group.name}</p>
                                </div>
                                <span className={cn(
                                    "px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold flex items-center gap-1 shrink-0",
                                    isCompleted
                                        ? "bg-green-50 text-green-600 border border-green-100"
                                        : "bg-blue-50 text-blue-600 border border-blue-100"
                                )}>
                                    {isCompleted ? <Clock size={12} /> : <Headphones size={12} />}
                                    {isCompleted ? 'اكتملت' : 'مستمرة'}
                                </span>
                            </div>

                            {/* شريط التقدم */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] sm:text-xs font-bold text-gray-500 flex items-center gap-1.5">
                                        <BarChart3 size={12} /> التقدم في الاستماع
                                    </span>
                                    <span className="text-[10px] sm:text-xs font-black text-gray-700">
                                        {totalListened} / {totalLectures} محاضرة
                                    </span>
                                </div>
                                <div className="w-full h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={cn(
                                        "h-full rounded-full transition-all duration-500",
                                        progress >= 100 ? "bg-green-500" : "bg-purple-500"
                                    )} style={{ width: `${progress}%` }} />
                                </div>
                                <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold mt-1 text-left">{progress}%</p>
                            </div>

                            {/* إحصائيات سريعة */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                <div className="bg-purple-50/50 p-3 sm:p-4 rounded-2xl border border-purple-100 flex flex-col items-center text-center">
                                    <Headphones size={16} className="text-purple-500 mb-1" />
                                    <span className="text-[8px] sm:text-[10px] font-black text-gray-400">الإجمالي</span>
                                    <span className="text-lg sm:text-2xl font-black text-purple-700">{totalListened}</span>
                                </div>
                                <div className="bg-indigo-50/50 p-3 sm:p-4 rounded-2xl border border-indigo-100 flex flex-col items-center text-center">
                                    <Calendar size={16} className="text-indigo-500 mb-1" />
                                    <span className="text-[8px] sm:text-[10px] font-black text-gray-400">هذا الشهر</span>
                                    <span className="text-lg sm:text-2xl font-black text-indigo-700">{monthListened}</span>
                                </div>
                                <div className="bg-teal-50/50 p-3 sm:p-4 rounded-2xl border border-teal-100 flex flex-col items-center text-center">
                                    <BarChart3 size={16} className="text-teal-500 mb-1" />
                                    <span className="text-[8px] sm:text-[10px] font-black text-gray-400">النسبة</span>
                                    <span className="text-lg sm:text-2xl font-black text-teal-700">{progress}%</span>
                                </div>
                            </div>
                        </button>

                        {/* سجل متابعة الدورة عند الضغط */}
                        {isExpanded && (
                            <div className="border-t border-gray-100 p-4 sm:p-5 space-y-2 sm:space-y-3">
                                <h4 className="font-bold text-xs sm:text-sm text-gray-800">سجل المتابعة</h4>
                                {courseListens.length === 0 ? (
                                    <div className="py-8 sm:py-10 text-center space-y-2 bg-gray-50 rounded-[20px] border border-dashed border-gray-200">
                                        <Headphones size={24} className="mx-auto text-gray-200" />
                                        <p className="text-xs sm:text-sm font-black text-gray-400">لا توجد متابعات لهذه الدورة</p>
                                    </div>
                                ) : (
                                    courseListens.map((listen: any) => (
                                        <div key={listen.id} className="p-3 sm:p-4 rounded-2xl border bg-white border-gray-100 shadow-sm relative text-right">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                                                        <Headphones size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs sm:text-sm font-black text-gray-800">{listen.lecturesCount || 1} محاضرات</p>
                                                        <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold">{listen.date}</p>
                                                    </div>
                                                </div>
                                                {canDelete && (
                                                    <Trash2 size={15} className="text-gray-300 hover:text-red-500 cursor-pointer transition-colors"
                                                        onClick={() => deleteListen.mutate(listen.id)} />
                                                )}
                                            </div>
                                            {listen.notes && (
                                                <p className="text-[11px] sm:text-xs text-gray-500 font-bold bg-gray-50 p-2.5 sm:p-3 rounded-xl mt-2">{listen.notes}</p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* نموذج الإضافة مع اختيار الدورة */}
            {canAdd && studentCourses.length > 0 && (
                <div className="bg-gray-50 p-4 sm:p-5 rounded-[24px] border border-gray-100 space-y-3">
                    <h4 className="font-bold text-xs sm:text-sm text-gray-800">تسجيل استماع محاضرات</h4>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {studentCourses.length > 1 && (
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 block mb-1">الدورة</label>
                                <select value={listenCourseId || ''} onChange={e => setSelectedCourseId(e.target.value)}
                                    className="w-full rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-xs sm:text-sm bg-white text-gray-900 border-none shadow-inner">
                                    {studentCourses.map((sc: any) => (
                                        <option key={sc.course.id} value={sc.course.id}>{sc.course.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 block mb-1">التاريخ</label>
                            <input type="date" value={listenDate} onChange={e => setListenDate(e.target.value)}
                                className="w-full rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-xs sm:text-sm bg-white text-gray-900 border-none shadow-inner" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 block mb-1">عدد المحاضرات</label>
                            <input type="number" min={1} max={50} value={lecturesCount}
                                onChange={e => setLecturesCount(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-xs sm:text-sm bg-white text-gray-900 border-none shadow-inner" />
                        </div>
                    </div>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                        className="w-full h-16 sm:h-20 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-xs sm:text-sm bg-white text-gray-900 border-none shadow-inner"
                        placeholder="ملاحظات (اختياري)..." />
                    <Button onClick={handleAdd} className="w-full bg-purple-600 hover:bg-purple-700 text-sm sm:text-base">
                        <Plus size={15} className="ml-1" /> تسجيل الاستماع
                    </Button>
                </div>
            )}
        </div>
    );
}
