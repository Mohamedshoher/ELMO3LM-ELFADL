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

export const addCourse = async (course: { name: string; lecturesCount: number; link: string }): Promise<string> => {
    try {
        const { data, error } = await supabase
            .from('courses')
            .insert([{
                name: course.name,
                lectures_count: course.lecturesCount,
                link: course.link,
            }])
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    } catch (error) {
        console.error("Error adding course:", error);
        throw error;
    }
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
