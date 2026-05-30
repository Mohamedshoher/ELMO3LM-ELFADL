import { useQuery } from "@tanstack/react-query";
import { getAllListens } from "../services/recordsService";

export const useAllListens = (monthKey?: string, periodHalf?: 1 | 2, studentIds?: string[]) => {
    return useQuery({
        queryKey: ['all-listens', monthKey, periodHalf, studentIds?.length],
        queryFn: () => getAllListens(monthKey, periodHalf, studentIds),
    });
};
