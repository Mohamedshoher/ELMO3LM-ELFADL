import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { Student } from '@/types';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const groupIdsFilter = searchParams.get('groupIds');
        const status = searchParams.get('status');

        const supabase = createServerSupabase();

        // جلب جميع الطلاب أولاً
        let query = supabase
            .from('students')
            .select('id, full_name, group_id, parent_phone, status, monthly_amount, birth_date, address, appointment, notes, enrollment_date, archived_date, created_at, course_registered_at, course_completed_at, course_final_grade');

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // جلب كل علاقات student_groups
        const studentIds = (data || []).map(r => r.id);
        let groupsMap: Record<string, string[]> = {};
        if (studentIds.length > 0) {
            const { data: sgs } = await supabase
                .from('student_groups')
                .select('student_id, group_id')
                .in('student_id', studentIds);
            (sgs || []).forEach(sg => {
                if (!groupsMap[sg.student_id]) groupsMap[sg.student_id] = [];
                groupsMap[sg.student_id].push(sg.group_id);
            });
        }

        let students: Student[] = (data || []).map((row: any) => {
            const sgIds = groupsMap[row.id] || [];
            return {
                id: row.id,
                fullName: row.full_name,
                groupId: row.group_id,
                groupIds: sgIds.length > 0 ? sgIds : (row.group_id ? [row.group_id] : []),
                parentPhone: row.parent_phone,
                status: row.status,
                isArchived: row.status === 'archived',
                monthlyAmount: Number(row.monthly_amount) || 0,
                birthDate: row.birth_date,
                address: row.address,
                appointment: row.appointment,
                notes: row.notes,
                enrollmentDate: row.enrollment_date || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
                archivedDate: row.archived_date,
                courseRegisteredAt: row.course_registered_at,
                courseCompletedAt: row.course_completed_at,
                courseFinalGrade: row.course_final_grade,
                whatsapp: row.parent_phone,
                email: '',
                password: '',
                role: 'student',
                attendance: [],
                exams: []
            } as Student;
        });

        // تطبيق فلتر المجموعات بعد جلب groupIds
        if (groupIdsFilter) {
            const ids = groupIdsFilter.split(',');
            students = students.filter(s => s.groupIds.some(gId => ids.includes(gId)));
        }

        return NextResponse.json(students);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
