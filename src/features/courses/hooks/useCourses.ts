import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCourses, addCourse, updateCourse, deleteCourse } from '../services/courseService';
import { useAuthStore } from '@/store/useAuthStore';

export const useCourses = () => {
    const { user } = useAuthStore();
    const isAllowed = user?.role === 'director' || user?.role === 'supervisor' || user?.role === 'parent';

    return useQuery({
        queryKey: ['courses'],
        queryFn: () => isAllowed ? getCourses() : [],
        enabled: isAllowed
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
