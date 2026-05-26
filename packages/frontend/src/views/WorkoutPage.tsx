// ═══════════════════════════════════════════════════════════
// GYMIFY AI — Workout Page
// Active session: sets logging, rest timer, offline queue
// ═══════════════════════════════════════════════════════════
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Stepper, RPESelector, Badge, Card, Spinner } from '../components/ui/primitives';
import { TopBar, Page } from '../components/layout/Layout';
import { useSession, useAppendSet, useCompleteSession } from '../api/hooks/useSession';
import { enqueueSet, getPendingCount } from '../lib/offlineQueue';
import type { AppendSet } from '@gymify/shared';

// ── Rest Timer hook ───────────────────────────────────────
function useRestTimer() {
  const [remaining, setRemaining] = useState<number | null>(null);

  const start = useCallback((s: number) => setRemaining(s), []);
  const skip = useCallback(() => setRemaining(null), []);

  useEffect(() => {
    if (remaining === null) return;
    if (remaining === 0) {
      navigator.vibrate?.([200, 100, 200]);
      setRemaining(null);
      return;
    }
    const t = setTimeout(() => setRemaining((r) => (r !== null ? r - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  return { remaining, start, skip };
}

// ── Set state ─────────────────────────────────────────────
interface SetEntry {
  weight: number;
  reps: number;
  rpe: number | undefined;
  done: boolean;
}

// ── WorkoutPage ───────────────────────────────────────────
export default function WorkoutPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: session, isLoading } = useSession(sessionId);
  const appendSet = useAppendSet(sessionId ?? '');
  const completeSession = useCompleteSession(sessionId ?? '');

  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [sets, setSets] = useState<SetEntry[][]>([]);
  const [activeSetIdx, setActiveSetIdx] = useState(0);
  const [showFinishSheet, setShowFinishSheet] = useState(false);
  const [overallRpe, setOverallRpe] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  const { remaining, start: startTimer, skip: skipTimer } = useRestTimer();

  // Build set state from session data
  const exercises = session?.exercises ?? [];
  const currentExercise = exercises[exerciseIdx] ?? null;

  // Initialize sets for exercises
  useEffect(() => {
    if (exercises.length === 0) return;
    const defaultSets = exercises.map((ex: any) => {
      const count = ex.sets ?? ex.plannedSets ?? 3;
      const defaultWeight = ex.startingWeightKg ?? 40;
      const defaultReps = ex.plannedReps ?? 8;
      return Array.from({ length: count }, () => ({
        weight: defaultWeight,
        reps: defaultReps,
        rpe: undefined,
        done: false,
      }));
    });
    setSets(defaultSets);
  }, [exercises.length]);

  // Poll pending offline count
  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (!active) return;
      const count = await getPendingCount();
      setPendingCount(count);
      setTimeout(poll, 5000);
    };
    poll();
    return () => { active = false; };
  }, []);

  const currentSets = sets[exerciseIdx] ?? [];
  const totalExercises = exercises.length;

  const updateSet = (setIdx: number, updates: Partial<SetEntry>) => {
    setSets((prev) => {
      const next = prev.map((s, i) => i === exerciseIdx ? [...s] : s);
      next[exerciseIdx][setIdx] = { ...next[exerciseIdx][setIdx], ...updates };
      return next;
    });
  };

  const handleCheckmark = async (setIdx: number) => {
    const entry = currentSets[setIdx];
    if (!entry || entry.done) return;

    const payload: AppendSet = {
      clientSetId: crypto.randomUUID(),
      exerciseId: currentExercise?.exerciseId ?? currentExercise?.id ?? 'unknown',
      setIndex: setIdx + 1,
      setType: 'WORKING',
      reps: entry.reps,
      weightKg: entry.weight,
      rpe: entry.rpe,
      restSeconds: currentExercise?.restSeconds ?? 120,
    };

    try {
      await appendSet.mutateAsync(payload);
    } catch {
      // Offline fallback
      await enqueueSet(sessionId ?? '', payload);
      const count = await getPendingCount();
      setPendingCount(count);
    }

    updateSet(setIdx, { done: true });

    // Start rest timer
    const restDuration = currentExercise?.restSeconds ?? 120;
    startTimer(restDuration);

    // Auto-advance active set
    const nextIdx = setIdx + 1;
    if (nextIdx < currentSets.length) {
      setActiveSetIdx(nextIdx);
    } else if (exerciseIdx + 1 < totalExercises) {
      // Move to next exercise
      setExerciseIdx((i) => i + 1);
      setActiveSetIdx(0);
    }
  };

  const handleRepeatLast = () => {
    if (activeSetIdx === 0 || !currentSets[activeSetIdx - 1]) return;
    const last = currentSets[activeSetIdx - 1];
    updateSet(activeSetIdx, { weight: last.weight, reps: last.reps });
  };

  const handleDropSet = () => {
    setSets((prev) => {
      const next = prev.map((s, i) => i === exerciseIdx ? [...s] : s);
      const lastDone = next[exerciseIdx].filter((s) => s.done).slice(-1)[0];
      next[exerciseIdx].push({
        weight: lastDone ? Math.round(lastDone.weight * 0.8) : currentSets[0]?.weight ?? 40,
        reps: currentSets[0]?.reps ?? 8,
        rpe: undefined,
        done: false,
      });
      return next;
    });
  };

  const handleFinish = async () => {
    if (!sessionId) return;
    await completeSession.mutateAsync({ overallRpe, notes: notes || undefined });
    navigate('/history');
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-zinc-950 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Mock data if no session loaded yet // TODO: remove mock
  const displayExercise = currentExercise ?? {
    name: 'Barbell Bench Press',
    muscleGroup: 'Chest',
    plannedSets: 3,
    plannedReps: 8,
    targetRpe: 8,
  };
  const displaySets = currentSets.length > 0 ? currentSets : [
    { weight: 80, reps: 8, rpe: undefined, done: false },
    { weight: 80, reps: 8, rpe: undefined, done: false },
    { weight: 80, reps: 8, rpe: undefined, done: false },
  ];

  return (
    <div className="min-h-dvh bg-zinc-950 flex flex-col">
      {/* TopBar */}
      <TopBar
        leftAction={
          <button
            className="btn-icon btn-ghost"
            onClick={() => navigate(-1)}
            aria-label="Exit workout"
          >
            <XIcon />
          </button>
        }
        title={displayExercise.name ?? 'Workout'}
        subtitle={t('workout.exercise', {
          current: exerciseIdx + 1,
          total: totalExercises || 1,
        })}
        rightAction={
          <button className="btn-icon btn-ghost" aria-label="Options">
            <DotsIcon />
          </button>
        }
      />

      <div className="flex-1 px-4 py-4 space-y-4 pb-32">

        {/* Offline indicator */}
        {pendingCount > 0 && (
          <div className="toast" role="status">
            <Spinner size="sm" />
            <span>Synchronizacja w toku... ({pendingCount})</span>
          </div>
        )}

        {/* Rest Timer */}
        {remaining !== null && (
          <div className="w-rest card-orange rounded-3xl p-5 text-center" aria-live="polite" aria-atomic="true">
            <p className="text-label mb-2">{t('workout.rest')}</p>
            <div className="font-display font-black text-5xl text-orange-400 mb-3 tabular-nums">
              {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
            </div>
            <Button size="sm" variant="ghost" onClick={skipTimer}>
              {t('workout.skip')}
            </Button>
          </div>
        )}

        {/* Exercise header */}
        <Card className="w-ex p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="heading-2 text-zinc-100">{displayExercise.name}</h2>
              {displayExercise.muscleGroup && (
                <p className="text-xs text-zinc-500 mt-0.5">{displayExercise.muscleGroup}</p>
              )}
            </div>
            <Badge color="orange">
              {t('workout.plan', {
                sets: displayExercise.plannedSets ?? 3,
                reps: displayExercise.plannedReps ?? 8,
                rpe: displayExercise.targetRpe ?? 8,
              })}
            </Badge>
          </div>
        </Card>

        {/* Sets table */}
        <div className="w-set flex flex-col gap-2">
          {displaySets.map((entry, setIdx) => {
            const isDone = entry.done;
            const isActive = !isDone && setIdx === activeSetIdx;
            const isUpcoming = !isDone && setIdx > activeSetIdx;

            return (
              <div
                key={setIdx}
                className={`rounded-2xl border p-4 transition-all ${
                  isDone
                    ? 'border-zinc-700 bg-zinc-900/50 opacity-70'
                    : isActive
                      ? 'border-orange-500/50 bg-orange-500/5'
                      : 'border-zinc-800 bg-zinc-900/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xs text-zinc-600 uppercase tracking-wider font-semibold w-14">
                    Set {setIdx + 1}
                  </span>
                  {isDone && (
                    <Badge color="green">{t('workout.complete')}</Badge>
                  )}
                </div>

                {isDone ? (
                  // Done: static display
                  <div className="flex items-center gap-6 text-sm text-zinc-300">
                    <span>{entry.weight} kg</span>
                    <span>×</span>
                    <span>{entry.reps} reps</span>
                    {entry.rpe && <span className="text-orange-400">RPE {entry.rpe}</span>}
                  </div>
                ) : isActive ? (
                  // Active: steppers + RPE
                  <div className="space-y-4">
                    <div className="flex items-center justify-around gap-4">
                      <Stepper
                        value={entry.weight}
                        onChange={(v) => updateSet(setIdx, { weight: v })}
                        step={2.5}
                        min={0}
                        max={600}
                        unit="kg"
                        label="Weight"
                      />
                      <Stepper
                        value={entry.reps}
                        onChange={(v) => updateSet(setIdx, { reps: v })}
                        step={1}
                        min={0}
                        max={200}
                        label="Reps"
                      />
                    </div>
                    <RPESelector
                      value={entry.rpe}
                      onChange={(v) => updateSet(setIdx, { rpe: v })}
                    />
                    <button
                      onClick={() => handleCheckmark(setIdx)}
                      className="w-full h-14 rounded-2xl bg-orange-500 text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                      aria-label="Log set"
                    >
                      <CheckIcon />
                      Log Set
                    </button>
                  </div>
                ) : (
                  // Upcoming: placeholder
                  <div className="flex items-center gap-6 text-sm text-zinc-600">
                    <span>{entry.weight} kg</span>
                    <span>×</span>
                    <span>{entry.reps} reps</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={handleRepeatLast} className="flex-1">
            {t('workout.repeatLast')}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDropSet} className="flex-1">
            {t('workout.dropSet')}
          </Button>
        </div>

        {/* Exercise nav */}
        {totalExercises > 1 && (
          <div className="flex gap-2 justify-center">
            {Array.from({ length: totalExercises }).map((_, i) => (
              <button
                key={i}
                onClick={() => { setExerciseIdx(i); setActiveSetIdx(0); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === exerciseIdx ? 'bg-orange-500 w-4' : 'bg-zinc-700'
                }`}
                aria-label={`Go to exercise ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 inset-x-0 pb-safe px-4 py-4 bg-zinc-950/95 border-t border-zinc-800/60">
        <Button
          size="lg"
          variant="secondary"
          className="w-full"
          onClick={() => setShowFinishSheet(true)}
        >
          {t('workout.finish')}
        </Button>
      </div>

      {/* Finish sheet */}
      {showFinishSheet && (
        <div className="modal-overlay" onClick={() => setShowFinishSheet(false)}>
          <div className="modal-sheet p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="heading-2 text-zinc-100 mb-4">{t('workout.finish')}</h2>

            <div className="mb-4">
              <p className="text-sm text-zinc-400 mb-2">Overall session RPE</p>
              <RPESelector value={overallRpe} onChange={setOverallRpe} />
            </div>

            <div className="mb-6">
              <label className="label">Notes (optional)</label>
              <textarea
                className="input h-24 pt-3 resize-none"
                placeholder="How did it go?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              size="lg"
              variant="primary"
              className="w-full"
              loading={completeSession.isPending}
              onClick={handleFinish}
            >
              Complete Workout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────
function XIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.5"/>
      <circle cx="12" cy="12" r="1.5"/>
      <circle cx="12" cy="19" r="1.5"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
