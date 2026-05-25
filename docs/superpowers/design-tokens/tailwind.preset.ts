/**
 * Gymify AI — Tailwind preset
 *
 * Import in `packages/frontend/tailwind.config.ts`:
 *
 *   import preset from '../../docs/superpowers/design-tokens/tailwind.preset';
 *   export default {
 *     presets: [preset],
 *     content: ['./index.html', './src/**\/*.{ts,tsx}'],
 *   } satisfies Config;
 *
 * Mirrors the CSS custom properties in `tokens.css`.
 * Spec: ../specs/2026-05-19-gymify-ai-ui-design.md
 */

import type { Config } from 'tailwindcss';

const preset: Partial<Config> = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base:     '#0F1115',
          elevated: '#1A1D24',
          raised:   '#2A2D35',
        },
        border: {
          subtle: '#2A2D35',
        },
        accent: {
          DEFAULT: '#FF6B35',
          400:     '#FF8559',
          500:     '#FF6B35',
          tint:    'rgba(255,107,53,0.10)',
          ring:    'rgba(255,107,53,0.25)',
        },
        text: {
          primary:   '#FFFFFF',
          secondary: '#9CA3AF',
          tertiary:  '#6B7280',
          disabled:  '#4A4D55',
          onAccent:  '#0F1115',
        },
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      fontSize: {
        // [size, { lineHeight, letterSpacing, fontWeight }]
        'nano':     ['9px',  { lineHeight: '1.2',  letterSpacing: '0.8px', fontWeight: '700' }],
        'micro':    ['10px', { lineHeight: '1.2',  letterSpacing: '1.4px', fontWeight: '700' }],
        'label':    ['11px', { lineHeight: '1.2',  letterSpacing: '1.3px', fontWeight: '700' }],
        'caption':  ['12px', { lineHeight: '1.4',  letterSpacing: '0',     fontWeight: '600' }],
        'body-xs':  ['13px', { lineHeight: '1.45', letterSpacing: '0',     fontWeight: '600' }],
        'body-s':   ['14px', { lineHeight: '1.45', letterSpacing: '0',     fontWeight: '700' }],
        'body-m':   ['15px', { lineHeight: '1.5',  letterSpacing: '-0.3px', fontWeight: '700' }],
        'title-s':  ['17px', { lineHeight: '1.25', letterSpacing: '-0.4px', fontWeight: '800' }],
        'title-m':  ['20px', { lineHeight: '1.2',  letterSpacing: '-0.5px', fontWeight: '800' }],
        'title-l':  ['22px', { lineHeight: '1.2',  letterSpacing: '-0.5px', fontWeight: '800' }],
        'display':  ['26px', { lineHeight: '1.15', letterSpacing: '-0.6px', fontWeight: '800' }],
      },
      spacing: {
        // Touch target shorthand
        'touch': '44px',
      },
      borderRadius: {
        'xs':   '8px',
        'sm':   '10px',
        'md':   '14px',
        'lg':   '16px',
        'xl':   '18px',
        '2xl':  '22px',
        '3xl':  '24px',
        'pill': '999px',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #FF8559 0%, #FF6B35 100%)',
        'gradient-bar':    'linear-gradient(180deg, rgba(255,107,53,0.6), rgba(255,107,53,0.15))',
        'gradient-fill':   'linear-gradient(90deg, #FF8559, #FF6B35)',
      },
      boxShadow: {
        'cta':         '0 8px 24px rgba(255, 107, 53, 0.28)',
        'cta-strong':  '0 8px 24px rgba(255, 107, 53, 0.32)',
        'icon':        '0 10px 24px rgba(255, 107, 53, 0.45)',
        'card':        '0 16px 48px rgba(0, 0, 0, 0.50)',
        'ring-accent': '0 0 0 4px rgba(255, 107, 53, 0.10)',
      },
      transitionDuration: {
        'fast': '120ms',
        'base': '200ms',
        'slow': '400ms',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
      },
      backdropBlur: {
        'nav': '20px',
      },
      maxWidth: {
        'phone': '390px',
      },
      zIndex: {
        'sticky':  '10',
        'overlay': '20',
        'modal':   '30',
        'toast':   '40',
      },
    },
  },
};

export default preset;
