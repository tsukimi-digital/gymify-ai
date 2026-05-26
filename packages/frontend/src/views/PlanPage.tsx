// ═══════════════════════════════════════════════════════════
// GYMIFY AI — Plan Page
// Mesocycle week tabs + day list
// ═══════════════════════════════════════════════════════════
import React, { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Skeleton, SectionLabel } from '../components/ui/primitives';
import { AppShell, TopBar, Page, Section } from '../components/layout/Layout';
import { useActivePlan } from '../api/hooks/usePlan';
import { QuotaExceededError } from '../api/client';

const PaymentModal = lazy(() => import('../components/modals/PaymentModal'));

export default function PlanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: activePlan, isLoading, error } = useActivePlan();
  const [activeWeek, setActiveWeek] = useState(0);
  const [showPayment, setShowPayment] = useState(false);

  const isQuota = error instanceof QuotaExceededError;
  const schedule = activePlan?.content?.mesocycle?.schedule ?? [];
  const planName = activePlan?.content?.mesocycle?.name ?? 'Gymify AI';
  const weekCount = schedule.length;

  const currentWeek = activeWeek;
  const weekDays = schedule[currentWeek]?.days ?? [];

  const handleRegenerate = async () => {
    navigate('/onboarding');
  };

  return (
    <AppShell>
      <Page>
        <TopBar
          title={`${t('plan.title')} · ${planName}`}
        />

        {isLoading ? (
          <Section>
            <Skeleton className="h-10 w-full rounded-2xl mb-4" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl mb-2" />
            ))}
          </Section>
        ) : !activePlan ? (
          <Section>
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📋</div>
              <h2 className="heading-2 text-zinc-100 mb-2">{t('dashboard.noPlan')}</h2>
              <Button variant="primary" onClick={() => navigate('/onboarding')}>
                {t('dashboard.generatePlan')}
              </Button>
            </div>
          </Section>
        ) : (
          <Section>
            {/* Week tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
              {schedule.map((week: any, i: number) => {
                const isDeload = week.isDeload ?? (i === schedule.length - 1 && weekCount === 4);
                return (
                  <button
                    key={i}
                    onClick={() => setActiveWeek(i)}
                    className={`flex-shrink-0 h-10 px-4 rounded-xl text-sm font-bold border transition-all ${
                      activeWeek === i
                        ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {isDeload ? `T${i + 1}-D` : `T${i + 1}`}
                    {i === (activePlan.currentWeek ?? 1) - 1 && (
                      <span className="ml-1 w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Deload badge */}
            {schedule[currentWeek]?.isDeload && (
              <Badge color="yellow" className="mb-4">{t('plan.deload')}</Badge>
            )}

            {/* Days list */}
            <div className="flex flex-col gap-3">
              {weekDays.map((day: any, dayIdx: number) => {
                const isRest = day?.isRest ?? day?.focus === 'REST';
                const exCount = day?.exercises?.length ?? 0;
                return (
                  <div
                    key={dayIdx}
                    className={`p-day rounded-2xl border p-4 transition-all ${
                      isRest
                        ? 'border-zinc-800 bg-zinc-900/40'
                        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xs text-zinc-600 uppercase tracking-wider mb-0.5">
                          {t('plan.day', { n: dayIdx + 1 })}
                        </p>
                        <h3 className="heading-3 text-zinc-100">
                          {isRest ? t('plan.rest') : (day?.focus ?? day?.name ?? `Day ${dayIdx + 1}`)}
                        </h3>
                        {!isRest && exCount > 0 && (
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {exCount} exercise{exCount !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      {!isRest && (
                        <div className="flex-shrink-0">
                          {day?.completed ? (
                            <Badge color="green">✓</Badge>
                          ) : (
                            <svg className="w-5 h-5 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6"/>
                            </svg>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Exercise chips */}
                    {!isRest && day?.exercises && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {day.exercises.slice(0, 4).map((ex: any, i: number) => (
                          <span key={i} className="text-2xs bg-zinc-800/80 text-zinc-400 rounded-lg px-2 py-1">
                            {ex.name ?? ex}
                          </span>
                        ))}
                        {day.exercises.length > 4 && (
                          <span className="text-2xs text-zinc-600 px-2 py-1">
                            +{day.exercises.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Regenerate CTA */}
            <div className="mt-6">
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleRegenerate}
              >
                {t('plan.regenerate')}
              </Button>
            </div>
          </Section>
        )}
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
