/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0F1117',
        surface: '#1A1D27',
        border: '#2A2D37',
        textPrimary: '#F9FAFB',
        textSecondary: '#9CA3AF',
        stageGreen: '#10B981',
        stageBlue: '#3B82F6',
        stageAmber: '#F59E0B',
        stageRed: '#EF4444',
        stageGray: '#6B7280',
        brand: '#6366F1'
      },
      boxShadow: {
        panel: '0 10px 24px rgba(0,0,0,0.32)'
      }
    }
  },
  plugins: []
}
