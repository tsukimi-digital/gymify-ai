// ═══════════════════════════════════════════════════════════
// GYMIFY AI — Layout Components
// ═══════════════════════════════════════════════════════════
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// ── Logo ──────────────────────────────────────────────────
export function GymifyLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const textSize = { sm: 'text-xl', md: 'text-2xl', lg: 'text-4xl' }[size];
  return (
    <div className={`font-display font-black uppercase tracking-tight ${textSize} flex items-center gap-1`}>
      <span className="text-zinc-100">Gymify</span>
      <span className="text-gradient-orange">AI</span>
    </div>
  );
}

// ── Top Bar ───────────────────────────────────────────────
interface TopBarProps {
  title?: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export function TopBar({ title, subtitle, leftAction, rightAction, transparent = false }: TopBarProps) {
  return (
    <header
      className={`
        sticky top-0 z-sticky pt-safe
        flex items-center gap-3 px-4 h-16
        ${transparent
          ? 'bg-transparent'
          : 'bg-zinc-950/90 border-b border-zinc-800/60'
        }
      `}
      style={{ backdropFilter: transparent ? 'none' : 'blur(12px)' }}
    >
      {leftAction && (
        <div className="flex-shrink-0">{leftAction}</div>
      )}

      <div className="flex-1 min-w-0">
        {title && (
          <h1 className="heading-2 text-zinc-100 truncate">{title}</h1>
        )}
        {subtitle && (
          <p className="text-xs text-zinc-500 truncate">{subtitle}</p>
        )}
      </div>

      {rightAction && (
        <div className="flex-shrink-0">{rightAction}</div>
      )}
    </header>
  );
}

// ── Back Button ───────────────────────────────────────────
export function BackButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick ?? (() => history.back())}
      className="btn-icon btn-ghost"
      aria-label="Go back"
    >
      <ChevronLeftIcon />
    </button>
  );
}

// ── Bottom Navigation ─────────────────────────────────────
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home',    icon: HomeIcon    },
  { to: '/plan',      label: 'Plan',    icon: CalendarIcon },
  { to: '/history',   label: 'History', icon: ChartIcon   },
  { to: '/profile',   label: 'Profile', icon: UserIcon    },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-sticky pb-safe
                 bg-zinc-950/95 border-t border-zinc-800/60"
      style={{ backdropFilter: 'blur(16px)' }}
      aria-label="Main navigation"
    >
      <div className="flex items-center px-2 h-16">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`nav-tab ${active ? 'nav-tab-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${active ? 'text-orange-500' : 'text-zinc-600'}`}
                aria-hidden="true"
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ── Page Wrapper ──────────────────────────────────────────
interface PageProps {
  children: React.ReactNode;
  className?: string;
  noBottomPad?: boolean;
}

export function Page({ children, className = '', noBottomPad = false }: PageProps) {
  return (
    <main
      className={`
        flex-1 min-h-dvh
        ${noBottomPad ? '' : 'pb-24'}
        ${className}
      `}
    >
      {children}
    </main>
  );
}

// ── Section ───────────────────────────────────────────────
export function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`px-4 py-4 ${className}`}>
      {children}
    </section>
  );
}

// ── App Shell ─────────────────────────────────────────────
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh bg-zinc-950">
      {children}
      <BottomNav />
    </div>
  );
}

// ── Orange Accent Line (decorative) ──────────────────────
export function AccentLine() {
  return (
    <div
      className="h-0.5 rounded-full bg-gradient-orange"
      style={{ boxShadow: '0 0 8px rgba(242,100,25,0.5)' }}
    />
  );
}

// ── Icon set (inline SVG, no external dep) ───────────────
function HomeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function CalendarIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function ChartIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}

function UserIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function ChevronLeftIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}
