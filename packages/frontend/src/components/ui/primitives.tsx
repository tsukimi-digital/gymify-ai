// ═══════════════════════════════════════════════════════════
// GYMIFY AI — UI Primitives
// ═══════════════════════════════════════════════════════════
import React from 'react';

// ── Button ────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize    = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, className = '', ...props }, ref) => {
    const variantClass = {
      primary:   'btn-primary',
      secondary: 'btn-secondary',
      ghost:     'btn-ghost',
      danger:    'btn-danger',
    }[variant];

    const sizeClass = {
      sm:   'btn-sm',
      md:   '',
      lg:   'btn-lg',
      icon: 'btn-icon',
    }[size];

    return (
      <button
        ref={ref}
        className={`btn ${variantClass} ${sizeClass} ${className}`}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ── Spinner ───────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' }[size];
  return (
    <svg className={`animate-spin ${sizeClass}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Card ──────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'orange';
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export function Card({ variant = 'default', padding = 'md', className = '', children, ...props }: CardProps) {
  const variantClass = {
    default:     'card',
    interactive: 'card-interactive cursor-pointer',
    orange:      'card-orange',
  }[variant];

  const padClass = {
    none: '',
    sm:   'p-3',
    md:   'p-4',
    lg:   'p-6',
  }[padding];

  return (
    <div className={`${variantClass} ${padClass} ${className}`} {...props}>
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────
type BadgeColor = 'orange' | 'green' | 'red' | 'gray' | 'yellow';

export function Badge({ color = 'gray', children }: { color?: BadgeColor; children: React.ReactNode }) {
  const colorClass = {
    orange: 'badge-orange',
    green:  'badge-green',
    red:    'badge-red',
    gray:   'badge-gray',
    yellow: 'badge-yellow',
  }[color];

  return <span className={`badge ${colorClass}`}>{children}</span>;
}

// ── Input ─────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'md' | 'lg';
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function Input({
  label, error, hint, size = 'md', leftElement, rightElement,
  className = '', id, ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="label">{label}</label>}
      <div className="relative flex items-center">
        {leftElement && (
          <span className="absolute left-3 text-zinc-500 pointer-events-none">{leftElement}</span>
        )}
        <input
          id={inputId}
          className={`
            ${size === 'lg' ? 'input-lg' : 'input'}
            ${leftElement  ? 'pl-10' : ''}
            ${rightElement ? 'pr-10' : ''}
            ${error ? 'input-error' : ''}
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {rightElement && (
          <span className="absolute right-3 text-zinc-500">{rightElement}</span>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="field-error" role="alert">
          <ErrorIcon />
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-xs text-zinc-500 mt-1.5">{hint}</p>
      )}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────
export function ProgressBar({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-zinc-400">{label}</span>
          <span className="text-xs font-semibold text-orange-400">{pct}%</span>
        </div>
      )}
      <div className="progress-bar" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Stepper ───────────────────────────────────────────────
interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  label?: string;
}

export function Stepper({ value, onChange, step = 1, min, max, unit, label }: StepperProps) {
  const dec = () => { if (min === undefined || value - step >= min) onChange(+(value - step).toFixed(2)); };
  const inc = () => { if (max === undefined || value + step <= max) onChange(+(value + step).toFixed(2)); };

  return (
    <div className="flex flex-col items-center gap-1">
      {label && <span className="text-label text-2xs">{label}</span>}
      <div className="flex items-center gap-2">
        <button onClick={dec} className="stepper-btn" aria-label={`Decrease ${label}`}>−</button>
        <div className="text-center min-w-[4.5rem]">
          <span className="font-display text-2xl font-bold text-zinc-100">{value}</span>
          {unit && <span className="text-xs text-zinc-500 ml-0.5">{unit}</span>}
        </div>
        <button onClick={inc} className="stepper-btn" aria-label={`Increase ${label}`}>+</button>
      </div>
    </div>
  );
}

// ── RPE Selector ──────────────────────────────────────────
const RPE_VALUES = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10];

export function RPESelector({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-label text-2xs">RPE</span>
      <div className="flex gap-1.5 flex-wrap">
        {RPE_VALUES.map((rpe) => (
          <button
            key={rpe}
            onClick={() => onChange(rpe)}
            className={`rpe-chip ${value === rpe ? 'rpe-chip-active' : ''}`}
            aria-label={`RPE ${rpe}`}
            aria-pressed={value === rpe}
          >
            {rpe}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Status Dot ────────────────────────────────────────────
type SessionStatus = 'completed' | 'scheduled' | 'skipped' | 'active';

export function StatusDot({ status }: { status: SessionStatus }) {
  return <span className={`status-dot status-dot-${status}`} aria-hidden="true" />;
}

// ── Skeleton ──────────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

// ── Section Label ─────────────────────────────────────────
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="section-label">{children}</div>;
}

// ── Divider ───────────────────────────────────────────────
export function Divider({ orange = false }: { orange?: boolean }) {
  return <hr className={orange ? 'divider-orange' : 'divider'} />;
}

// ── Internal icon helpers ──────────────────────────────────
function ErrorIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1" fill="none"/>
      <path d="M6 3.5v3M6 8.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
