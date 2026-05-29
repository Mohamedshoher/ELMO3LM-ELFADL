import { useState, useEffect } from 'react';
import { BookOpen, ExternalLink, CheckCircle, Clock, Award, BarChart3 } from 'lucide-react';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useCourses } from '@/features/courses/hooks/useCourses';
import { updateStudent } from '../services/studentService';
import { getStudentExams } from '../services/recordsService';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export default function CoursesTab({ student }: { student: any }) {
    const queryClient = useQueryClient();
    const { data: groups } = useGroups();
    const { data: courses } = useCourses();
    const [loading, setLoading] = useState(false);
    const [exams, setExams] = useState<any[]>([]);

    useEffect(() => {
        if (student?.id) {
            getStudentExams(student.id).then(setExams).catch(() => {});
        }
    }, [student?.id]);

    const studentGroup = groups?.find((g: any) => g.id === student.groupId);
    const course = courses?.find((c: any) => c.id === studentGroup?.courseId);

    const courseExams = exams.filter((e: any) => e.courseId);
    const totalTested = courseExams.reduce((sum: number, e: any) => sum + (e.lecturesTested || 0), 0);
    const totalLectures = course?.lecturesCount || 0;
    const progress = totalLectures > 0 ? Math.min(Math.round((totalTested / totalLectures) * 100), 100) : 0;
    const isCompleted = !!student.courseCompletedAt;

    const registeredDate = student.courseRegisteredAt
        ? new Date(student.courseRegisteredAt).toLocaleDateString('ar-EG')
        : null;
    const completedDate = student.courseCompletedAt
        ? new Date(student.courseCompletedAt).toLocaleDateString('ar-EG')
        : null;

    const handleToggleComplete = async () => {
        setLoading(true);
        try {
            await updateStudent(student.id, {
                courseCompletedAt: isCompleted ? null : new Date().toISOString(),
            } as any);
            queryClient.invalidateQueries({ queryKey: ['students'] });
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            {course ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                                <BookOpen size={22} className="text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-gray-900">{course.name}</h3>
                                <p className="text-xs text-gray-500 font-bold">{course.lecturesCount} محاضرات</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className={cn(
                                "px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5",
                                isCompleted
                                    ? "bg-green-50 text-green-600 border border-green-100"
                                    : "bg-blue-50 text-blue-600 border border-blue-100"
                            )}>
                                {isCompleted ? <Award size={14} /> : <Clock size={14} />}
                                {isCompleted ? 'تمت' : 'مستمرة'}
                            </span>

                            {course.link && (
                                <a
                                    href={course.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1 rounded-xl text-xs font-bold bg-gray-50 text-gray-600 border border-gray-100 flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
                                >
                                    <ExternalLink size={14} />
                                    فتح الرابط
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
                                <span className="text-xs font-black text-gray-700">
                                    {totalTested} / {totalLectures} محاضرة
                                </span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-500",
                                        progress >= 100 ? "bg-green-500" : "bg-purple-500"
                                    )}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold mt-1">{progress}%</p>
                        </div>

                        {/* التقدير النهائي */}
                        {student.courseFinalGrade && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                                <span className="text-sm font-bold text-amber-700">التقدير العام</span>
                                <span className={cn(
                                    "text-sm font-black px-3 py-1 rounded-lg",
                                    student.courseFinalGrade === 'ممتاز' && "bg-green-100 text-green-700",
                                    student.courseFinalGrade === 'جيد جداً' && "bg-blue-100 text-blue-700",
                                    student.courseFinalGrade === 'جيد' && "bg-amber-100 text-amber-700"
                                )}>
                                    {student.courseFinalGrade}
                                </span>
                            </div>
                        )}

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
            ) : (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <BookOpen size={36} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-black text-gray-400 mb-1">غير مسجل في دورة</h3>
                    <p className="text-sm text-gray-400">الطالب غير مرتبط بأي دورة حالياً</p>
                    <p className="text-xs text-gray-300 mt-2">يمكن ربط دورة بالطالب من خلال تعديل المجموعة</p>
                </div>
            )}
        </div>
    );
}
