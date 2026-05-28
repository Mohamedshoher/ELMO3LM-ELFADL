import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { Group } from '@/types';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const teacherId = searchParams.get('teacherId');

        const supabase = createServerSupabase();
        let query = supabase
            .from('groups')
            .select('id, name, teacher_id, schedule, max_students_per_hour')
            .order('name', { ascending: true });

        if (teacherId) {
            query = query.eq('teacher_id', teacherId);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const groups: Group[] = (data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            teacherId: row.teacher_id,
            schedule: row.schedule || '',
            maxStudentsPerHour: row.max_students_per_hour || 5,
            students: [],
        })) as unknown as Group[];

        return NextResponse.json(groups);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
