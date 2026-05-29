import { useState, useMemo } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useAuthStore } from '../../../store/useAuthStore';

const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

// استخراج أسماء أيام المواعيد من حقل appointment
const getScheduledDays = (appointment: string | undefined): string[] => {
    if (!appointment) return [];
    return appointment.split(',').map(p => p.split(':')[0].trim()).filter(Boolean);
};

export default function AttendanceTab({ student, records }: any) {
    const { user } = useAuthStore();
    const canEditAttendance = user?.role === 'director' || user?.role === 'supervisor' || user?.role === 'teacher';
    const [currentDisplayDate, setCurrentDisplayDate] = useState(new Date());

    const currentYear = currentDisplayDate.getFullYear();
    const currentMonth = currentDisplayDate.getMonth();
    const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 1) % 7;

    const scheduledDays = useMemo(() => getScheduledDays(student.appointment), [student.appointment]);

    const attendanceRecordsMap = useMemo(() => {
        const map: Record<number, string> = {};
        records.attendance.forEach((rec: any) => {
            if (rec.month === monthKey) map[rec.day] = rec.status;
        });
        return map;
    }, [records.attendance, monthKey]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-2xl">
                <button onClick={() => setCurrentDisplayDate(new Date(currentYear, currentMonth + 1, 1))} className="text-gray-400 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </button>
                <h3 className="font-bold text-gray-900 text-lg">سجل {monthNames[currentMonth]} {currentYear}</h3>
                <button onClick={() => setCurrentDisplayDate(new Date(currentYear, currentMonth - 1, 1))} className="text-gray-400 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                {weekDays.map(day => <span key={day} className="text-[10px] text-gray-400 font-bold">{day}</span>)}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: startDayIndex }).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateObj = new Date(currentYear, currentMonth, day);
                    const dayOfWeek = dateObj.getDay();
                    const dayName = weekDays[(dayOfWeek + 1) % 7];
                    const isScheduled = scheduledDays.includes(dayName);
                    const status = attendanceRecordsMap[day];
                    const isFuture = dateObj > new Date();

                    return (
                        <div key={day} 
                            onClick={() => {
                                if (!isFuture && isScheduled && canEditAttendance) {
                                    records.addAttendance.mutate({
                                        studentId: student.id,
                                        day: day,
                                        month: monthKey,
                                        status: status === 'present' ? 'absent' : 'present'
                                    });
                                }
                            }}
                            className={cn(
                            "aspect-square rounded-xl flex flex-col items-center justify-center border transition-all text-sm font-bold shadow-sm",
                            isFuture ? "bg-gray-50/50 text-gray-200 pointer-events-none" :
                            !isScheduled ? "bg-gray-50/30 border-gray-50 text-gray-300 cursor-default" :
                            status === 'absent' ? "bg-red-50 border-red-100 text-red-600" :
                            status === 'present' ? "bg-green-50 border-green-100 text-green-600" : "bg-amber-50/50 border-amber-100 text-amber-600",
                            !isFuture && isScheduled && canEditAttendance && "cursor-pointer hover:border-blue-300"
                        )}>
                            <span>{day}</span>
                            {!isFuture && (
                                isScheduled ? (
                                    status === 'absent' ? <XCircle size={14} /> :
                                    status === 'present' ? <CheckCircle2 size={14} /> :
                                    <span className="text-[8px] font-black mt-0.5">أجازة</span>
                                ) : (
                                    <span className="text-[8px] font-black mt-0.5 text-gray-300">--</span>
                                )
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ملخص الإحصائيات */}
            {(() => {
                const presentCount = Object.values(attendanceRecordsMap).filter(s => s === 'present').length;
                const absentCount = Object.values(attendanceRecordsMap).filter(s => s === 'absent').length;
                const totalWithAttendance = presentCount + absentCount;
                const scheduledCount = daysInMonth > 0 && scheduledDays.length > 0
                    ? Array.from({ length: daysInMonth }, (_, i) => i + 1)
                        .filter(d => scheduledDays.includes(weekDays[(new Date(currentYear, currentMonth, d).getDay() + 1) % 7]))
                        .length
                    : 0;
                return (
                    <div className="bg-blue-50/50 p-4 rounded-2xl flex justify-around mt-6 border border-blue-100">
                        <div className="text-center">
                            <p className="text-xs text-blue-400 font-black mb-1">حضور</p>
                            <p className="text-2xl font-black text-blue-600">{presentCount}</p>
                        </div>
                        <div className="text-center border-x-2 border-dashed border-blue-200 px-8">
                            <p className="text-xs text-blue-400 font-black mb-1">غياب</p>
                            <p className="text-2xl font-black text-red-500">{absentCount}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-blue-400 font-black mb-1">نسبة</p>
                            <p className="text-2xl font-black text-blue-600">
                                {totalWithAttendance > 0 ? Math.round((presentCount / totalWithAttendance) * 100) : 0}%
                            </p>
                        </div>
                        <div className="text-center border-r-2 border-dashed border-blue-200 pr-8">
                            <p className="text-xs text-amber-500 font-black mb-1">أجازة</p>
                            <p className="text-2xl font-black text-amber-500">{scheduledCount - totalWithAttendance}</p>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}