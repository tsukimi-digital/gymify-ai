// ═══════════════════════════════════════════════════════════
// GYMIFY AI — Plan Generation Loading Screen
// SSE-driven progress with named phases
// ═══════════════════════════════════════════════════════════
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressBar } from '../components/ui/primitives';
import { GymifyLogo, AccentLine } from '../components/layout/Layout';

type Phase =
  | 'ANALYZING_PROFILE'
  | 'DESIGNING_SCHEDULE'
  | 'SELECTING_EXERCISES'
  | 'VALIDATING'
  | 'DONE';

interface PhaseInfo {
  label: string;
  desc: string;
  progress: number;
}

const PHASE_MAP: Record<Phase, PhaseInfo> = {
  ANALYZING_PROFILE:   { label: 'Analyzing your profile',     desc: 'Reading your goals, equipment, injuries and benchmarks…',      progress: 20  },
  DESIGNING_SCHEDULE:  { label: 'Designing your mesocycle',   desc: 'Building a 4-week progressive overload schedule…',             progress: 45  },
  SELECTING_EXERCISES: { label: 'Selecting exercises',         desc: 'Matching moves to your available equipment and restrictions…', progress: 70  },
  VALIDATING:          { label: 'Validating your plan',        desc: 'Checking progressions, RPE targets, and deload week…',         progress: 90  },
  DONE:                { label: 'Plan ready!',                 desc: 'Your personalised mesocycle is ready.',                        progress: 100 },
};

// Simulates SSE phases for demo — replace with real EventSource in production
function useGenerationProgress(jobId: string) {
  const [phase, setPhase] = useState<Phase>('ANALYZING_PROFILE');
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const phases: Phase[] = [
      'ANALYZING_PROFILE',
      'DESIGNING_SCHEDULE',
      'SELECTING_EXERCISES',
      'VALIDATING',
      'DONE',
    ];

    let i = 0;
    const tick = () => {
      if (i >= phases.length) return;
      const p = phases[i];
      setPhase(p);
      setProgress(PHASE_MAP[p].progress);
      if (p === 'DONE') { setDone(true); return; }
      i++;
      setTimeout(tick, 1800 + Math.random() * 800);
    };

    const timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);

    /* ── Production: replace with real SSE ──────────────────
    const es = new EventSource(`/api/plans/jobs/${jobId}/stream`, {
      withCredentials: true,
    });
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setPhase(data.phase);
      setProgress(data.progress);
      if (data.phase === 'DONE') { setDone(true); es.close(); }
    };
    es.onerror = () => {
      setError('Generation failed. Please try again.');
      es.close();
    };
    return () => es.close();
    ─────────────────────────────────────────────────────── */
  }, [jobId]);

  return { phase, progress, done, error };
}

export default function GeneratingPage() {
  const navigate = useNavigate();
  const jobId = 'demo-job';
  const { phase, progress, done, error } = useGenerationProgress(jobId);
  const info = PHASE_MAP[phase];

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => navigate('/dashboard'), 1200);
      return () => clearTimeout(t);
    }
  }, [done, navigate]);

  return (
    <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Background radial */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(242,100,25,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Logo */}
      <div className="mb-14">
        <GymifyLogo size="lg" />
      </div>

      {/* Animated orb */}
      <div className="relative mb-10 flex items-center justify-center">
        <div
          className="w-32 h-32 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, #F26419, #D94E08, #F26419)',
            animation: 'spin 3s linear infinite',
            opacity: done ? 0 : 1,
            transition: 'opacity 0.5s',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-2 rounded-full bg-zinc-950 flex items-center justify-center"
        >
          {done ? (
            <span className="text-4xl animate-fade-in">✓</span>
          ) : (
            <span className="font-display font-black text-2xl text-orange-400">
              {progress}%
            </span>
          )}
        </div>
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: '0 0 40px rgba(242,100,25,0.3)',
            animation: done ? 'none' : 'pulse 2s ease-in-out infinite',
          }}
          aria-hidden="true"
        />
      </div>

      {/* Phase label */}
      <div className="text-center mb-8 min-h-[5rem]" aria-live="polite" aria-atomic="true">
        <h2 className="heading-2 text-zinc-100 mb-2 transition-all duration-300">
          {info.label}
        </h2>
        <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed transition-all duration-300">
          {info.desc}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs mb-10">
        <ProgressBar value={progress} />
      </div>

      {/* Phase steps */}
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {(Object.entries(PHASE_MAP) as [Phase, PhaseInfo][])
          .filter(([p]) => p !== 'DONE')
          .map(([p, info]) => {
            const done_ = PHASE_MAP[phase].progress >= info.progress;
            const current = p === phase && phase !== 'DONE';
            return (
              <div key={p} className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border transition-all duration-300 ${
                    done_
                      ? 'bg-orange-500 border-orange-500'
                      : current
                        ? 'border-orange-500 bg-transparent animate-pulse'
                        : 'border-zinc-700 bg-transparent'
                  }`}
                >
                  {done_ && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="10 3 5 9 2 6"/>
                    </svg>
                  )}
                </div>
                <span className={`text-xs transition-all ${
                  current ? 'text-orange-400 font-semibold' : done_ ? 'text-zinc-400' : 'text-zinc-600'
                }`}>
                  {info.label}
                </span>
              </div>
            );
          })}
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-6 p-4 rounded-2xl bg-danger/10 border border-danger/30 text-sm text-red-400 text-center max-w-xs">
          {error}
          <button
            className="block w-full mt-3 text-xs underline"
            onClick={() => navigate('/onboarding')}
          >
            Go back and try again
          </button>
        </div>
      )}
    </div>
  );
}
