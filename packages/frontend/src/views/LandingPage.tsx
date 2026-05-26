// ═══════════════════════════════════════════════════════════
// GYMIFY AI — Landing Page
// ═══════════════════════════════════════════════════════════
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge } from '../components/ui/primitives';
import { GymifyLogo, AccentLine } from '../components/layout/Layout';

const STATS = [
  { value: '4-week', label: 'Mesocycles' },
  { value: 'AI',     label: 'Personalized' },
  { value: '150+',   label: 'Exercises' },
];

const FEATURES = [
  {
    icon: '🎯',
    title: 'Goal-First Design',
    body: 'Tell us what you want — lose weight, build muscle, boost endurance — and we build the program around you.',
  },
  {
    icon: '🔄',
    title: 'Progressive Overload',
    body: 'Every set logged. Every rep tracked. AI-driven progression rules so you always know when to add weight.',
  },
  {
    icon: '📱',
    title: 'Built for the Gym Floor',
    body: 'Big touch targets, offline mode, rest timer with vibration. Designed for sweaty hands and flaky Wi-Fi.',
  },
  {
    icon: '🤖',
    title: 'Powered by Claude AI',
    body: 'Mesocycles crafted with deload weeks, injury awareness, and equipment-specific exercise selection.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-zinc-950 flex flex-col">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative flex-1 flex flex-col justify-between px-5 pt-14 pb-10 overflow-hidden">

        {/* Background glow */}
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #F26419 0%, transparent 70%)',
            transform: 'translate(30%, -30%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute bottom-1/3 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #F26419 0%, transparent 70%)',
            transform: 'translate(-40%, 0)',
          }}
        />

        {/* Logo */}
        <div className="flex items-center justify-between">
          <GymifyLogo size="md" />
          <Badge color="orange">Beta</Badge>
        </div>

        {/* Headline */}
        <div className="mt-16 mb-8 animate-fade-up">
          <p className="text-label mb-3">AI Personal Trainer</p>
          <h1 className="display-xl text-zinc-100 mb-4">
            Your plan.<br />
            <span className="text-gradient-orange">Your pace.</span>
          </h1>
          <AccentLine />
          <p className="mt-5 text-zinc-400 text-base leading-relaxed max-w-xs">
            Generate a complete AI-powered mesocycle in under 60 seconds — tailored to your goals, equipment, and fitness level.
          </p>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mb-10 animate-fade-up" style={{ animationDelay: '150ms' }}>
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex-1 text-center">
              <div className="font-display font-black text-2xl text-orange-400 leading-none">{value}</div>
              <div className="text-2xs text-zinc-500 uppercase tracking-wider mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 animate-fade-up" style={{ animationDelay: '250ms' }}>
          <Button
            size="lg"
            variant="primary"
            className="w-full text-base font-black uppercase tracking-widest"
            onClick={() => navigate('/onboarding')}
            rightIcon={<ArrowRightIcon />}
          >
            Build My Program
          </Button>
          <p className="text-center text-2xs text-zinc-600 uppercase tracking-wider">
            Free · No account needed · 2 plans free
          </p>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="bg-zinc-900/60 border-t border-zinc-800 px-5 py-10">
        <h2 className="heading-2 text-zinc-100 mb-6 text-center">
          Everything you need to{' '}
          <span className="text-gradient-orange">train smarter</span>
        </h2>

        <div className="flex flex-col gap-4">
          {FEATURES.map(({ icon, title, body }, i) => (
            <div
              key={title}
              className="card p-4 flex gap-4 items-start animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
              <div>
                <h3 className="heading-3 text-zinc-100 mb-1">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ───────────────────────────────────── */}
      <section className="px-5 py-10 text-center">
        <p className="text-zinc-400 text-sm mb-4">Ready to stop guessing?</p>
        <Button
          size="lg"
          variant="primary"
          className="w-full"
          onClick={() => navigate('/onboarding')}
        >
          Get Started — It's Free
        </Button>
        <p className="mt-4 text-zinc-600 text-xs">
          No credit card required for your first 2 plans
        </p>
      </section>

    </div>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}
