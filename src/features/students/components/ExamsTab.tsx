import { useState } from 'react';
import { Trash2, Pencil, Check, X, BookOpen, BarChart3, MapPin, GraduationCap, User } from 'lucide-react';
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
    const { exams, addExam, deleteExam, updateExam } = records;
    const [surahName, setSurahName] = useState('');
    const [examType, setExamType] = useState('جديد');
    const [examGrade, setExamGrade] = useState('ممتاز');
    const [activeSubTab, setActiveSubTab] = useState('جديد');

    const studentGroup = groups?.find((g: any) => g.id === student.groupId);
    const studentCourseId = studentGroup?.courseId;
    const studentCourse = courses?.find((c: any) => c.id === studentCourseId);

    const [examMode, setExamMode] = useState<'quran' | 'course'>('quran');
    const [courseId, setCourseId] = useState(studentCourseId || '');
    const [lecturesTested, setLecturesTested] = useState(1);
    const [courseGrade, setCourseGrade] = useState('جيد');
    const [examLocation, setExamLocation] = useState('حضوري');

    const [editingExamId, setEditingExamId] = useState<string | null>(null);
    const [editType, setEditType] = useState('');

    const canEdit = user?.role === 'director' || user?.role === 'teacher' || user?.role === 'supervisor';

    const handleAddQuran = () => {
        if (!surahName) return alert('أدخل اسم السورة');
        addExam.mutate({
            studentId: student.id,
            surah: surahName,
            type: examType,
            grade: examGrade,
            date: new Date().toISOString().split('T')[0],
        });
        setSurahName('');
    };

    const handleAddCourse = () => {
        if (!courseId) return alert('اختر الدورة');
        if (lecturesTested < 1) return alert('عدد المحاضرات يجب أن يكون 1 على الأقل');
        addExam.mutate({
            studentId: student.id,
            surah: '',
            type: 'دورة',
            grade: courseGrade,
            date: new Date().toISOString().split('T')[0],
            courseId,
            lecturesTested,
            examLocation,
            recordedBy: user?.displayName || user?.role || 'المدير',
        }, {
            onSuccess: () => {
                const selectedCourse = courses?.find((c: any) => c.id === courseId);
                if (selectedCourse) {
                    const allCourseExams = (exams || []).filter((e: any) => e.courseId === courseId);
                    const currentTotal = allCourseExams.reduce((s: number, e: any) => s + (e.lecturesTested || 0), 0);
                    const newTotal = currentTotal + lecturesTested;
                    if (newTotal >= selectedCourse.lecturesCount) {
                        updateStudent(student.id, {
                            courseCompletedAt: new Date().toISOString(),
                            courseFinalGrade: courseGrade,
                        } as any).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['students'] });
                        });
                    }
                }
                setLecturesTested(1);
                setCourseGrade('جيد');
            }
        });
    };

    const handleStartEdit = (exam: any) => {
        setEditingExamId(exam.id);
        setEditType(exam.type);
    };

    const handleSaveEdit = (examId: string) => {
        updateExam.mutate({ id: examId, data: { type: editType } });
        setEditingExamId(null);
    };

    const handleCancelEdit = () => setEditingExamId(null);

    const gradeColor = (grade: string) => {
        if (grade === 'ممتاز') return 'bg-green-50 text-green-600 border-green-100/50';
        if (grade === 'يعاد') return 'bg-red-50 text-red-500 border-red-100/50';
        if (grade === 'جيد جداً') return 'bg-blue-50 text-blue-600 border-blue-100/50';
        if (grade === 'جيد') return 'bg-amber-50 text-amber-600 border-amber-100/50';
        return 'bg-blue-50 text-blue-600 border-blue-100/50';
    };

    const courseGradeColor = (g: string) => {
        if (g === 'ممتاز') return 'bg-green-50 text-green-600 border-green-100/50';
        if (g === 'جيد جداً') return 'bg-blue-50 text-blue-600 border-blue-100/50';
        return 'bg-amber-50 text-amber-600 border-amber-100/50';
    };

    const courseExams = (exams || []).filter((e: any) => e.courseId);
    const quranExams = (exams || []).filter((e: any) => !e.courseId);

    const courseProgress = (cId: string) => {
        const c = courses?.find((x: any) => x.id === cId);
        if (!c || !c.lecturesCount) return { tested: 0, total: 0, pct: 0 };
        const tested = courseExams.filter((e: any) => e.courseId === cId)
            .reduce((s: number, e: any) => s + (e.lecturesTested || 0), 0);
        const pct = Math.min(Math.round((tested / c.lecturesCount) * 100), 100);
        return { tested, total: c.lecturesCount, pct };
    };

    return (
        <div className="space-y-4">
            {/* تبديل وضع الاختبارات */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                    onClick={() => setExamMode('quran')}
                    className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5", examMode === 'quran' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}
                >
                    <GraduationCap size={14} />
                    القرآنية
                </button>
                <button
                    onClick={() => setExamMode('course')}
                    className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5", examMode === 'course' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}
                >
                    <BookOpen size={14} />
                    الدورات
                </button>
            </div>

            {examMode === 'quran' && (
                <>
                    {/* نموذج تسجيل اختبار قرآني */}
                    <div className="bg-gray-50 p-5 rounded-[24px] border border-gray-100 space-y-4">
                        <h4 className="font-bold text-sm">تسجيل اختبار قرآني</h4>
                        <input
                            type="text"
                            value={surahName}
                            onChange={e => setSurahName(e.target.value)}
                            placeholder="اسم السورة"
                            className="w-full h-11 rounded-xl px-4 text-sm border-gray-100"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <select value={examType} onChange={e => setExamType(e.target.value)} className="h-11 rounded-xl text-xs font-bold">
                                <option>جديد</option><option>ماضي قريب</option><option>ماضي بعيد</option>
                            </select>
                            <select value={examGrade} onChange={e => setExamGrade(e.target.value)} className="h-11 rounded-xl text-xs font-bold">
                                <option>ممتاز</option><option>جيد جداً</option><option>جيد</option><option>يعاد</option>
                            </select>
                        </div>
                        <Button onClick={handleAddQuran} className="w-full bg-blue-600">حفظ النتيجة</Button>
                    </div>

                    {/* تبويبات تصفية القرآنية */}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        {['جديد', 'ماضي قريب', 'ماضي بعيد'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveSubTab(tab)}
                                className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", activeSubTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* قائمة الاختبارات القرآنية */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {quranExams.filter((e: any) => e.type === activeSubTab).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((exam: any) => (
                            <div
                                key={exam.id}
                                className="p-4 bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3 group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-gray-900 text-sm">{exam.surah}</span>
                                        <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-lg border shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)]", gradeColor(exam.grade))}>
                                            {exam.grade}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {editingExamId === exam.id ? (
                                            <>
                                                <button onClick={() => handleSaveEdit(exam.id)} className="w-7 h-7 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"><Check size={13} /></button>
                                                <button onClick={handleCancelEdit} className="w-7 h-7 bg-gray-200 text-gray-500 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"><X size={13} /></button>
                                            </>
                                        ) : (
                                            <>
                                                {canEdit && (
                                                    <button onClick={() => handleStartEdit(exam)} className="w-7 h-7 text-blue-400 hover:text-blue-600 flex items-center justify-center rounded-lg hover:bg-blue-50 transition-colors" title="تغيير النوع"><Pencil size={13} /></button>
                                                )}
                                                {user?.role === 'director' && (
                                                    <button onClick={() => deleteExam.mutate(exam.id)} className="w-7 h-7 text-gray-300 hover:text-red-500 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors" title="حذف"><Trash2 size={13} /></button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                                    <div className="flex items-center gap-2">
                                        {editingExamId === exam.id ? (
                                            <select value={editType} onChange={e => setEditType(e.target.value)} autoFocus className="text-[10px] font-bold border border-blue-200 rounded-lg px-2 py-0.5 bg-blue-50 text-blue-700 focus:outline-none">
                                                <option>جديد</option><option>ماضي قريب</option><option>ماضي بعيد</option>
                                            </select>
                                        ) : (
                                            <span className="text-[10px] font-bold bg-gray-50 text-gray-500 px-2 py-1 rounded-lg border border-gray-100">{exam.type}</span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold">{exam.date}</span>
                                </div>
                            </div>
                        ))}
                        {quranExams.filter((e: any) => e.type === activeSubTab).length === 0 && (
                            <div className="col-span-full text-center py-10 text-gray-400 text-xs font-bold">لا توجد اختبارات في هذه الفئة</div>
                        )}
                    </div>
                </>
            )}

            {examMode === 'course' && (
                <>
                    {/* نموذج تسجيل اختبار دورة */}
                    <div className="bg-gray-50 p-5 rounded-[24px] border border-gray-100 space-y-4">
                        <h4 className="font-bold text-sm flex items-center gap-2"><BookOpen size={16} />تسجيل اختبار دورة</h4>

                        {studentCourse ? (
                            <div className="bg-white rounded-xl p-3 border border-purple-100 flex items-center gap-3">
                                <BookOpen size={18} className="text-purple-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-black text-gray-900">{studentCourse.name}</p>
                                    <p className="text-[10px] font-bold text-gray-500">{studentCourse.lecturesCount} محاضرة</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 font-bold text-center py-4">الطالب غير مسجل في أي دورة</p>
                        )}

                        {studentCourse && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">عدد المحاضرات المختبرة</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={lecturesTested}
                                            onChange={e => setLecturesTested(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-full h-11 rounded-xl text-xs font-bold px-4 border-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">مكان الاختبار</label>
                                        <select value={examLocation} onChange={e => setExamLocation(e.target.value)} className="w-full h-11 rounded-xl text-xs font-bold px-4 border-gray-100">
                                            <option value="حضوري">حضوري</option>
                                            <option value="أون لاين">أون لاين</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <select value={courseGrade} onChange={e => setCourseGrade(e.target.value)} className="h-11 rounded-xl text-xs font-bold px-4 border-gray-100">
                                        <option value="جيد">جيد</option>
                                        <option value="جيد جداً">جيد جداً</option>
                                        <option value="ممتاز">ممتاز</option>
                                    </select>
                                    <div />
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold bg-white rounded-xl px-3 py-2 border border-gray-100">
                                    <User size={14} />
                                    المختبر: {user?.displayName || (user?.role === 'teacher' ? 'مدرس' : 'مدير')}
                                </div>
                                <Button onClick={handleAddCourse} className="w-full bg-purple-600">تسجيل الاختبار</Button>
                            </>
                        )}
                    </div>

                    {/* أشرطة التقدم للدورات */}
                    {courseExams.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-bold text-xs text-gray-500 flex items-center gap-1.5">
                                <BarChart3 size={14} />
                                التقدم في الدورات
                            </h4>
                            {[...new Set(courseExams.map((e: any) => e.courseId))].map((cId: any) => {
                                const course = courses?.find((c: any) => c.id === cId);
                                if (!course) return null;
                                const { tested, total, pct } = courseProgress(cId);
                                return (
                                    <div key={cId} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-black text-gray-800">{course.name}</span>
                                            <span className="text-[10px] font-bold text-gray-500">{tested}/{total}</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-green-500" : "bg-purple-500")}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* قائمة اختبارات الدورات */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-xs text-gray-500">سجل اختبارات الدورات</h4>
                        {courseExams.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((exam: any) => {
                            const course = courses?.find((c: any) => c.id === exam.courseId);
                            return (
                                <div key={exam.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <BookOpen size={14} className="text-purple-500" />
                                            <span className="font-black text-gray-900 text-sm">{course?.name || 'دورة'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-lg border", courseGradeColor(exam.grade))}>
                                                {exam.grade}
                                            </span>
                                            {user?.role === 'director' && (
                                                <button onClick={() => deleteExam.mutate(exam.id)} className="w-6 h-6 text-gray-300 hover:text-red-500 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors" title="حذف">
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 font-bold">
                                        <span className="flex items-center gap-1"><BarChart3 size={12} />{exam.lecturesTested} محاضرة</span>
                                        <span className="flex items-center gap-1"><MapPin size={12} />{exam.examLocation || 'حضوري'}</span>
                                        <span className="flex items-center gap-1"><User size={12} />{exam.recordedBy || 'المدير'}</span>
                                        <span className="text-gray-300">|</span>
                                        <span>{exam.date}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {courseExams.length === 0 && (
                            <div className="text-center py-10 text-gray-400 text-xs font-bold">لا توجد اختبارات دورات مسجلة</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}