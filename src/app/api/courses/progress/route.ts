import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');
        if (!courseId) {
            return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
        }

        const supabase = createServerSupabase();
        const { data, error } = await supabase
            .from('students')
            .select(`
                id, full_name, group_id, course_registered_at, course_completed_at, course_final_grade,
                groups!inner(name, teacher_id, teachers!left(full_name)),
                exams!left(lectures_tested)
            `)
            .eq('groups.course_id', courseId)
            .not('status', 'eq', 'archived');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const result = (data || []).map((row: any) => {
            const totalTested = (row.exams || []).reduce((s: number, e: any) => s + (e.lectures_tested || 0), 0);
            return {
                id: row.id,
                fullName: row.full_name,
                groupId: row.group_id,
                groupName: row.groups?.name || '',
                teacherName: row.groups?.teachers?.full_name || '',
                courseRegisteredAt: row.course_registered_at,
                courseCompletedAt: row.course_completed_at,
                courseFinalGrade: row.course_final_grade,
                lecturesTested: totalTested,
            };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
