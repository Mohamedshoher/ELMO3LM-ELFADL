export const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const ENGLISH_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function getTodayArabicDay(): string {
    const dayIndex = new Date().getDay();
    return ARABIC_DAYS[dayIndex];
}

export function getArabicDayFromDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return ARABIC_DAYS[d.getDay()];
}

export function getStudentAppointmentDays(appointment?: string | null): string[] {
    if (!appointment) return [];
    return appointment.split(',').map(p => p.trim().split(':')[0].trim()).filter(Boolean);
}

export function isDayInStudentAppointment(dayName: string, appointment?: string | null): boolean {
    const days = getStudentAppointmentDays(appointment);
    return days.includes(dayName);
}

export function isTodayInStudentAppointment(appointment?: string | null): boolean {
    const today = getTodayArabicDay();
    return isDayInStudentAppointment(today, appointment);
}

export function getTodayAppointmentTime(appointment?: string | null): string | null {
    if (!appointment) return null;
    const today = getTodayArabicDay();
    for (const part of appointment.split(',')) {
        const [day, ...rest] = part.trim().split(':');
        if (day.trim() === today) {
            return rest.join(':').trim();
        }
    }
    return null;
}
