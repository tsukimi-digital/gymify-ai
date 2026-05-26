import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client';

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => apiFetch<any>('/stats/progress'),
    retry: false,
  });
}
