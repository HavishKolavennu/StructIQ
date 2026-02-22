/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Archivo', 'DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Construction palette — cream-dominant, amber accent
        bg: '#F8F6F1',
        surface: '#FFFDF9',
        'surface-subtle': '#F5F2EB',
        border: '#E8E4DC',
        'border-subtle': '#EFEBE3',
        muted: '#6B6560',
        'text-primary': '#2C2825',
        'text-secondary': '#4A4540',
        'text-muted': '#6B6560',
        accent: '#F59E0B',
        'accent-hover': '#D97706',
        'accent-muted': '#FBBF24',
        // Stage colors (unchanged semantics)
        stage: {
          gray: '#64748B',
          amber: '#F59E0B',
          blue: '#3B82F6',
          green: '#10B981',
          red: '#EF4444',
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 6px -2px rgba(0,0,0,0.04)',
        'elevated': '0 10px 40px -10px rgba(0,0,0,0.08)',
      },
      animation: {
        'spin-slow': 'spin 1.2s linear infinite',
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
