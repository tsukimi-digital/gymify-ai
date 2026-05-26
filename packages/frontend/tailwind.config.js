/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand
        orange: {
          DEFAULT: '#F26419',
          50:  '#FFF2EB',
          100: '#FFE0CC',
          200: '#FFC299',
          300: '#FF9F5C',
          400: '#F97C2E',
          500: '#F26419',  // primary
          600: '#D94E08',
          700: '#B03E05',
          800: '#8A3004',
          900: '#5C1F02',
        },
        // Neutral (dark-first)
        zinc: {
          950: '#0A0A0A',
          900: '#111111',
          850: '#161616',
          800: '#1E1E1E',
          750: '#252525',
          700: '#2E2E2E',
          600: '#3D3D3D',
          500: '#555555',
          400: '#7A7A7A',
          300: '#A3A3A3',
          200: '#C8C8C8',
          100: '#E8E8E8',
          50:  '#F5F5F5',
        },
        // Semantic
        success: '#22C55E',
        warning: '#EAB308',
        danger:  '#EF4444',
        info:    '#3B82F6',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-orange': '0 0 20px 0 rgba(242, 100, 25, 0.35)',
        'glow-sm':     '0 0 8px 0 rgba(242, 100, 25, 0.25)',
        'card':        '0 4px 24px 0 rgba(0,0,0,0.45)',
        'card-hover':  '0 8px 32px 0 rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'gradient-radial':     'radial-gradient(var(--tw-gradient-stops))',
        'gradient-orange':     'linear-gradient(135deg, #F26419 0%, #D94E08 100%)',
        'gradient-dark':       'linear-gradient(180deg, #111111 0%, #0A0A0A 100%)',
        'noise':               "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-up':    'fadeUp 0.4s ease forwards',
        'fade-in':    'fadeIn 0.3s ease forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':  'spin 3s linear infinite',
        'progress':   'progress 0.6s ease',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        progress: {
          '0%':   { width: '0%' },
        },
      },
    },
  },
  plugins: [],
};
