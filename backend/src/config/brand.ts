export const BRAND = {
  colors: {
    darkBg: '#0B0B14',
    lightBg: '#F6F5F3',
    primaryGradient: 'linear-gradient(135deg, #7C3AED, #22D3EE)',
    craftAccent: '#F59E0B',
    textOnDark: '#F6F5F3',
    textOnDarkMuted: '#94A3B8',
    textOnLight: '#111114',
    violet: '#7C3AED',
    cyan: '#22D3EE',
    amber: '#F59E0B',
  },
  fonts: {
    heading: '"Clash Display", sans-serif',
    body: '"Satoshi", sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  borderRadius: {
    sm: '12px',
    md: '16px',
    lg: '24px',
  },
} as const;

export const BRAND_CSS_VARS = {
  '--color-dark-bg': BRAND.colors.darkBg,
  '--color-light-bg': BRAND.colors.lightBg,
  '--color-primary-gradient': BRAND.colors.primaryGradient,
  '--color-craft-accent': BRAND.colors.craftAccent,
  '--color-text-on-dark': BRAND.colors.textOnDark,
  '--color-text-on-dark-muted': BRAND.colors.textOnDarkMuted,
  '--color-text-on-light': BRAND.colors.textOnLight,
  '--font-heading': BRAND.fonts.heading,
  '--font-body': BRAND.fonts.body,
  '--font-mono': BRAND.fonts.mono,
  '--radius-sm': BRAND.borderRadius.sm,
  '--radius-md': BRAND.borderRadius.md,
  '--radius-lg': BRAND.borderRadius.lg,
};
