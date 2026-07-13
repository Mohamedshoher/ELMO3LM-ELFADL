import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { Course } from '@/types';

export async function GET() {
    try {
        const supabase = createServerSupabase();
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const courses: Course[] = (data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            lecturesCount: row.lectures_count,
            link: row.link,
            bookLink: row.book_link,
            categoryId: row.category_id,
            imageUrl: row.image_url,
            createdAt: row.created_at,
        }));

        return NextResponse.json(courses);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const supabase = createServerSupabase();

        const { data, error } = await supabase
            .from('courses')
            .insert([{
                name: body.name,
                lectures_count: body.lecturesCount,
                link: body.link,
                book_link: body.bookLink || null,
                category_id: body.categoryId || null,
                image_url: body.imageUrl || null,
            }])
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;
        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        const supabase = createServerSupabase();
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.lecturesCount !== undefined) dbUpdates.lectures_count = updates.lecturesCount;
        if (updates.link !== undefined) dbUpdates.link = updates.link;
        if (updates.bookLink !== undefined) dbUpdates.book_link = updates.bookLink;
        if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
        if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;

        const { data, error } = await supabase
            .from('courses')
            .update(dbUpdates)
            .eq('id', id)
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json(data[0]);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        const supabase = createServerSupabase();
        const { error } = await supabase.from('courses').delete().eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
