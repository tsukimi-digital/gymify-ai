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

    let cancelled = false;
    let polls = 0;

    const interval = setInterval(async () => {
      try {
        const job = await apiFetch<{
          phase: string;
          progress: number;
          status: string;
          errorMessage?: string;
        }>(`/plans/jobs/${jobId}`);
        if (cancelled) return;
        if (job.phase) setPhase(job.phase as Phase);
        if (typeof job.progress === 'number') setProgress(job.progress);
        if (job.status === 'SUCCEEDED') { setDone(true); clearInterval(interval); }
        if (job.status === 'FAILED') { setError(job.errorMessage ?? 'Failed'); clearInterval(interval); }
        if (++polls > 120) clearInterval(interval); // max 4 min
      } catch {}
    }, 2000);

    return () => { cancelled = true; clearInterval(interval); };
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
