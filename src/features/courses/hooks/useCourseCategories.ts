import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, addCategory, deleteCategory } from '../services/categoryService';

export const useCourseCategories = () => {
  return useQuery({
    queryKey: ['course-categories'],
    queryFn: getCategories,
  });
};

export const useAddCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addCategory,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['course-categories'] }); }
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['course-categories'] }); }
  });
};
