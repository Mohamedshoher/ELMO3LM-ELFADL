import { supabase } from "@/lib/supabase";
import { CourseCategory } from "@/types";

export const getCategories = async (): Promise<CourseCategory[]> => {
  const { data, error } = await supabase
    .from('course_categories')
    .select('id, name, created_at')
    .order('name', { ascending: true });

  if (error) {
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  }));
};

export const addCategory = async (name: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('course_categories')
    .insert([{ name }])
    .select('id')
    .single();

  if (error) {
    return null;
  }
  return data.id;
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('course_categories')
    .delete()
    .eq('id', id);

  if (error) {
    return false;
  }
  return true;
};
