import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useStudents } from '@/features/students/hooks/useStudents';
import { markStudentPresentToday } from '../services/autoAttendanceService';

export function useAutoAttendance() {
    const { user } = useAuthStore();
    const { data: students } = useStudents();
    const doneRef = useRef(false);

    useEffect(() => {
        if (doneRef.current || user?.role !== 'parent' || !students) return;
        doneRef.current = true;

        const phone = typeof window !== 'undefined'
            ? localStorage.getItem('almoalem_student_phone') || ''
            : '';
        const studentName = user?.displayName || '';
        const myKids = students.filter(
            s => s.studentPhone === phone || s.fullName === studentName
        );

        myKids.forEach(kid => {
            markStudentPresentToday(kid.id).catch(err =>
                console.error('فشل تسجيل الحضور التلقائي للطالب', kid.id, err)
            );
        });
    }, [user, students]);
}
