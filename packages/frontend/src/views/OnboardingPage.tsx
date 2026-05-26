// ═══════════════════════════════════════════════════════════
// GYMIFY AI — Onboarding Wizard (6 Steps)
// ═══════════════════════════════════════════════════════════
import React, { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input, ProgressBar } from '../components/ui/primitives';
import { TopBar, BackButton } from '../components/layout/Layout';
import { useGeneratePlan } from '../api/hooks/usePlan';
import { apiFetch, QuotaExceededError } from '../api/client';

const EmailModal = lazy(() => import('../components/modals/EmailModal'));
const PaymentModal = lazy(() => import('../components/modals/PaymentModal'));

// ── Types ─────────────────────────────────────────────────
type Goal = 'LOSE_WEIGHT' | 'BUILD_MUSCLE' | 'IMPROVE_ENDURANCE' | 'STAY_FIT';
type Sex  = 'MALE' | 'FEMALE' | 'OTHER';
type FitnessLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

interface WizardState {
  // Step 1
  goal?: Goal;
  // Step 2
  sex?: Sex;
  weightKg?: number;
  heightCm?: number;
  age?: number;
  unitPreference: 'METRIC' | 'IMPERIAL';
  // Step 3
  daysPerWeek?: number;
  sessionMinutes?: number;
  trainingYears?: number;
  fitnessLevel?: FitnessLevel;
  // Step 4
  equipment: string[];
  // Step 5
  parqAcknowledged: boolean;
  medicalDisclaimer: boolean;
  injuries: string[];
  // Step 6
  benchmarks: Record<string, number>;
}

const INITIAL: WizardState = {
  unitPreference: 'METRIC',
  equipment: [],
  parqAcknowledged: false,
  medicalDisclaimer: false,
  injuries: [],
  benchmarks: {},
};

// ── Main Component ────────────────────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardState>(INITIAL);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const generatePlan = useGeneratePlan();

  const TOTAL_STEPS = 6;
  const pct = Math.round((step / TOTAL_STEPS) * 100);

  const update = (partial: Partial<WizardState>) =>
    setData((prev) => ({ ...prev, ...partial }));

  const next = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      // Show email modal before generating
      setShowEmailModal(true);
    }
  };

  const back = () => {
    if (step > 1) setStep((s) => s - 1);
    else navigate('/');
  };

  const doGeneratePlan = async () => {
    try {
      const result = await generatePlan.mutateAsync();
      navigate(`/generating?jobId=${result.jobId}`);
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        setShowPaymentModal(true);
      }
    }
  };

  const handleEmailSuccess = async () => {
    setShowEmailModal(false);
    // Build profile payload from wizard data
    const profilePayload = {
      goal: data.goal ?? 'STAY_FIT',
      sex: data.sex ?? 'OTHER',
      weightKg: data.weightKg ?? 75,
      heightCm: data.heightCm ?? 175,
      age: data.age ?? 25,
      unitPreference: data.unitPreference,
      daysPerWeek: data.daysPerWeek ?? 3,
      sessionMinutes: data.sessionMinutes ?? 60,
      trainingYears: data.trainingYears ?? 0,
      fitnessSelfRating: data.fitnessLevel ?? 'BEGINNER',
      parqAcknowledged: data.parqAcknowledged,
      medicalDisclaimer: data.medicalDisclaimer,
      equipment: data.equipment.map((type) => ({ type })),
      injuries: data.injuries.map((bodyArea) => ({ bodyArea })),
      benchmarks: Object.entries(data.benchmarks)
        .filter(([, v]) => v > 0)
        .map(([exerciseSlug, estimated1RM]) => ({ exerciseSlug, estimated1RM })),
    };
    try {
      await apiFetch('/profile', { method: 'PUT', body: JSON.stringify(profilePayload) });
    } catch {
      // continue even if profile save fails — worker will use defaults
    }
    await doGeneratePlan();
  };

  const STEP_TITLES = [
    t('onboarding.step1.title'),
    t('onboarding.step2.title'),
    t('onboarding.step3.title'),
    t('onboarding.step4.title'),
    t('onboarding.step5.title'),
    t('onboarding.step6.title'),
  ];

  return (
    <div className="min-h-dvh bg-zinc-950 flex flex-col">
      {/* Top bar */}
      <TopBar
        leftAction={<BackButton onClick={back} />}
        rightAction={
          <span className="text-label text-2xs text-zinc-600">
            {step} / {TOTAL_STEPS}
          </span>
        }
      />

      {/* Progress */}
      <div className="px-4 pb-2">
        <ProgressBar value={pct} label={STEP_TITLES[step - 1]} />
      </div>

      {/* Step content */}
      <div className="flex-1 px-4 py-6 animate-fade-up" key={step}>
        {step === 1 && <StepGoal value={data.goal} onChange={(goal) => update({ goal })} />}
        {step === 2 && <StepBasics data={data} onChange={update} />}
        {step === 3 && <StepSchedule data={data} onChange={update} />}
        {step === 4 && <StepEquipment selected={data.equipment} onChange={(equipment) => update({ equipment })} />}
        {step === 5 && <StepHealth data={data} onChange={update} />}
        {step === 6 && <StepBenchmarks data={data} onChange={update} />}
      </div>

      {/* CTA */}
      <div className="px-4 py-4 pb-safe border-t border-zinc-800/60 bg-zinc-950/90">
        <Button
          size="lg"
          variant="primary"
          className="w-full font-black uppercase tracking-wider"
          onClick={next}
          disabled={step === 1 && !data.goal}
        >
          {step < TOTAL_STEPS ? t('onboarding.continue') : t('onboarding.generate')}
        </Button>
        {step === 6 && (
          <button
            className="w-full mt-3 text-xs text-zinc-600 underline underline-offset-2"
            onClick={next}
          >
            {t('onboarding.skip')}
          </button>
        )}
      </div>

      {/* Email modal */}
      {showEmailModal && (
        <Suspense fallback={null}>
          <EmailModal
            onSuccess={handleEmailSuccess}
            onClose={() => setShowEmailModal(false)}
          />
        </Suspense>
      )}

      {/* Payment modal — shown when quota is exceeded */}
      {showPaymentModal && (
        <Suspense fallback={null}>
          <PaymentModal
            onSuccess={() => {
              setShowPaymentModal(false);
              doGeneratePlan();
            }}
            onClose={() => setShowPaymentModal(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

// ── Step 1: Goal ──────────────────────────────────────────
const GOAL_EMOJIS: Record<Goal, string> = {
  LOSE_WEIGHT: '🔥',
  BUILD_MUSCLE: '💪',
  IMPROVE_ENDURANCE: '⚡',
  STAY_FIT: '🏅',
};

const GOAL_DESCS: Record<Goal, string> = {
  LOSE_WEIGHT: 'Burn fat, get lean',
  BUILD_MUSCLE: 'Gain size and strength',
  IMPROVE_ENDURANCE: 'Train longer, push harder',
  STAY_FIT: 'Maintain and move well',
};

function StepGoal({ value, onChange }: { value?: Goal; onChange: (g: Goal) => void }) {
  const { t } = useTranslation();
  const GOALS: Goal[] = ['LOSE_WEIGHT', 'BUILD_MUSCLE', 'IMPROVE_ENDURANCE', 'STAY_FIT'];

  return (
    <div>
      <p className="text-label mb-2">{t('onboarding.step', { current: 1, total: 6 })}</p>
      <h2 className="heading-1 text-zinc-100 mb-1">{t('onboarding.step1.title')}</h2>
      <p className="text-zinc-400 text-sm mb-8">{t('onboarding.step1.sub')}</p>
      <div className="flex flex-col gap-3">
        {GOALS.map((g) => (
          <button
            key={g}
            onClick={() => onChange(g)}
            className={`
              text-left rounded-2xl border-2 p-4 flex items-center gap-4 transition-all duration-200
              ${value === g
                ? 'border-orange-500 bg-orange-500/10 glow-sm'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
              }
            `}
            aria-pressed={value === g}
          >
            <span className="text-3xl flex-shrink-0">{GOAL_EMOJIS[g]}</span>
            <div>
              <div className="heading-3 text-zinc-100">{t(`onboarding.goals.${g}`)}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{GOAL_DESCS[g]}</div>
            </div>
            {value === g && (
              <span className="ml-auto flex-shrink-0">
                <CheckCircleIcon className="text-orange-500 w-5 h-5" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 2: Basics ────────────────────────────────────────
const SEX_OPTIONS: Array<{ value: Sex; label: string }> = [
  { value: 'MALE',   label: 'Male'   },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER',  label: 'Other'  },
];

function StepBasics({ data, onChange }: { data: WizardState; onChange: (p: Partial<WizardState>) => void }) {
  const { t } = useTranslation();
  return (
    <div>
      <p className="text-label mb-2">{t('onboarding.step', { current: 2, total: 6 })}</p>
      <h2 className="heading-1 text-zinc-100 mb-1">{t('onboarding.step2.title')}</h2>
      <p className="text-zinc-400 text-sm mb-8">{t('onboarding.step2.sub')}</p>

      {/* Unit toggle */}
      <div className="flex gap-2 mb-6">
        {(['METRIC', 'IMPERIAL'] as const).map((u) => (
          <button
            key={u}
            onClick={() => onChange({ unitPreference: u })}
            className={`flex-1 h-11 rounded-xl text-sm font-semibold border transition-all ${
              data.unitPreference === u
                ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400'
            }`}
          >
            {u === 'METRIC' ? 'kg / cm' : 'lbs / ft'}
          </button>
        ))}
      </div>

      {/* Sex */}
      <div className="mb-5">
        <label className="label">Sex</label>
        <div className="flex gap-2">
          {SEX_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onChange({ sex: value })}
              className={`flex-1 h-11 rounded-xl text-sm font-semibold border transition-all ${
                data.sex === value
                  ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Body stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Input
          label={`Weight (${data.unitPreference === 'METRIC' ? 'kg' : 'lbs'})`}
          type="number"
          inputMode="decimal"
          placeholder="75"
          value={data.weightKg ?? ''}
          onChange={(e) => onChange({ weightKg: +e.target.value })}
        />
        <Input
          label={`Height (${data.unitPreference === 'METRIC' ? 'cm' : 'in'})`}
          type="number"
          inputMode="decimal"
          placeholder="178"
          value={data.heightCm ?? ''}
          onChange={(e) => onChange({ heightCm: +e.target.value })}
        />
      </div>

      <Input
        label="Age"
        type="number"
        inputMode="numeric"
        placeholder="25"
        value={data.age ?? ''}
        onChange={(e) => onChange({ age: +e.target.value })}
      />
    </div>
  );
}

// ── Step 3: Schedule ──────────────────────────────────────
const DAYS_OPTIONS = [2, 3, 4, 5, 6];
const DURATION_OPTIONS = [30, 45, 60, 75, 90, 120];
const LEVELS: Array<{ value: FitnessLevel; label: string; desc: string }> = [
  { value: 'BEGINNER',     label: 'Beginner',     desc: '< 1 year'  },
  { value: 'INTERMEDIATE', label: 'Intermediate', desc: '1–3 years' },
  { value: 'ADVANCED',     label: 'Advanced',     desc: '3+ years'  },
];

function StepSchedule({ data, onChange }: { data: WizardState; onChange: (p: Partial<WizardState>) => void }) {
  const { t } = useTranslation();
  return (
    <div>
      <p className="text-label mb-2">{t('onboarding.step', { current: 3, total: 6 })}</p>
      <h2 className="heading-1 text-zinc-100 mb-1">{t('onboarding.step3.title')}</h2>
      <p className="text-zinc-400 text-sm mb-8">{t('onboarding.step3.sub')}</p>

      {/* Days/week */}
      <div className="mb-6">
        <label className="label">Days per week</label>
        <div className="flex gap-2">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => onChange({ daysPerWeek: d })}
              className={`flex-1 h-12 rounded-xl text-sm font-bold border transition-all ${
                data.daysPerWeek === d
                  ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Session length */}
      <div className="mb-6">
        <label className="label">Session length (minutes)</label>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => onChange({ sessionMinutes: m })}
              className={`h-11 px-4 rounded-xl text-sm font-semibold border transition-all ${
                data.sessionMinutes === m
                  ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Fitness level */}
      <div className="mb-6">
        <label className="label">Training experience</label>
        <div className="flex flex-col gap-2">
          {LEVELS.map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => onChange({ fitnessLevel: value })}
              className={`text-left rounded-xl border px-4 py-3 flex items-center justify-between transition-all ${
                data.fitnessLevel === value
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-zinc-700 bg-zinc-800'
              }`}
            >
              <span className={`font-semibold text-sm ${data.fitnessLevel === value ? 'text-orange-400' : 'text-zinc-200'}`}>
                {label}
              </span>
              <span className="text-xs text-zinc-500">{desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 4: Equipment ─────────────────────────────────────
const EQUIPMENT_OPTIONS = [
  { value: 'BARBELL',           label: 'Barbell',          emoji: '🏋️' },
  { value: 'DUMBBELL_PAIR',     label: 'Dumbbells',        emoji: '🏋️' },
  { value: 'RACK',              label: 'Squat Rack',       emoji: '🏗️' },
  { value: 'BENCH_ADJUSTABLE',  label: 'Bench',            emoji: '🛋️' },
  { value: 'CABLE_MACHINE',     label: 'Cable Machine',    emoji: '🔗' },
  { value: 'LEG_PRESS',         label: 'Leg Press',        emoji: '🦵' },
  { value: 'PULL_UP_BAR',       label: 'Pull-up Bar',      emoji: '🪝' },
  { value: 'TREADMILL',         label: 'Treadmill',        emoji: '🏃' },
  { value: 'RESISTANCE_BAND',   label: 'Resistance Bands', emoji: '〰️' },
  { value: 'BODYWEIGHT_ONLY',   label: 'Bodyweight Only',  emoji: '🧍' },
];

function StepEquipment({ selected, onChange }: { selected: string[]; onChange: (e: string[]) => void }) {
  const { t } = useTranslation();
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  return (
    <div>
      <p className="text-label mb-2">{t('onboarding.step', { current: 4, total: 6 })}</p>
      <h2 className="heading-1 text-zinc-100 mb-1">{t('onboarding.step4.title')}</h2>
      <p className="text-zinc-400 text-sm mb-8">{t('onboarding.step4.sub')}</p>

      <div className="grid grid-cols-2 gap-2">
        {EQUIPMENT_OPTIONS.map(({ value, label, emoji }) => {
          const active = selected.includes(value);
          return (
            <button
              key={value}
              onClick={() => toggle(value)}
              className={`text-left rounded-xl border p-3 flex items-center gap-2 transition-all ${
                active
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-zinc-800 bg-zinc-900'
              }`}
              aria-pressed={active}
            >
              <span className="text-lg">{emoji}</span>
              <span className={`text-sm font-medium ${active ? 'text-orange-400' : 'text-zinc-300'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 5: Health ────────────────────────────────────────
const INJURY_AREAS = ['SHOULDER', 'ELBOW', 'LOWER_BACK', 'UPPER_BACK', 'HIP', 'KNEE', 'ANKLE'];

function StepHealth({ data, onChange }: { data: WizardState; onChange: (p: Partial<WizardState>) => void }) {
  const { t } = useTranslation();
  const toggleInjury = (area: string) => {
    const injuries = data.injuries.includes(area)
      ? data.injuries.filter((x) => x !== area)
      : [...data.injuries, area];
    onChange({ injuries });
  };

  return (
    <div>
      <p className="text-label mb-2">{t('onboarding.step', { current: 5, total: 6 })}</p>
      <h2 className="heading-1 text-zinc-100 mb-1">{t('onboarding.step5.title')}</h2>
      <p className="text-zinc-400 text-sm mb-8">{t('onboarding.step5.sub')}</p>

      {/* Injuries */}
      <div className="mb-6">
        <label className="label">Current injuries or sensitivities</label>
        <div className="flex flex-wrap gap-2">
          {INJURY_AREAS.map((area) => {
            const active = data.injuries.includes(area);
            return (
              <button
                key={area}
                onClick={() => toggleInjury(area)}
                className={`h-10 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  active
                    ? 'border-danger/60 bg-danger/10 text-red-400'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                }`}
                aria-pressed={active}
              >
                {area.replace(/_/g, ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* PARQ */}
      <div className="card p-4 mb-4">
        <h3 className="heading-3 text-zinc-100 mb-2">Physical Activity Readiness</h3>
        <p className="text-xs text-zinc-400 leading-relaxed mb-3">
          I confirm I have not been advised by a doctor to avoid vigorous physical activity, and I am not experiencing symptoms of heart disease, chest pain, or dizziness.
        </p>
        <CheckboxRow
          checked={data.parqAcknowledged}
          onChange={(v) => onChange({ parqAcknowledged: v })}
          label="I confirm the above statements"
        />
      </div>

      {/* Medical disclaimer */}
      <div className="card-orange p-4">
        <p className="text-xs text-zinc-400 leading-relaxed mb-3">
          Gymify AI provides fitness guidance only, not medical advice. Consult a qualified physician before beginning any new exercise program.
        </p>
        <CheckboxRow
          checked={data.medicalDisclaimer}
          onChange={(v) => onChange({ medicalDisclaimer: v })}
          label="I understand and accept"
        />
      </div>
    </div>
  );
}

function CheckboxRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          checked ? 'border-orange-500 bg-orange-500' : 'border-zinc-600 bg-zinc-800'
        }`}
      >
        {checked && <CheckIcon className="w-3 h-3 text-white" />}
      </div>
      <span className="text-sm text-zinc-300">{label}</span>
    </label>
  );
}

// ── Step 6: Benchmarks ────────────────────────────────────
const BENCHMARKS = [
  { slug: 'barbell-back-squat',    label: 'Back Squat'      },
  { slug: 'barbell-bench-press',   label: 'Bench Press'     },
  { slug: 'barbell-deadlift',      label: 'Deadlift'        },
  { slug: 'barbell-overhead-press',label: 'Overhead Press'  },
];

function StepBenchmarks({ data, onChange }: { data: WizardState; onChange: (p: Partial<WizardState>) => void }) {
  const { t } = useTranslation();
  const updateBenchmark = (slug: string, val: string) => {
    onChange({ benchmarks: { ...data.benchmarks, [slug]: +val } });
  };

  return (
    <div>
      <p className="text-label mb-2">{t('onboarding.step', { current: 6, total: 6 })}</p>
      <h2 className="heading-1 text-zinc-100 mb-1">{t('onboarding.step6.title')}</h2>
      <p className="text-zinc-400 text-sm mb-2">{t('onboarding.step6.sub')}</p>
      <p className="text-zinc-600 text-xs mb-8">Enter your estimated 1-rep max (or skip).</p>

      <div className="flex flex-col gap-3">
        {BENCHMARKS.map(({ slug, label }) => (
          <Input
            key={slug}
            label={`${label} (${data.unitPreference === 'METRIC' ? 'kg' : 'lbs'})`}
            type="number"
            inputMode="decimal"
            placeholder="Leave blank if unknown"
            value={data.benchmarks[slug] ?? ''}
            onChange={(e) => updateBenchmark(slug, e.target.value)}
          />
        ))}
      </div>

      <div className="card-orange p-4 mt-6">
        <p className="text-xs text-orange-300 leading-relaxed">
          💡 No idea? No problem. The AI will estimate from your first few sessions and auto-update your benchmarks.
        </p>
      </div>
    </div>
  );
}

// ── Icon helpers ──────────────────────────────────────────
function CheckCircleIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
