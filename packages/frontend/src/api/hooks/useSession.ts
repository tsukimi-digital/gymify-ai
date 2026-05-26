import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../client';
import type { AppendSet, CompleteSession } from '@gymify/shared';

export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => apiFetch<any>(`/sessions/${sessionId}`),
    enabled: !!sessionId,
  });
}

export function useAppendSet(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AppendSet) =>
      apiFetch(`/sessions/${sessionId}/sets`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', sessionId] }),
  });
}

export function useCompleteSession(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CompleteSession) =>
      apiFetch(`/sessions/${sessionId}/complete`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session', sessionId] });
      qc.invalidateQueries({ queryKey: ['activePlan'] });
    },
  });
}
