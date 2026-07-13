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

        // 1. جلب المجموعات المرتبطة بالدورة
        const { data: courseGroups } = await supabase
            .from('groups')
            .select('id, name, teacher_id')
            .eq('course_id', courseId);

        if (!courseGroups || courseGroups.length === 0) {
            return NextResponse.json([]);
        }

        const groupIds = courseGroups.map(g => g.id);
        const groupMap = new Map(courseGroups.map(g => [g.id, g]));

        // 2. جلب الطلاب المرتبطين بهذه المجموعات عبر student_groups
        const { data: sgData } = await supabase
            .from('student_groups')
            .select('student_id, group_id')
            .in('group_id', groupIds);

        if (!sgData || sgData.length === 0) {
            return NextResponse.json([]);
        }

        const studentIds = [...new Set(sgData.map(sg => sg.student_id))];

        // 3. جلب بيانات الطلاب
        const { data: students, error } = await supabase
            .from('students')
            .select(`
                id, full_name, group_id, course_registered_at, course_completed_at, course_final_grade,
                exams!left(lectures_tested),
                student_listens!left(lectures_count)
            `)
            .in('id', studentIds)
            .not('status', 'eq', 'archived');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 4. بناء نتيجة لكل مجموعة يتبعها الطالب
        const result: any[] = [];
        (students || []).forEach((row: any) => {
            const sgEntries = sgData.filter(sg => sg.student_id === row.id);
            sgEntries.forEach(sg => {
                const group = groupMap.get(sg.group_id);
                if (!group) return;

                const totalTested = (row.exams || []).reduce((s: number, e: any) => s + (e.lectures_tested || 0), 0);
                const totalListened = (row.student_listens || []).reduce((s: number, l: any) => s + (l.lectures_count || 0), 0);
                result.push({
                    id: row.id,
                    fullName: row.full_name,
                    groupId: sg.group_id,
                    groupName: group.name || '',
                    teacherName: '',
                    courseRegisteredAt: row.course_registered_at,
                    courseCompletedAt: row.course_completed_at,
                    courseFinalGrade: row.course_final_grade,
                    lecturesTested: totalTested,
                    totalListened,
                });
            });
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
