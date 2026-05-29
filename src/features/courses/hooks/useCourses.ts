import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCourses, addCourse, updateCourse, deleteCourse } from '../services/courseService';

export const useCourses = () => {
    return useQuery({
        queryKey: ['courses'],
        queryFn: () => getCourses()
    });
};

export const useAddCourse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addCourse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
        }
    });
};

export const useUpdateCourse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateCourse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
        }
    });
};

export const useDeleteCourse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteCourse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
        }
    });
};
