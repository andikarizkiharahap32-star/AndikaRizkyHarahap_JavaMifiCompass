/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="night"]'],
  theme: {
    extend: {
      spacing: {
        13: '3.25rem', // 52px transit form inputs and CTAs per DESIGN.md
      },
      colors: {
        surface: 'var(--color-surface)',
        'surface-dim': 'var(--color-surface-dim)',
        'surface-bright': 'var(--color-surface-bright)',
        'surface-container-lowest': 'var(--color-surface-container-lowest)',
        'surface-container-low': 'var(--color-surface-container-low)',
        'surface-container': 'var(--color-surface-container)',
        'surface-container-high': 'var(--color-surface-container-high)',
        'surface-container-highest': 'var(--color-surface-container-highest)',
        'on-surface': 'var(--color-on-surface)',
        'on-surface-variant': 'var(--color-on-surface-variant)',
        'inverse-surface': 'var(--color-inverse-surface)',
        'inverse-on-surface': 'var(--color-inverse-on-surface)',
        outline: 'var(--color-outline)',
        'outline-variant': 'var(--color-outline-variant)',
        'surface-tint': 'var(--color-surface-tint)',

        primary: 'var(--color-primary)',
        'on-primary': 'var(--color-on-primary)',
        'primary-container': 'var(--color-primary-container)',
        'on-primary-container': 'var(--color-on-primary-container)',
        'inverse-primary': 'var(--color-inverse-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'primary-pressed': 'var(--color-primary-pressed)',

        secondary: 'var(--color-secondary)',
        'on-secondary': 'var(--color-on-secondary)',
        'secondary-container': 'var(--color-secondary-container)',
        'on-secondary-container': 'var(--color-on-secondary-container)',
        tertiary: 'var(--color-tertiary)',
        'on-tertiary': 'var(--color-on-tertiary)',
        'tertiary-container': 'var(--color-tertiary-container)',
        'on-tertiary-container': 'var(--color-on-tertiary-container)',

        error: 'var(--color-error)',
        'on-error': 'var(--color-on-error)',
        'error-container': 'var(--color-error-container)',
        'on-error-container': 'var(--color-on-error-container)',
        success: 'var(--color-success)',
        'success-surface': 'var(--color-success-surface)',
        warning: 'var(--color-warning)',
        'warning-surface': 'var(--color-warning-surface)',
        danger: 'var(--color-danger)',
        'danger-surface': 'var(--color-danger-surface)',

        background: 'var(--color-background)',
        'on-background': 'var(--color-on-background)',
        'surface-variant': 'var(--color-surface-variant)',

        paper: 'var(--color-paper)',
        'paper-edge': 'var(--color-paper-edge)',
        sunken: 'var(--color-sunken)',
        selection: 'var(--color-selection)',
        scrim: 'var(--color-scrim)',

        'line-wifi': 'var(--color-line-wifi)',
        'line-wifi-stroke': 'var(--color-line-wifi-stroke)',
        'line-esim': 'var(--color-line-esim)',
        'line-esim-stroke': 'var(--color-line-esim-stroke)',
        'line-sim': 'var(--color-line-sim)',
        'line-sim-stroke': 'var(--color-line-sim-stroke)',
        'line-pro': 'var(--color-line-pro)',

        'night-ground': 'var(--color-night-ground)',
        'night-raised': 'var(--color-night-raised)',
        'night-edge': 'var(--color-night-edge)',
        'night-ink': 'var(--color-night-ink)',
        'night-ink-soft': 'var(--color-night-ink-soft)',
      },
      fontFamily: {
        'display-xl': ['Barlow Condensed', 'sans-serif'],
        'display-lg': ['Barlow Condensed', 'sans-serif'],
        'display-md': ['Barlow Condensed', 'sans-serif'],
        headline: ['Barlow Condensed', 'sans-serif'],
        'numeric-xl': ['Barlow Condensed', 'sans-serif'],
        'numeric-md': ['Barlow Condensed', 'sans-serif'],
        'bullet-letter': ['Barlow Condensed', 'sans-serif'],
        title: ['Plus Jakarta Sans', 'sans-serif'],
        'body-lg': ['Plus Jakarta Sans', 'sans-serif'],
        'body-md': ['Plus Jakarta Sans', 'sans-serif'],
        'body-sm': ['Plus Jakarta Sans', 'sans-serif'],
        'label-lg': ['Plus Jakarta Sans', 'sans-serif'],
        'label-md': ['Plus Jakarta Sans', 'sans-serif'],
        'label-sm': ['Plus Jakarta Sans', 'sans-serif'],
        'code-md': ['JetBrains Mono', 'monospace'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.25rem', // 4px paper
        sm: '0.125rem', // 2px segment
        md: '0.375rem', // 6px field
        lg: '0.5rem',
        xl: '0.625rem', // 10px button
        '2xl': '1.25rem', // 20px sheet
        full: '9999px', // pill
      },
    },
  },
  plugins: [],
};
