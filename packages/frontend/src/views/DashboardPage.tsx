// ═══════════════════════════════════════════════════════════
// GYMIFY AI — Dashboard View
// ═══════════════════════════════════════════════════════════
import React, { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Card, Badge, Skeleton, StatusDot, SectionLabel } from '../components/ui/primitives';
import { AppShell, TopBar, Page, Section, GymifyLogo, AccentLine } from '../components/layout/Layout';
import { useActivePlan } from '../api/hooks/usePlan';
import { useStats } from '../api/hooks/useStats';
import { useAuth } from '../context/AuthContext';
import { QuotaExceededError } from '../api/client';

const PaymentModal = lazy(() => import('../components/modals/PaymentModal'));

// Day labels
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { email } = useAuth();
  const [showPayment, setShowPayment] = useState(false);

  const { data: activePlan, isLoading: planLoading } = useActivePlan();
  const { data: stats, isLoading: statsLoading } = useStats();

  // Derive today's session from plan
  const todaySession = React.useMemo(() => {
    if (!activePlan?.content?.mesocycle?.schedule) return null;
    const today = new Date().getDay(); // 0=Sun
    const dayIndex = today === 0 ? 6 : today - 1; // 0=Mon
    const schedule = activePlan.content.mesocycle.schedule;
    // Find current week
    const week = activePlan.currentWeek ?? 1;
    const weekData = schedule[week - 1] ?? schedule[0];
    if (!weekData) return null;
    return weekData.days?.[dayIndex] ?? null;
  }, [activePlan]);

  // Derive week strip from plan
  const weekDays = React.useMemo(() => {
    if (!activePlan?.content?.mesocycle?.schedule) return null;
    const today = new Date().getDay();
    const todayIdx = today === 0 ? 6 : today - 1;
    const week = activePlan.currentWeek ?? 1;
    const weekData = activePlan.content.mesocycle.schedule[week - 1]
      ?? activePlan.content.mesocycle.schedule[0];
    if (!weekData?.days) return null;
    return weekData.days.map((day: any, i: number) => ({
      label: DAY_LABELS[i],
      status: day?.completed
        ? 'completed' as const
        : i === todayIdx
          ? 'active' as const
          : i < todayIdx
            ? 'skipped' as const
            : 'scheduled' as const,
    }));
  }, [activePlan]);

  const streak = stats?.streak ?? 0;
  const weekCount = stats?.weeklySessionsCompleted ?? 0;
  const weekTotal = stats?.weeklySessionsPlanned ?? 4;
  const planWeek = activePlan?.currentWeek ?? 1;
  const planTotalWeeks = activePlan?.content?.mesocycle?.schedule?.length ?? 4;

  return (
    <AppShell>
      <Page>
        {/* Top bar */}
        <TopBar
          leftAction={<GymifyLogo size="sm" />}
          rightAction={
            <button className="btn-icon btn-ghost" aria-label="Notifications">
              <BellIcon />
            </button>
          }
        />

        <Section>
          {/* Greeting */}
          <div className="mb-5 animate-fade-up">
            <p className="text-label mb-0.5">{t('dashboard.today')}</p>
            {planLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : activePlan ? (
              <h1 className="heading-1 text-zinc-100">
                Week {planWeek}, {todaySession?.focus ?? t('dashboard.today')}
              </h1>
            ) : (
              <h1 className="heading-1 text-zinc-100">{t('dashboard.greeting')}</h1>
            )}
          </div>

          {/* Week strip */}
          {weekDays ? (
            <WeekStrip days={weekDays} />
          ) : planLoading ? (
            <div className="flex gap-2 mb-5">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="flex-1 h-12 rounded-xl" />
              ))}
            </div>
          ) : null}

          {/* Today's card or empty state */}
          {planLoading ? (
            <Skeleton className="h-44 rounded-3xl mb-5" />
          ) : activePlan && todaySession ? (
            <TodayCard
              session={{
                focus: todaySession.focus ?? t('dashboard.today'),
                exercises: todaySession.exercises?.map((e: any) => e.name ?? e) ?? [],
                duration: todaySession.durationMin ?? 60,
                week: planWeek,
                day: todaySession.dayNumber ?? 1,
              }}
              onStart={() => {
                const sessionId = todaySession.sessionId ?? 'today';
                navigate(`/workout/${sessionId}`);
              }}
            />
          ) : !planLoading && !activePlan ? (
            <EmptyPlanCard onGenerate={() => navigate('/onboarding')} />
          ) : null}

          {/* Stats row */}
          {statsLoading ? (
            <div className="grid grid-cols-3 gap-3 mb-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <Card padding="sm" className="text-center">
                <div className="text-xl mb-1">🔥</div>
                <div className="font-display font-black text-xl text-zinc-100 leading-none">{streak}</div>
                <div className="text-2xs text-zinc-500 mt-0.5 leading-tight">{t('dashboard.days')}</div>
                <div className="text-2xs text-zinc-600 uppercase tracking-wider mt-1">{t('dashboard.streak')}</div>
              </Card>
              <Card padding="sm" className="text-center">
                <div className="text-xl mb-1">✅</div>
                <div className="font-display font-black text-xl text-zinc-100 leading-none">{weekCount}</div>
                <div className="text-2xs text-zinc-500 mt-0.5 leading-tight">/ {weekTotal} done</div>
                <div className="text-2xs text-zinc-600 uppercase tracking-wider mt-1">{t('dashboard.thisWeek')}</div>
              </Card>
              <Card padding="sm" className="text-center">
                <div className="text-xl mb-1">📅</div>
                <div className="font-display font-black text-xl text-zinc-100 leading-none">{planWeek}</div>
                <div className="text-2xs text-zinc-500 mt-0.5 leading-tight">/ {planTotalWeeks}</div>
                <div className="text-2xs text-zinc-600 uppercase tracking-wider mt-1">Week</div>
              </Card>
            </div>
          )}

          {/* Plan banner */}
          {activePlan && (
            <PlanBanner week={planWeek} total={planTotalWeeks} />
          )}

          {/* Quick links */}
          <SectionLabel>Quick access</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <QuickLink
              icon="📋"
              label="View Full Plan"
              desc="4-week mesocycle"
              onClick={() => navigate('/plan')}
            />
            <QuickLink
              icon="📈"
              label="Progress"
              desc="e1RM trends"
              onClick={() => navigate('/history')}
            />
          </div>
        </Section>
      </Page>

      {showPayment && (
        <Suspense fallback={null}>
          <PaymentModal
            onSuccess={() => setShowPayment(false)}
            onClose={() => setShowPayment(false)}
          />
        </Suspense>
      )}
    </AppShell>
  );
}

// ── Week Strip ─────────────────────────────────────────────
function WeekStrip({ days }: { days: Array<{ label: string; status: 'completed' | 'active' | 'scheduled' | 'skipped' }> }) {
  return (
    <div className="flex justify-between mb-5 px-1">
      {days.map(({ label, status }, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <span className={`text-xs font-semibold ${status === 'active' ? 'text-orange-400' : 'text-zinc-600'}`}>
            {label}
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
              status === 'active'
                ? 'border-orange-500 bg-orange-500/15'
                : status === 'completed'
                  ? 'border-zinc-700 bg-zinc-800'
                  : 'border-zinc-800 bg-transparent'
            }`}
          >
            {status === 'completed' && <span className="text-green-400 text-xs">✓</span>}
            {status === 'active' && <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />}
            {status === 'skipped' && <span className="text-yellow-500 text-xs">–</span>}
          </div>
          <StatusDot status={status} />
        </div>
      ))}
    </div>
  );
}

// ── Today Card ────────────────────────────────────────────
function TodayCard({
  session,
  onStart,
}: {
  session: { focus: string; exercises: string[]; duration: number; week: number; day: number };
  onStart: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="card-orange rounded-3xl p-5 mb-5 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #F26419 0%, transparent 70%)',
          transform: 'translate(20%, -20%)',
        }}
      />
      <div className="flex items-start justify-between mb-4">
        <Badge color="orange">{t('dashboard.today')}</Badge>
        <span className="text-label text-2xs text-zinc-600">{session.duration} min</span>
      </div>
      <h2 className="heading-2 text-zinc-100 mb-1">{session.focus}</h2>
      <AccentLine />
      <div className="mt-3 mb-5 flex flex-wrap gap-1.5">
        {session.exercises.map((ex) => (
          <span key={ex} className="text-2xs bg-zinc-800/80 text-zinc-400 rounded-lg px-2 py-1">
            {ex}
          </span>
        ))}
      </div>
      <Button
        size="lg"
        variant="primary"
        className="w-full font-black uppercase tracking-widest"
        onClick={onStart}
        rightIcon={<PlayIcon />}
      >
        {t('dashboard.startWorkout')}
      </Button>
    </div>
  );
}

// ── Empty Plan Card ───────────────────────────────────────
function EmptyPlanCard({ onGenerate }: { onGenerate: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="card p-6 mb-5 text-center">
      <div className="text-4xl mb-3">🏋️</div>
      <h3 className="heading-3 text-zinc-100 mb-2">{t('dashboard.noPlan')}</h3>
      <Button size="md" variant="primary" onClick={onGenerate}>
        {t('dashboard.generatePlan')}
      </Button>
    </div>
  );
}

// ── Plan Banner ───────────────────────────────────────────
function PlanBanner({ week, total }: { week: number; total: number }) {
  const pct = Math.round((week / total) * 100);
  const deloadIn = total - week;
  return (
    <div className="card p-4 mb-5 flex items-center gap-3">
      <div className="text-2xl">🏆</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-zinc-200 truncate">Week {week} of {total} — On track</div>
        <div className="text-xs text-zinc-500">
          {deloadIn > 0 ? `Deload week in ${deloadIn} week${deloadIn > 1 ? 's' : ''}. Keep it up!` : 'Deload week!'}
        </div>
      </div>
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full relative">
          <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2E2E2E" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9"
              fill="none"
              stroke="#F26419"
              strokeWidth="3"
              strokeDasharray={`${pct} 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xs font-bold text-orange-400">
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Quick Link ────────────────────────────────────────────
function QuickLink({ icon, label, desc, onClick }: { icon: string; label: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="card-interactive p-4 text-left rounded-2xl flex flex-col gap-2"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="text-sm font-semibold text-zinc-200">{label}</div>
        <div className="text-xs text-zinc-500">{desc}</div>
      </div>
    </button>
  );
}

// ── Icons ─────────────────────────────────────────────────
function BellIcon() {
  return (
    <svg className="w-5 h-5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  );
}
