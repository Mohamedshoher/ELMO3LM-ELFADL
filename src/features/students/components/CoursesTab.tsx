import { useMemo } from 'react';
import { BookOpen, ExternalLink, Award, BarChart3, Book, User } from 'lucide-react';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useCourses } from '@/features/courses/hooks/useCourses';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export default function CoursesTab({ student, records }: any) {
    const queryClient = useQueryClient();
    const { data: groups } = useGroups();
    const { data: courses } = useCourses();
    const { exams, listens } = records || {};

    const freshStudent = useMemo(() => {
        const allStudentsData = queryClient.getQueriesData<any>({ queryKey: ['students'] });
        for (const [, data] of allStudentsData) {
            if (Array.isArray(data)) {
                const found = data.find((s: any) => s.id === student.id);
                if (found) return found;
            }
        }
        return student;
    }, [student, queryClient]);

    const studentGroup = groups?.find((g: any) => g.id === freshStudent.groupId);
    const course = courses?.find((c: any) => c.id === studentGroup?.courseId);

    const partialExams = (exams || []).filter((e: any) => e.courseId && e.type !== 'إكمال دورة');
    const completionExam = (exams || []).find((e: any) => e.courseId && e.type === 'إكمال دورة');
    const courseListens = (listens || []).filter((r: any) => !r.courseId || r.courseId === course?.id);
    const totalTested = partialExams.reduce((sum: number, e: any) => sum + (e.lecturesTested || 0), 0);
    const totalListened = courseListens.reduce((sum: number, r: any) => sum + (r.lecturesCount || 1), 0);
    const totalCompleted = totalTested + totalListened;
    const totalLectures = course?.lecturesCount || 0;
    const progress = totalLectures > 0 ? Math.min(Math.round((totalCompleted / totalLectures) * 100), 100) : 0;
    const isCompleted = progress >= 100 || !!freshStudent.courseCompletedAt;

    const registeredDate = freshStudent.courseRegisteredAt
        ? new Date(freshStudent.courseRegisteredAt).toLocaleDateString('ar-EG')
        : null;
    const completedDate = freshStudent.courseCompletedAt
        ? new Date(freshStudent.courseCompletedAt).toLocaleDateString('ar-EG')
        : null;

    if (!course) {
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
            <div className={cn(
                "rounded-2xl border shadow-sm overflow-hidden transition-all",
                isCompleted
                    ? "bg-gradient-to-l from-green-50 to-emerald-50 border-green-200"
                    : "bg-white border-gray-100"
            )}>
                <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                            isCompleted ? "bg-green-100" : "bg-purple-50"
                        )}>
                            <BookOpen size={22} className={isCompleted ? "text-green-600" : "text-purple-600"} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base font-black text-gray-900">{course.name}</h3>
                            <p className="text-xs text-gray-500 font-bold">{course.lecturesCount} محاضرات</p>
                        </div>
                        <span className={cn(
                            "px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5",
                            isCompleted
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-blue-50 text-blue-600 border border-blue-100"
                        )}>
                            {isCompleted ? <Award size={14} /> : <BookOpen size={14} />}
                            {isCompleted ? 'مكتملة' : 'مستمرة'}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {course.link && (
                            <a href={course.link} target="_blank" rel="noopener noreferrer"
                                className="px-3 py-1 rounded-xl text-xs font-bold bg-gray-50 text-gray-600 border border-gray-100 flex items-center gap-1.5 hover:bg-gray-100 transition-colors">
                                <ExternalLink size={14} />
                                فتح الرابط
                            </a>
                        )}
                        {course.bookLink && (
                            <a href={course.bookLink} target="_blank" rel="noopener noreferrer"
                                className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1.5 hover:brightness-95 transition-colors">
                                <Book size={14} />
                                الكتاب
                            </a>
                        )}
                    </div>

                    {/* شريط التقدم */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                                <BarChart3 size={14} />
                                التقدم
                            </span>
                            <span className={cn(
                                "text-xs font-black",
                                isCompleted ? "text-green-700" : "text-gray-700"
                            )}>
                                {totalCompleted} / {totalLectures} محاضرة
                            </span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className={cn(
                                "h-full rounded-full transition-all duration-500",
                                progress >= 100 ? "bg-green-500" : "bg-purple-500"
                            )} style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">{progress}%</p>
                    </div>

                    {/* التقدير النهائي - يظهر فقط عند إكمال الدورة */}
                    {isCompleted && freshStudent.courseFinalGrade && (
                        <div className="bg-white/80 border border-green-200 rounded-xl px-4 py-3 mb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-green-700">التقدير العام</span>
                                <span className={cn(
                                    "text-sm font-black px-3 py-1 rounded-lg",
                                    freshStudent.courseFinalGrade === 'ممتاز' && "bg-green-100 text-green-700",
                                    freshStudent.courseFinalGrade === 'جيد جداً' && "bg-blue-100 text-blue-700",
                                    freshStudent.courseFinalGrade === 'جيد' && "bg-amber-100 text-amber-700"
                                )}>
                                    {freshStudent.courseFinalGrade}
                                </span>
                            </div>
                            {completionExam?.recordedBy && (
                                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-green-600 font-bold">
                                    <User size={12} />
                                    الممتحن: {completionExam.recordedBy}
                                </div>
                            )}
                        </div>
                    )}

                    {/* التواريخ */}
                    <div className="space-y-2 text-sm">
                        {registeredDate && (
                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-400 font-bold">تاريخ التسجيل</span>
                                <span className="text-gray-700 font-bold">{registeredDate}</span>
                            </div>
                        )}
                        {completedDate && (
                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-400 font-bold">تاريخ الإتمام</span>
                                <span className="text-green-700 font-bold">{completedDate}</span>
                            </div>
                        )}
                        {studentGroup && (
                            <div className="flex items-center justify-between py-2">
                                <span className="text-gray-400 font-bold">المجموعة</span>
                                <span className="text-gray-700 font-bold">{studentGroup.name}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
