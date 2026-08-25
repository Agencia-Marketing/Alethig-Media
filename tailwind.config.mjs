import { colors, fonts } from './src/config/theme.mjs';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors,
      fontFamily: {
        display: [fonts.display],
        body:    [fonts.body],
      },
      fontSize: {
        'display-hero':        ['72px', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '800' }],
        // Intermediate tier for the 768–1279px range (Tailwind's md through
        // lg, before xl kicks in at 1280px — matching the container's own
        // max-w-container-max, where the two-column grid finally reaches
        // its full 1280px width). Below that, the hero's grid columns stay
        // narrower than 72px needs, and the longest word in either
        // language's headline ("BUSINESSES") overflows into the image
        // column — tested empirically at 768/820/1000/1024/1152/1279px for
        // both locales before picking 46px. See homepage h1 classes.
        'display-hero-tablet':  ['46px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'display-hero-mobile': ['34px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '800' }],
        'headline-lg':         ['48px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg-mobile':  ['30px', { lineHeight: '1.2',  letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-md':         ['24px', { lineHeight: '1.35', fontWeight: '600' }],
        'body-lg':             ['18px', { lineHeight: '1.7' }],
        'body-md':             ['16px', { lineHeight: '1.65' }],
        'label-sm':            ['13px', { lineHeight: '1.4', letterSpacing: '0.07em', fontWeight: '600' }],
      },
      spacing: {
        'gutter': '24px',
        'section-py-lg': '120px',
        'section-py-sm': '64px',
        'container-max': '1280px',
      },
      maxWidth: { 'container-max': '1280px' },
      backdropBlur: { 'xl': '20px', '2xl': '40px' },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring':   'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,240,255,0.2)' },
          '50%':       { boxShadow: '0 0 50px rgba(0,240,255,0.45)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-up':    'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'float':      'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
