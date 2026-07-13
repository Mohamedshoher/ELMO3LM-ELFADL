import { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, CalendarDays } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useAuthStore } from '../../../store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
const ScheduleSection = dynamic(() => import('./ScheduleTab'), { ssr: false });

export default function AttendanceTab({ student, records }: any) {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const canEditAttendance = user?.role === 'director' || user?.role === 'supervisor' || user?.role === 'teacher';
    const [currentDisplayDate, setCurrentDisplayDate] = useState(new Date());
    const [showSchedule, setShowSchedule] = useState(false);
    const [attendanceView, setAttendanceView] = useState<'record' | 'schedule'>('record');

    const currentYear = currentDisplayDate.getFullYear();
    const currentMonth = currentDisplayDate.getMonth();
    const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 1) % 7;
    const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

    const attendanceRecordsMap = useMemo(() => {
        const map: Record<number, string> = {};
        records.attendance.forEach((rec: any) => {
            if (rec.month === monthKey) map[rec.day] = rec.status;
        });
        return map;
    }, [records.attendance, monthKey]);

    return (
        <div className="space-y-4">
            {/* زرين بجانب بعض: سجل الحضور + مواعيد الحضور */}
            <div className="flex flex-row gap-2">
                <button
                    onClick={() => setAttendanceView('record')}
                    className={cn(
                        "flex-1 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-[11px] sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-[0.97]",
                        attendanceView === 'record'
                            ? "bg-gradient-to-l from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-200/40"
                            : "bg-white text-gray-600 border border-gray-100 hover:border-blue-200"
                    )}
                >
                    <CalendarDays size={15} />
                    <span className="hidden xs:inline">سجل الحضور</span>
                    <span className="xs:hidden">الحضور</span>
                </button>
                <button
                    onClick={() => setAttendanceView('schedule')}
                    className={cn(
                        "flex-1 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-[11px] sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-[0.97]",
                        attendanceView === 'schedule'
                            ? "bg-gradient-to-l from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200/40"
                            : "bg-white text-gray-600 border border-gray-100 hover:border-amber-200"
                    )}
                >
                    <Clock size={15} />
                    <span className="hidden xs:inline">مواعيد الحضور</span>
                    <span className="xs:hidden">المواعيد</span>
                </button>
            </div>

            {/* محتوى سجل الحضور */}
            {attendanceView === 'record' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4 bg-gray-50 p-2.5 sm:p-3 rounded-2xl">
                        <button onClick={() => setCurrentDisplayDate(new Date(currentYear, currentMonth + 1, 1))} className="text-gray-400 p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                        </button>
                        <h3 className="font-bold text-gray-900 text-sm sm:text-lg">{monthNames[currentMonth]} {currentYear}</h3>
                        <button onClick={() => setCurrentDisplayDate(new Date(currentYear, currentMonth - 1, 1))} className="text-gray-400 p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center">
                        {weekDays.map(day => <span key={day} className="text-[9px] sm:text-[10px] text-gray-400 font-bold">{day}</span>)}
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                        {Array.from({ length: startDayIndex }).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dateObj = new Date(currentYear, currentMonth, day);
                            const status = attendanceRecordsMap[day];
                            const isFuture = dateObj > new Date();

                            return (
                                <div key={day} 
                                    onClick={() => {
                                        if (!isFuture && canEditAttendance) {
                                            records.addAttendance.mutate({
                                                studentId: student.id,
                                                day: day,
                                                month: monthKey,
                                                status: status === 'present' ? 'absent' : 'present'
                                            });
                                        }
                                    }}
                                    className={cn(
                                    "aspect-square rounded-xl flex flex-col items-center justify-center border transition-all text-[11px] sm:text-sm font-bold shadow-sm",
                                    isFuture ? "bg-gray-50/50 text-gray-200 pointer-events-none" :
                                    status === 'present' ? "bg-green-50 border-green-100 text-green-600" : "bg-red-50 border-red-100 text-red-600",
                                    !isFuture && canEditAttendance && "cursor-pointer hover:border-blue-300"
                                )}>
                                    <span>{day}</span>
                                    {!isFuture && (status === 'present' ? <CheckCircle2 size={11} /> : <XCircle size={11} />)}
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="bg-blue-50/50 p-3 sm:p-4 rounded-2xl flex justify-around mt-4 sm:mt-6 border border-blue-100">
                        <div className="text-center">
                            <p className="text-[10px] sm:text-xs text-blue-400 font-black mb-1">حضور</p>
                            <p className="text-lg sm:text-2xl font-black text-blue-600">{Object.values(attendanceRecordsMap).filter(s => s === 'present').length}</p>
                        </div>
                        <div className="text-center border-x-2 border-dashed border-blue-200 px-4 sm:px-8">
                            <p className="text-[10px] sm:text-xs text-blue-400 font-black mb-1">غياب</p>
                            <p className="text-lg sm:text-2xl font-black text-red-500">{Object.values(attendanceRecordsMap).filter(s => s === 'absent').length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] sm:text-xs text-blue-400 font-black mb-1">نسبة</p>
                            <p className="text-lg sm:text-2xl font-black text-blue-600">
                                {Math.round((Object.values(attendanceRecordsMap).filter(s => s === 'present').length / (Object.keys(attendanceRecordsMap).length || 1)) * 100)}%
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* محتوى مواعيد الحضور */}
            {attendanceView === 'schedule' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-5">
                        <ScheduleSection student={student} />
                    </div>
                </div>
            )}
        </div>
    );
}
