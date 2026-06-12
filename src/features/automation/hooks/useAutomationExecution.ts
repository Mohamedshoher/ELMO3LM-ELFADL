import { useState, useCallback } from 'react';
import { automationService } from '@/features/automation/services/automationService';

export const useAutomationExecution = () => {
    const [isExecuting, setIsExecuting] = useState(false);
    const [isExecutingExams, setIsExecutingExams] = useState(false);
    const [isCheckingAttendance, setIsCheckingAttendance] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<any[]>([]);

    // أتمتة التقارير اليومية
    const executeMissingReportDeduction = useCallback(async () => {
        setIsExecuting(true);
        setError(null);
        try {
            const createdLogs = await automationService.checkMissingDailyReports();
            setLogs(createdLogs);
            return createdLogs;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف';
            setError(errorMessage);
            console.error('خطأ في تنفيذ قاعدة الخصم:', errorMessage);
            return [];
        } finally {
            setIsExecuting(false);
        }
    }, []);

    // أتمتة الاختبارات اليومية
    const executeMissingExamDeduction = useCallback(async () => {
        setIsExecutingExams(true);
        setError(null);
        try {
            const createdLogs = await automationService.checkMissingDailyExams();
            setLogs(createdLogs);
            return createdLogs;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف';
            setError(errorMessage);
            console.error('خطأ في تنفيذ قاعدة خصم الاختبارات:', errorMessage);
            return [];
        } finally {
            setIsExecutingExams(false);
        }
    }, []);

    // فحص غياب الطلاب
    const executeStudentAttendanceCheck = useCallback(async (date?: string) => {
        setIsCheckingAttendance(true);
        setError(null);
        try {
            const res = await fetch('/api/automation/check-student-attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date }),
            });
            if (!res.ok) throw new Error('فشل فحص غياب الطلاب');
            const data = await res.json();
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف';
            setError(errorMessage);
            console.error('خطأ في فحص غياب الطلاب:', errorMessage);
            return null;
        } finally {
            setIsCheckingAttendance(false);
        }
    }, []);

    return {
        isExecuting,
        isExecutingExams,
        isCheckingAttendance,
        error,
        logs,
        executeMissingReportDeduction,
        executeMissingExamDeduction,
        executeStudentAttendanceCheck,
    };
};
