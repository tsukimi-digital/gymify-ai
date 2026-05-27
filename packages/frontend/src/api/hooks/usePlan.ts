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

    const poll = async () => {
      try {
        const res = await apiFetch<{
          job: {
            phase: string;
            progress: number;
            status: string;
            errorMessage?: string;
          };
        }>(`/plans/jobs/${jobId}`);
        if (cancelled) return false;
        const job = res.job;
        if (job.phase) setPhase(job.phase as Phase);
        if (typeof job.progress === 'number') setProgress(job.progress);
        if (job.status === 'SUCCEEDED') {
          // Animate through phases before marking done
          setPhase('DONE');
          setProgress(100);
          setTimeout(() => { if (!cancelled) setDone(true); }, 800);
          return true; // stop polling
        }
        if (job.status === 'FAILED') {
          setError(job.errorMessage ?? 'Failed');
          return true; // stop polling
        }
      } catch {}
      return false;
    };

    // First poll immediately, then every 2s
    poll().then(stop => {
      if (stop) return;
      const interval = setInterval(async () => {
        if (++polls > 120) { clearInterval(interval); return; }
        const stop = await poll();
        if (stop) clearInterval(interval);
      }, 2000);
      // cleanup
      const origCancel = () => { cancelled = true; clearInterval(interval); };
      return origCancel;
    });

    return () => { cancelled = true; };
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
