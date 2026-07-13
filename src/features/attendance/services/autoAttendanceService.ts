import { supabase } from '@/lib/supabase';

export const markStudentPresentToday = async (studentId: string): Promise<void> => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', studentId)
        .eq('date', dateStr)
        .maybeSingle();

    if (existing) return;

    await supabase.from('attendance').insert([{
        student_id: studentId,
        date: dateStr,
        month_key: `${year}-${month}`,
        status: 'present',
        is_automatic: true,
    }]);
};
