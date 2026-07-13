import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET() {
    try {
        const supabase = createServerSupabase();
        const { data, error } = await supabase
            .from('student_notes')
            .select('id, student_id, content, type, created_at, created_by')
            .eq('type', 'join_request')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const studentIds = [...new Set((data || []).map(r => r.student_id))];
        const courseIds = [...new Set((data || []).map(r => {
            try { return JSON.parse(r.content || '{}').courseId; } catch { return null; }
        }).filter(Boolean))];

        const [studentsRes, coursesRes] = await Promise.all([
            studentIds.length > 0
                ? supabase.from('students').select('id, full_name, parent_phone, group_id').in('id', studentIds)
                : { data: [] },
            courseIds.length > 0
                ? supabase.from('courses').select('id, name, lectures_count').in('id', courseIds)
                : { data: [] },
        ]);

        const studentsMap = new Map((studentsRes.data || []).map(s => [s.id, s]));
        const coursesMap = new Map((coursesRes.data || []).map(c => [c.id, c]));

        const result = (data || []).map((row: any) => {
            let content: any = {};
            try { content = JSON.parse(row.content || '{}'); } catch { }
            const student = studentsMap.get(row.student_id);
            const course = coursesMap.get(content.courseId);
            return {
                id: row.id,
                studentId: row.student_id,
                studentName: student?.full_name || '',
                studentPhone: student?.parent_phone || '',
                studentGroupId: student?.group_id || null,
                courseId: content.courseId || '',
                courseName: course?.name || content.courseName || '',
                courseLectures: course?.lectures_count || 0,
                status: content.status || 'pending',
                createdAt: row.created_at,
            };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { studentId, courseId } = await request.json();
        if (!studentId || !courseId) {
            return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
        }

        const supabase = createServerSupabase();

        const { data: existing } = await supabase
            .from('student_notes')
            .select('id, content')
            .eq('student_id', studentId)
            .eq('type', 'join_request')
            .order('created_at', { ascending: false })
            .limit(1);

        if (existing && existing.length > 0) {
            const note = existing[0];
            let content: any = {};
            try { content = JSON.parse(note.content || '{}'); } catch { }
            if (content.status === 'pending') {
                return NextResponse.json({ error: 'يوجد طلب انضمام معلق لهذه الدورة بالفعل' }, { status: 409 });
            }
        }

        const { data: course } = await supabase
            .from('courses')
            .select('name')
            .eq('id', courseId)
            .single();

        const noteContent = JSON.stringify({ courseId, courseName: course?.name || '', status: 'pending' });

        const { data, error } = await supabase
            .from('student_notes')
            .insert([{
                student_id: studentId,
                content: noteContent,
                type: 'join_request',
                created_by: 'parent',
            }])
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, id: data.id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { id, status, groupId, approvedBy } = await request.json();
        if (!id || !status) {
            return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
        }

        const supabase = createServerSupabase();

        const { data: note, error: fetchError } = await supabase
            .from('student_notes')
            .select('student_id, content')
            .eq('id', id)
            .single();

        if (fetchError || !note) {
            return NextResponse.json({ error: 'طلب الانضمام غير موجود' }, { status: 404 });
        }

        let content: any = {};
        try { content = JSON.parse(note.content || '{}'); } catch { }
        content.status = status;

        const { error: updateError } = await supabase
            .from('student_notes')
            .update({ content: JSON.stringify(content) })
            .eq('id', id);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        if (status === 'approved') {
            const studentUpdates: any = {
                course_registered_at: new Date().toISOString(),
            };

            if (groupId) {
                // إضافة الطالب إلى المجموعة في جدول student_groups
                const { data: existing } = await supabase
                    .from('student_groups')
                    .select('id')
                    .eq('student_id', note.student_id)
                    .eq('group_id', groupId)
                    .maybeSingle();

                if (!existing) {
                    await supabase.from('student_groups').insert({
                        student_id: note.student_id,
                        group_id: groupId,
                    });
                }
            }

            const { error: studentError } = await supabase
                .from('students')
                .update(studentUpdates)
                .eq('id', note.student_id);

            if (studentError) {
                return NextResponse.json({ error: studentError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
