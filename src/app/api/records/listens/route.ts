import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');
        const courseId = searchParams.get('courseId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const supabase = createServerSupabase();
        let query = supabase.from('student_listens').select('*');
        if (studentId) query = query.eq('student_id', studentId);
        if (courseId) query = query.eq('course_id', courseId);
        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);

        const { data, error } = await query.order('date', { ascending: false });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data || []);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const supabase = createServerSupabase();

        if (body.course_id) {
            const { data: course, error: courseError } = await supabase
                .from('courses')
                .select('lectures_count')
                .eq('id', body.course_id)
                .single();

            if (courseError) return NextResponse.json({ error: courseError.message }, { status: 500 });

            const { data: existingListens, error: listensError } = await supabase
                .from('student_listens')
                .select('lectures_count')
                .eq('student_id', body.student_id)
                .eq('course_id', body.course_id);

            if (listensError) return NextResponse.json({ error: listensError.message }, { status: 500 });

            const totalListened = (existingListens || []).reduce((sum: number, l: any) => sum + (l.lectures_count || 0), 0);
            const remaining = (course?.lectures_count || 0) - totalListened;

            if ((body.lectures_count || 0) > remaining) {
                return NextResponse.json(
                    { error: `لا يمكن تجاوز عدد محاضرات الدورة. المتبقي: ${remaining} محاضرات` },
                    { status: 400 }
                );
            }
        }

        const { data, error } = await supabase.from('student_listens').insert([body]).select().single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

        const supabase = createServerSupabase();
        const { error } = await supabase.from('student_listens').delete().eq('id', id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
