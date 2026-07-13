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
    const { exams } = records || {};

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

    const studentGroupIds: string[] = freshStudent.groupIds?.length
        ? freshStudent.groupIds
        : (freshStudent.groupId ? [freshStudent.groupId] : []);

    const studentCourses = studentGroupIds
        .map(gid => groups?.find((g: any) => g.id === gid))
        .filter(Boolean)
        .map((g: any) => ({
            group: g,
            course: courses?.find((c: any) => c.id === g?.courseId),
        }))
        .filter((item: any) => item.course);

    if (studentCourses.length === 0) {
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
            {studentCourses.map(({ group, course }: any) => {
                const partialExams = (exams || []).filter((e: any) => e.courseId === course?.id && e.type !== 'إكمال دورة');
                const completionExam = (exams || []).find((e: any) => e.courseId === course?.id && e.type === 'إكمال دورة');
                const totalTested = partialExams.reduce((sum: number, e: any) => sum + (e.lecturesTested || 0), 0);
                const totalCompleted = totalTested;
                const totalLectures = course?.lecturesCount || 0;
                const progress = totalLectures > 0 ? Math.min(Math.round((totalCompleted / totalLectures) * 100), 100) : 0;
                const isCompleted = progress >= 100 || !!freshStudent.courseCompletedAt;

                const registeredDate = freshStudent.courseRegisteredAt
                    ? new Date(freshStudent.courseRegisteredAt).toLocaleDateString('ar-EG')
                    : null;
                const completedDate = freshStudent.courseCompletedAt
                    ? new Date(freshStudent.courseCompletedAt).toLocaleDateString('ar-EG')
                    : null;

                return (
                    <div key={course.id} className={cn(
                        "rounded-2xl border shadow-sm overflow-hidden transition-all",
                        isCompleted
                            ? "bg-gradient-to-l from-green-50 to-emerald-50 border-green-200"
                            : "bg-white border-gray-100"
                    )}>
                        <div className="p-4 sm:p-5">
                            <div className="flex items-center gap-2 sm:gap-3 mb-4">
                                <div className={cn(
                                    "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0",
                                    isCompleted ? "bg-green-100" : "bg-purple-50"
                                )}>
                                    <BookOpen size={18} className={isCompleted ? "text-green-600" : "text-purple-600"} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm sm:text-base font-black text-gray-900 truncate">{course.name}</h3>
                                    <p className="text-[10px] sm:text-xs text-gray-500 font-bold">{course.lecturesCount} محاضرات</p>
                                </div>
                                <span className={cn(
                                    "px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold flex items-center gap-1 shrink-0",
                                    isCompleted
                                        ? "bg-green-100 text-green-700 border border-green-200"
                                        : "bg-blue-50 text-blue-600 border border-blue-100"
                                )}>
                                    {isCompleted ? <Award size={12} /> : <BookOpen size={12} />}
                                    {isCompleted ? 'مكتملة' : 'مستمرة'}
                                </span>
                            </div>

                            <div className="flex flex-row gap-2 mb-4">
                                {course.link && (
                                    <a href={course.link} target="_blank" rel="noopener noreferrer"
                                        className="flex-1 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-[11px] sm:text-sm font-bold bg-gradient-to-l from-blue-600 to-blue-500 text-white flex items-center justify-center gap-1.5 sm:gap-2 hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-200/40 active:scale-[0.97]">
                                        <ExternalLink size={15} />
                                        <span className="hidden xs:inline">رابط الدورة</span>
                                        <span className="xs:hidden">الدورة</span>
                                    </a>
                                )}
                                {course.bookLink && (
                                    <a href={course.bookLink} target="_blank" rel="noopener noreferrer"
                                        className="flex-1 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-[11px] sm:text-sm font-bold bg-gradient-to-l from-amber-500 to-orange-500 text-white flex items-center justify-center gap-1.5 sm:gap-2 hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200/40 active:scale-[0.97]">
                                        <Book size={15} />
                                        <span className="hidden xs:inline">رابط الكتاب</span>
                                        <span className="xs:hidden">الكتاب</span>
                                    </a>
                                )}
                            </div>

                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] sm:text-xs font-bold text-gray-500 flex items-center gap-1.5">
                                        <BarChart3 size={12} />
                                        التقدم
                                    </span>
                                    <span className={cn(
                                        "text-[10px] sm:text-xs font-black",
                                        isCompleted ? "text-green-700" : "text-gray-700"
                                    )}>
                                        {totalCompleted} / {totalLectures} محاضرة
                                    </span>
                                </div>
                                <div className="w-full h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={cn(
                                        "h-full rounded-full transition-all duration-500",
                                        progress >= 100 ? "bg-green-500" : "bg-purple-500"
                                    )} style={{ width: `${progress}%` }} />
                                </div>
                                <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold mt-1">{progress}%</p>
                            </div>

                            {isCompleted && freshStudent.courseFinalGrade && (
                                <div className="bg-white/80 border border-green-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 mb-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs sm:text-sm font-bold text-green-700">التقدير العام</span>
                                        <span className={cn(
                                            "text-xs sm:text-sm font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg",
                                            freshStudent.courseFinalGrade === 'ممتاز' && "bg-green-100 text-green-700",
                                            freshStudent.courseFinalGrade === 'جيد جداً' && "bg-blue-100 text-blue-700",
                                            freshStudent.courseFinalGrade === 'جيد' && "bg-amber-100 text-amber-700"
                                        )}>
                                            {freshStudent.courseFinalGrade}
                                        </span>
                                    </div>
                                    {completionExam?.recordedBy && (
                                        <div className="flex items-center gap-1.5 mt-2 text-[9px] sm:text-[10px] text-green-600 font-bold">
                                            <User size={11} />
                                            الممتحن: {completionExam.recordedBy}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                {registeredDate && (
                                    <div className="flex items-center justify-between py-1.5 sm:py-2 border-b border-gray-50">
                                        <span className="text-gray-400 font-bold">تاريخ التسجيل</span>
                                        <span className="text-gray-700 font-bold">{registeredDate}</span>
                                    </div>
                                )}
                                {completedDate && (
                                    <div className="flex items-center justify-between py-1.5 sm:py-2 border-b border-gray-50">
                                        <span className="text-gray-400 font-bold">تاريخ الإتمام</span>
                                        <span className="text-green-700 font-bold">{completedDate}</span>
                                    </div>
                                )}
                                {group && (
                                    <div className="flex items-center justify-between py-1.5 sm:py-2">
                                        <span className="text-gray-400 font-bold">المجموعة</span>
                                        <span className="text-gray-700 font-bold">{group.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
