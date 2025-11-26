// Design System Tokens
export const tokens = {
  // Spacing Scale (8px base)
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem', // 64px
  },

  // Typography Scale
  typography: {
    sizes: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '2rem', // 32px
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Glass/Card System
  glass: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    blur: 'blur(10px)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  },

  // Brand Colors (extend your existing theme)
  colors: {
    primary: {
      50: '#f0f9ff',
      500: '#3b82f6',
      600: '#2563eb',
      900: '#1e3a8a',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },

  // Border radius scale
  radii: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    full: '9999px',
  },

  // Motion tokens
  motion: {
    durations: {
      fast: 0.18,
      normal: 0.35,
      slow: 0.6,
    },
    easings: {
      standard: [0.4, 0, 0.2, 1] as [number, number, number, number],
      emphasized: [0.34, 1.56, 0.64, 1],
      entrance: [0.16, 1, 0.3, 1],
    },
    spring: {
      stiffness: 220,
      damping: 24,
      mass: 0.9,
    },
    offsets: {
      sm: 8,
      md: 16,
      lg: 32,
    },
  },
} as const;
