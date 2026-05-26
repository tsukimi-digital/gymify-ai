// ═══════════════════════════════════════════════════════════
// GYMIFY AI — History Page
// Session list + e1RM progress charts
// ═══════════════════════════════════════════════════════════
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge, Skeleton, SectionLabel } from '../components/ui/primitives';
import { AppShell, TopBar, Page, Section } from '../components/layout/Layout';
import { useStats } from '../api/hooks/useStats';
import { apiFetch } from '../api/client';

function useSessions(page = 1) {
  return useQuery({
    queryKey: ['sessions', page],
    queryFn: () => apiFetch<any>(`/sessions?page=${page}&limit=20`),
    retry: false,
  });
}

export default function HistoryPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'list' | 'progress'>('list');

  return (
    <AppShell>
      <Page>
        <TopBar title="History" />

        {/* Tab selector */}
        <div className="flex gap-2 px-4 pt-2 pb-0">
          {(['list', 'progress'] as const).map((tabId) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className={`flex-1 h-10 rounded-xl text-sm font-bold border transition-all ${
                tab === tabId
                  ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400'
              }`}
            >
              {tabId === 'list' ? t('history.list') : t('history.progress')}
            </button>
          ))}
        </div>

        {tab === 'list' ? <SessionListTab /> : <ProgressTab />}
      </Page>
    </AppShell>
  );
}

// ── Session List Tab ──────────────────────────────────────
function SessionListTab() {
  const { t } = useTranslation();
  const { data, isLoading } = useSessions();
  const sessions = data?.sessions ?? data?.items ?? data ?? [];

  if (isLoading) {
    return (
      <Section>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl mb-3" />
        ))}
      </Section>
    );
  }

  if (!Array.isArray(sessions) || sessions.length === 0) {
    return (
      <Section>
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-zinc-400">{t('history.recentSessions')}</p>
          <p className="text-sm text-zinc-600 mt-1">No sessions yet. Start your first workout!</p>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <SectionLabel>{t('history.recentSessions')}</SectionLabel>
      <div className="flex flex-col gap-3">
        {sessions.map((session: any) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </Section>
  );
}

function SessionCard({ session }: { session: any }) {
  const date = session.completedAt ?? session.scheduledDate ?? session.date;
  const displayDate = date ? new Date(date).toLocaleDateString('pl-PL', {
    weekday: 'short', day: 'numeric', month: 'short',
  }) : '—';
  const duration = session.durationMin ?? session.duration ?? 0;
  const rpe = session.overallRpe;

  return (
    <div className="h-session card p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-zinc-500">{displayDate}</p>
          <h3 className="heading-3 text-zinc-100">{session.focus ?? session.name ?? 'Workout'}</h3>
        </div>
        <div className="flex gap-2 items-center">
          {rpe && <Badge color="orange">RPE {rpe}</Badge>}
        </div>
      </div>
      <div className="flex gap-4 text-xs text-zinc-500">
        {duration > 0 && <span>{duration} min</span>}
        {session.setsCount > 0 && <span>{session.setsCount} {session.setsCount === 1 ? 'set' : 'sets'}</span>}
        {session.volumeKg > 0 && <span>{session.volumeKg.toLocaleString()} kg</span>}
      </div>
    </div>
  );
}

// ── Progress Tab ──────────────────────────────────────────
function ProgressTab() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useStats();
  const { data: sessions } = useSessions();

  if (isLoading) {
    return (
      <Section>
        <Skeleton className="h-48 w-full rounded-2xl mb-4" />
        <Skeleton className="h-24 w-full rounded-2xl mb-3" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </Section>
    );
  }

  const e1rmData = stats?.e1rm ?? {};
  const weeklyVolume = stats?.weeklyVolumeKg ?? 0;
  const totalSets = stats?.totalSets ?? 0;

  return (
    <Section>
      {/* e1RM Chart */}
      {Object.keys(e1rmData).length > 0 && (
        <div className="h-card card p-4 mb-4">
          <h3 className="heading-3 text-zinc-100 mb-4">{t('history.e1rm')}</h3>
          <E1RMChart data={e1rmData} />
        </div>
      )}

      {/* Volume stats */}
      <div className="h-vol grid grid-cols-2 gap-3 mb-4">
        <div className="card p-4 text-center">
          <div className="font-display font-black text-2xl text-orange-400">
            {weeklyVolume > 0 ? `${Math.round(weeklyVolume / 1000)}k` : '—'}
          </div>
          <div className="text-xs text-zinc-500 mt-1">{t('history.weeklyVolume')} (kg)</div>
        </div>
        <div className="card p-4 text-center">
          <div className="font-display font-black text-2xl text-orange-400">
            {totalSets > 0 ? totalSets : '—'}
          </div>
          <div className="text-xs text-zinc-500 mt-1">{t('history.sets')}</div>
        </div>
      </div>

      {/* Recent sessions */}
      <SectionLabel>{t('history.recentSessions')}</SectionLabel>
      {Array.isArray(sessions?.sessions ?? sessions) &&
        (sessions?.sessions ?? sessions ?? []).slice(0, 3).map((session: any) => (
          <SessionCard key={session.id} session={session} />
        ))}
    </Section>
  );
}

// ── e1RM SVG bar chart ────────────────────────────────────
function E1RMChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).slice(0, 6);
  if (entries.length === 0) return null;

  const max = Math.max(...entries.map(([, v]) => v));
  const barWidth = 40;
  const gap = 8;
  const height = 120;
  const totalWidth = entries.length * (barWidth + gap) - gap;

  return (
    <div className="overflow-x-auto">
      <svg width={totalWidth} height={height + 32} aria-label="e1RM chart">
        {entries.map(([label, value], i) => {
          const barH = Math.max(4, Math.round((value / max) * height));
          const x = i * (barWidth + gap);
          const y = height - barH;
          return (
            <g key={label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx="6"
                fill="url(#barGrad)"
              />
              <text
                x={x + barWidth / 2}
                y={height + 14}
                textAnchor="middle"
                fontSize="9"
                fill="#555"
                fontFamily="sans-serif"
              >
                {label.replace('barbell-', '').replace(/-/g, ' ').slice(0, 8)}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize="9"
                fill="#F26419"
                fontFamily="sans-serif"
              >
                {value}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F26419" />
            <stop offset="100%" stopColor="#D94E08" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
