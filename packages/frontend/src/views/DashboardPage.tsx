// ═══════════════════════════════════════════════════════════
// GYMIFY AI — Dashboard View
// ═══════════════════════════════════════════════════════════
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge, Skeleton, StatusDot, SectionLabel } from '../components/ui/primitives';
import { AppShell, TopBar, Page, Section, GymifyLogo, AccentLine } from '../components/layout/Layout';

// ── Mock data (replace with TanStack Query hooks) ─────────
const TODAY_SESSION = {
  focus: 'Upper Body — Push',
  exercises: ['Barbell Bench Press', 'Overhead Press', 'Cable Fly', 'Tricep Pushdown'],
  duration: 60,
  week: 2,
  day: 3,
};

const WEEK_DAYS = [
  { label: 'M', status: 'completed' as const },
  { label: 'T', status: 'completed' as const },
  { label: 'W', status: 'active'    as const },
  { label: 'T', status: 'scheduled' as const },
  { label: 'F', status: 'scheduled' as const },
  { label: 'S', status: 'scheduled' as const },
  { label: 'S', status: 'scheduled' as const },
];

const STATS = [
  { label: 'Streak',   value: '12',  unit: 'days',    icon: '🔥' },
  { label: 'This week',value: '2',   unit: '/ 4 done', icon: '✅' },
  { label: 'Week',     value: '2',   unit: '/ 4',      icon: '📅' },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <Page>
        {/* Top bar */}
        <TopBar
          leftAction={<GymifyLogo size="sm" />}
          rightAction={
            <button
              className="btn-icon btn-ghost"
              aria-label="Notifications"
            >
              <BellIcon />
            </button>
          }
        />

        <Section>
          {/* Greeting */}
          <div className="mb-5 animate-fade-up">
            <p className="text-label mb-0.5">Today</p>
            <h1 className="heading-1 text-zinc-100">
              Week {TODAY_SESSION.week}, Session {TODAY_SESSION.day}
            </h1>
          </div>

          {/* Week strip */}
          <WeekStrip days={WEEK_DAYS} />

          {/* Today's card */}
          <TodayCard session={TODAY_SESSION} onStart={() => navigate('/workout/session-today')} />

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {STATS.map(({ label, value, unit, icon }) => (
              <Card key={label} padding="sm" className="text-center">
                <div className="text-xl mb-1">{icon}</div>
                <div className="font-display font-black text-xl text-zinc-100 leading-none">{value}</div>
                <div className="text-2xs text-zinc-500 mt-0.5 leading-tight">{unit}</div>
                <div className="text-2xs text-zinc-600 uppercase tracking-wider mt-1">{label}</div>
              </Card>
            ))}
          </div>

          {/* Plan banner */}
          <PlanBanner />

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
              onClick={() => navigate('/history/progress')}
            />
          </div>
        </Section>
      </Page>
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
  session: typeof TODAY_SESSION;
  onStart: () => void;
}) {
  return (
    <div
      className="card-orange rounded-3xl p-5 mb-5 relative overflow-hidden"
    >
      {/* Decorative bg */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #F26419 0%, transparent 70%)',
          transform: 'translate(20%, -20%)',
        }}
      />

      <div className="flex items-start justify-between mb-4">
        <Badge color="orange">Today's session</Badge>
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
        Start Workout
      </Button>
    </div>
  );
}

// ── Plan Banner ───────────────────────────────────────────
function PlanBanner() {
  return (
    <div className="card p-4 mb-5 flex items-center gap-3">
      <div className="text-2xl">🏆</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-zinc-200 truncate">Week 2 of 4 — On track</div>
        <div className="text-xs text-zinc-500">Deload week in 2 weeks. Keep it up!</div>
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
              strokeDasharray="50 100"
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xs font-bold text-orange-400">50%</span>
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
