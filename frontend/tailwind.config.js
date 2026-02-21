/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        bg:      '#0a0c10',
        surface: '#13151e',
        border:  'rgba(255,255,255,0.07)',
        muted:   '#64748B',
        brand:   '#6366F1',
        stage: {
          gray:  '#4B5563',
          amber: '#F59E0B',
          blue:  '#3B82F6',
          green: '#10B981',
          red:   '#EF4444',
        },
      },
      animation: {
        'spin-slow':    'spin 1.2s linear infinite',
        'pulse-live':   'pulse-live 2s infinite',
        'shimmer':      'shimmer 2s infinite',
        'fade-in':      'fadeIn 0.25s ease-out',
        'slide-up':     'slideUp 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
