import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { apiFetch, QuotaExceededError } from '../client';

export function useGeneratePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ jobId: string }>('/plans/generate', { method: 'POST', body: '{}' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activePlan'] }),
  });
}

export type Phase =
  | 'ANALYZING_PROFILE'
  | 'DESIGNING_SCHEDULE'
  | 'SELECTING_EXERCISES'
  | 'VALIDATING'
  | 'DONE';

export function useGenerationProgress(jobId: string | null) {
  const [phase, setPhase] = useState<Phase>('ANALYZING_PROFILE');
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const es = new EventSource(`/api/plans/jobs/${jobId}/stream`, { withCredentials: true });

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.phase) setPhase(data.phase);
        if (typeof data.progress === 'number') setProgress(data.progress);
        if (data.status === 'DONE' || data.phase === 'DONE') {
          setDone(true);
          es.close();
        }
        if (data.status === 'FAILED') {
          setError(data.errorMessage ?? 'Generation failed');
          es.close();
        }
      } catch {}
    };

    es.onerror = () => {
      // Fallback to polling
      es.close();
      let polls = 0;
      const interval = setInterval(async () => {
        try {
          const job = await apiFetch<{
            phase: string;
            progress: number;
            status: string;
            errorMessage?: string;
          }>(`/plans/jobs/${jobId}`);
          if (job.phase) setPhase(job.phase as Phase);
          if (typeof job.progress === 'number') setProgress(job.progress);
          if (job.status === 'SUCCEEDED') { setDone(true); clearInterval(interval); }
          if (job.status === 'FAILED') { setError(job.errorMessage ?? 'Failed'); clearInterval(interval); }
          if (++polls > 60) clearInterval(interval);
        } catch {}
      }, 2000);
      return () => clearInterval(interval);
    };

    return () => es.close();
  }, [jobId]);

  return { phase, progress, done, error };
}

export function useActivePlan() {
  return useQuery({
    queryKey: ['activePlan'],
    queryFn: () => apiFetch<any>('/plans/active'),
    retry: false,
  });
}
