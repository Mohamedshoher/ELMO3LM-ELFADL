import { Course } from "@/types";
import { supabase } from "@/lib/supabase";

export const getCourses = async (): Promise<Course[]> => {
    try {
        const res = await fetch('/api/courses');
        if (!res.ok) {
            console.error("API error fetching courses:", await res.text());
            return [];
        }
        return await res.json();
    } catch (error) {
        console.error("Unexpected error fetching courses:", error);
        return [];
    }
};

export const updateCourse = async (course: { id: string; name?: string; lecturesCount?: number; link?: string; bookLink?: string; categoryId?: string; imageUrl?: string | null }): Promise<void> => {
    try {
        const res = await fetch('/api/courses', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(course),
        });
        if (!res.ok) {
            const errText = await res.text();
            console.error("API error updating course:", errText);
            throw new Error(errText || 'Failed to update course');
        }
    } catch (error) {
        console.error("Error updating course:", error);
        throw error;
    }
};

export const addCourse = async (course: { name: string; lecturesCount: number; link: string; bookLink?: string; categoryId?: string; imageUrl?: string | null }): Promise<string> => {
    const insertData: Record<string, any> = {
        name: course.name,
        lectures_count: course.lecturesCount,
        link: course.link,
    };
    if (course.bookLink) insertData.book_link = course.bookLink;
    if (course.categoryId) insertData.category_id = course.categoryId;
    if (course.imageUrl) insertData.image_url = course.imageUrl;

    const { data, error } = await supabase
        .from('courses')
        .insert([insertData])
        .select('id')
        .single();

    if (error) throw error;
    return data.id;
};



export const deleteCourse = async (id: string): Promise<void> => {
    try {
        const res = await fetch(`/api/courses?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete course');
    } catch (error) {
        console.error("Error deleting course:", error);
        throw error;
    }
};
