import { useState } from 'react';
import { Trash2, BookOpen, BarChart3, MapPin, User, Award, CheckCircle, X, GraduationCap, Clock, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import { useAuthStore } from '../../../store/useAuthStore';
import { useCourses } from '@/features/courses/hooks/useCourses';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { updateStudent } from '../services/studentService';
import { useQueryClient } from '@tanstack/react-query';

export default function ExamsTab({ student, records }: any) {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const { data: courses } = useCourses();
    const { data: groups } = useGroups();
    const { exams, addExam, deleteExam } = records;

    const studentGroup = groups?.find((g: any) => g.id === student.groupId);
    const studentCourseId = studentGroup?.courseId;
    const studentCourse = courses?.find((c: any) => c.id === studentCourseId);

    const canEdit = user?.role === 'director' || user?.role === 'teacher' || user?.role === 'supervisor';
    const isCompleted = !!student.courseCompletedAt;

    // اختبار جزئي
    const [lecturesTested, setLecturesTested] = useState(1);
    const [partialLocation, setPartialLocation] = useState('حضوري');
    const [showPartialForm, setShowPartialForm] = useState(false);

    // إكمال الدورة
    const [finalGrade, setFinalGrade] = useState('جيد');
    const [finalLocation, setFinalLocation] = useState('حضوري');
    const [showFinalForm, setShowFinalForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const partialExams = (exams || []).filter((e: any) => e.courseId && e.type !== 'إكمال دورة');
    const completionExam = (exams || []).find((e: any) => e.courseId && e.type === 'إكمال دورة');

    const totalTested = partialExams.reduce((s: number, e: any) => s + (e.lecturesTested || 0), 0);
    const totalLectures = studentCourse?.lecturesCount || 0;
    const progressPct = totalLectures > 0 ? Math.min(Math.round((totalTested / totalLectures) * 100), 100) : 0;
    const remaining = Math.max(0, totalLectures - totalTested);

    const handleAddPartial = () => {
        if (!studentCourse) return alert('الطالب غير مسجل في دورة');
        if (lecturesTested < 1) return alert('عدد المحاضرات يجب أن يكون 1 على الأقل');
        if (lecturesTested > remaining) return alert(`المتبقي فقط ${remaining} محاضرات`);

        addExam.mutate({
            studentId: student.id,
            surah: '',
            type: 'اختبار جزئي',
            grade: '',
            date: new Date().toISOString().split('T')[0],
            courseId: studentCourse.id,
            lecturesTested,
            examLocation: partialLocation,
            recordedBy: user?.displayName || user?.role || 'المدير',
        }, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['exams', student.id] });
                setLecturesTested(1);
                setPartialLocation('حضوري');
            }
        });
    };

    const handleCompleteCourse = () => {
        if (!studentCourse) return alert('الطالب غير مسجل في دورة');
        if (isCompleted) return alert('تم إكمال الدورة مسبقاً');
        setSubmitting(true);

        const completionLectures = remaining > 0 ? remaining : totalLectures;

        addExam.mutate({
            studentId: student.id,
            surah: '',
            type: 'إكمال دورة',
            grade: finalGrade,
            date: new Date().toISOString().split('T')[0],
            courseId: studentCourse.id,
            lecturesTested: completionLectures,
            examLocation: finalLocation,
            recordedBy: user?.displayName || user?.role || 'المدير',
        }, {
            onSuccess: () => {
                updateStudent(student.id, {
                    courseCompletedAt: new Date().toISOString(),
                    courseFinalGrade: finalGrade,
                } as any).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['students'] });
                    queryClient.invalidateQueries({ queryKey: ['exams', student.id] });
                    setSubmitting(false);
                }).catch(() => setSubmitting(false));
            },
            onError: () => setSubmitting(false),
        });
    };

    const handleUndoComplete = async () => {
        if (!completionExam) return;
        setSubmitting(true);
        try {
            deleteExam.mutate(completionExam.id);
            await updateStudent(student.id, {
                courseCompletedAt: null,
                courseFinalGrade: null,
            } as any);
            queryClient.invalidateQueries({ queryKey: ['students'] });
        } catch (e) {
            console.error(e);
        }
        setSubmitting(false);
    };

    const courseGradeColor = (g: string) => {
        if (g === 'ممتاز') return 'bg-green-50 text-green-600 border-green-100/50';
        if (g === 'جيد جداً') return 'bg-blue-50 text-blue-600 border-blue-100/50';
        return 'bg-amber-50 text-amber-600 border-amber-100/50';
    };

    if (!studentCourse) {
        return (
            <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen size={36} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-black text-gray-400 mb-1">غير مسجل في دورة</h3>
                <p className="text-sm text-gray-400">الطالب غير مرتبط بأي دورة حالياً</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* بطاقة الدورة */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                <div className="flex items-center gap-2 sm:gap-3 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                        <BookOpen size={18} className="text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-black text-gray-900 truncate">{studentCourse.name}</h3>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-bold">{studentCourse.lecturesCount} محاضرات</p>
                    </div>
                    <span className={cn(
                        "px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold flex items-center gap-1 shrink-0",
                        isCompleted
                            ? "bg-green-50 text-green-600 border border-green-100"
                            : "bg-blue-50 text-blue-600 border border-blue-100"
                    )}>
                        {isCompleted ? <Award size={12} /> : <Clock size={12} />}
                        {isCompleted ? 'مكتملة' : 'مستمرة'}
                    </span>
                </div>

                {/* شريط التقدم */}
                <div className="mb-2">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500">التقدم</span>
                        <span className="text-[10px] sm:text-xs font-black text-gray-700">{totalTested} / {totalLectures}</span>
                    </div>
                    <div className="w-full h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", progressPct >= 100 ? "bg-green-500" : "bg-purple-500")}
                            style={{ width: `${progressPct}%` }} />
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold mt-1">{progressPct}%</p>
                </div>
            </div>

            {/* أيقونة تسجيل اختبار جزئي */}
            {canEdit && !isCompleted && (
                <button
                    onClick={() => setShowPartialForm(!showPartialForm)}
                    className={cn(
                        "w-full flex items-center justify-between p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] border transition-all text-right",
                        showPartialForm
                            ? "bg-purple-50 border-purple-200 shadow-sm"
                            : "bg-white border-gray-100 hover:border-purple-200 hover:bg-purple-50/30"
                    )}
                >
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", showPartialForm ? "bg-purple-100" : "bg-gray-50")}>
                            <BookOpen size={18} className={showPartialForm ? "text-purple-600" : "text-gray-400"} />
                        </div>
                        <div className="text-right">
                            <span className="font-black text-xs sm:text-sm block text-gray-900">تسجيل اختبار جزئي</span>
                            <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold">اختبار على عدد محاضرات محددة</span>
                        </div>
                    </div>
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-transform", showPartialForm && "rotate-45", showPartialForm ? "bg-purple-200" : "bg-gray-100")}>
                        <Plus size={16} className={showPartialForm ? "text-purple-700" : "text-gray-500"} />
                    </div>
                </button>
            )}

            {/* محتوى اختبار جزئي */}
            {canEdit && !isCompleted && showPartialForm && (
                <div className="bg-gray-50 p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] border border-gray-100 space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 mb-1 block">عدد المحاضرات</label>
                            <input
                                type="number" min={1} max={remaining || 1}
                                value={lecturesTested}
                                onChange={e => setLecturesTested(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full h-10 sm:h-11 rounded-xl text-xs font-bold px-3 sm:px-4 border-gray-100 bg-white"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 mb-1 block">مكان الاختبار</label>
                            <select value={partialLocation} onChange={e => setPartialLocation(e.target.value)}
                                className="w-full h-10 sm:h-11 rounded-xl text-xs font-bold px-3 sm:px-4 border-gray-100 bg-white">
                                <option value="حضوري">حضوري</option>
                                <option value="أون لاين">أون لاين</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-gray-500 font-bold bg-white rounded-xl px-3 py-2 border border-gray-100">
                        <User size={13} />
                        المختبر: {user?.displayName || (user?.role === 'teacher' ? 'مدرس' : 'مدير')}
                    </div>
                    <Button onClick={handleAddPartial} className="w-full bg-purple-600 hover:bg-purple-700 text-sm sm:text-base">
                        تسجيل الاختبار
                    </Button>
                </div>
            )}

            {/* أيقونة إكمال الدورة */}
            {canEdit && !isCompleted && remaining === 0 && totalLectures > 0 && (
                <button
                    onClick={() => setShowFinalForm(!showFinalForm)}
                    className={cn(
                        "w-full flex items-center justify-between p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] border transition-all text-right",
                        showFinalForm
                            ? "bg-amber-50 border-amber-200 shadow-sm"
                            : "bg-white border-gray-100 hover:border-amber-200 hover:bg-amber-50/30"
                    )}
                >
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", showFinalForm ? "bg-amber-100" : "bg-gray-50")}>
                            <GraduationCap size={18} className={showFinalForm ? "text-amber-600" : "text-gray-400"} />
                        </div>
                        <div className="text-right">
                            <span className="font-black text-xs sm:text-sm block text-gray-900">الاختبار النهائي - إكمال الدورة</span>
                            <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold">تم اختبار جميع المحاضرات</span>
                        </div>
                    </div>
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-transform", showFinalForm && "rotate-45", showFinalForm ? "bg-amber-200" : "bg-gray-100")}>
                        <Plus size={16} className={showFinalForm ? "text-amber-700" : "text-gray-500"} />
                    </div>
                </button>
            )}

            {/* محتوى إكمال الدورة */}
            {canEdit && !isCompleted && showFinalForm && remaining === 0 && totalLectures > 0 && (
                <div className="bg-gradient-to-l from-amber-50 to-yellow-50 p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] border border-amber-100 space-y-3 sm:space-y-4">
                    <p className="text-[10px] text-gray-500 font-bold">
                        سجل الاختبار النهائي لإكمال الدورة مع التقدير العام واسم الممتحن.
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 mb-1 block">التقدير العام</label>
                            <select value={finalGrade} onChange={e => setFinalGrade(e.target.value)}
                                className="w-full h-10 sm:h-11 rounded-xl text-xs font-bold px-3 sm:px-4 border-gray-100 bg-white">
                                <option value="جيد">جيد</option>
                                <option value="جيد جداً">جيد جداً</option>
                                <option value="ممتاز">ممتاز</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 mb-1 block">مكان الاختبار</label>
                            <select value={finalLocation} onChange={e => setFinalLocation(e.target.value)}
                                className="w-full h-10 sm:h-11 rounded-xl text-xs font-bold px-3 sm:px-4 border-gray-100 bg-white">
                                <option value="حضوري">حضوري</option>
                                <option value="أون لاين">أون لاين</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-gray-500 font-bold bg-white rounded-xl px-3 py-2 border border-gray-100">
                        <User size={13} />
                        الممتحن: {user?.displayName || (user?.role === 'teacher' ? 'مدرس' : 'مدير')}
                    </div>
                    <button
                        onClick={handleCompleteCourse}
                        disabled={submitting}
                        className="w-full h-10 sm:h-12 bg-gradient-to-l from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        ) : (
                            <><GraduationCap size={15} /> إكمال الدورة</>
                        )}
                    </button>
                </div>
            )}

            {/* إلغاء الإكمال */}
            {canEdit && isCompleted && (
                <div className="bg-green-50 p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] border border-green-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs sm:text-sm flex items-center gap-2 text-green-700">
                            <CheckCircle size={15} />
                            تم إكمال الدورة
                        </h4>
                        <button
                            onClick={handleUndoComplete}
                            disabled={submitting}
                            className="h-8 sm:h-9 px-3 sm:px-4 bg-red-50 text-red-600 rounded-xl font-black text-[9px] sm:text-[10px] border border-red-100 hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center gap-1"
                        >
                            <X size={12} /> تراجع
                        </button>
                    </div>
                    <p className="text-[11px] sm:text-xs text-green-600 font-bold">
                        التقدير: {student.courseFinalGrade || finalGrade}
                        {completionExam?.recordedBy && ` • الممتحن: ${completionExam.recordedBy}`}
                        {student.courseCompletedAt && ` • ${new Date(student.courseCompletedAt).toLocaleDateString('ar-EG')}`}
                    </p>
                </div>
            )}

            {/* قائمة الاختبارات */}
            <div className="space-y-2 sm:space-y-3">
                <h4 className="font-bold text-xs sm:text-sm text-gray-500 flex items-center gap-1.5">
                    <BarChart3 size={13} />
                    سجل الاختبارات
                </h4>

                {[...exams]
                    .filter((e: any) => e.courseId)
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((exam: any) => {
                        const isCompletion = exam.type === 'إكمال دورة';
                        return (
                            <div key={exam.id} className={cn(
                                "p-3 sm:p-4 rounded-2xl border shadow-sm",
                                isCompletion
                                    ? "bg-gradient-to-l from-amber-50 to-yellow-50 border-amber-100"
                                    : "bg-white border-gray-100"
                            )}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                        {isCompletion ? (
                                            <GraduationCap size={13} className="text-amber-600" />
                                        ) : (
                                            <BookOpen size={13} className="text-purple-500" />
                                        )}
                                        <span className="font-black text-gray-900 text-xs sm:text-sm">
                                            {isCompletion ? 'إكمال الدورة' : 'اختبار جزئي'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {exam.grade && (
                                            <span className={cn("text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-lg border", courseGradeColor(exam.grade))}>
                                                {exam.grade}
                                            </span>
                                        )}
                                        {user?.role === 'director' && (
                                            <button onClick={() => deleteExam.mutate(exam.id)}
                                                className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 hover:text-red-500 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors" title="حذف">
                                                <Trash2 size={11} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] sm:text-[10px] text-gray-500 font-bold">
                                    {exam.lecturesTested > 0 && (
                                        <span className="flex items-center gap-1"><BarChart3 size={11} />{exam.lecturesTested} محاضرة</span>
                                    )}
                                    <span className="flex items-center gap-1"><MapPin size={11} />{exam.examLocation || 'حضوري'}</span>
                                    <span className="flex items-center gap-1"><User size={11} />{exam.recordedBy || 'المدير'}</span>
                                    <span className="text-gray-300 hidden sm:inline">|</span>
                                    <span className="sm:mr-0 mr-auto">{exam.date}</span>
                                </div>
                            </div>
                        );
                    })}

                {(!exams || exams.filter((e: any) => e.courseId).length === 0) && (
                    <div className="text-center py-8 sm:py-10 text-gray-400 text-xs font-bold">لا توجد اختبارات مسجلة</div>
                )}
            </div>
        </div>
    );
}
