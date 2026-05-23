/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
          light: '#3b82f6',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
        },
        navy: {
          DEFAULT: '#0f172a',
          mid: '#1e293b',
          light: '#334155',
        },
        surface: '#f8fafc',
        border: '#e2e8f0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)',
        'card-hover': '0 8px 32px rgba(37,99,235,0.15), 0 2px 8px rgba(0,0,0,0.08)',
        btn: '0 4px 14px rgba(37,99,235,0.35)',
        'btn-lg': '0 6px 20px rgba(37,99,235,0.4)',
        nav: '0 1px 0 rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #f5f3ff 100%)',
        'brand-gradient': 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
        'card-gradient': 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
