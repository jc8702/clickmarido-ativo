/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#F3EBFF',
          100: '#E9D5FF',
          200: '#D8B4FE',
          400: '#9F7AEA',
          500: '#9F7AEA',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5D3FD3',
          900: '#4C1D95',
        },
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          400: '#6EE7B7',
          500: '#6EE7B7',
          600: '#10B981',
          700: '#059669',
          800: '#047857',
          900: '#064E3B',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          400: '#FCD34D',
          500: '#FCD34D',
          600: '#F59E0B',
          700: '#D97706',
          800: '#B45309',
          900: '#78350F',
        },
        neutral: {
          0: '#FFFFFF',
          50: '#F8F9FA',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #5D3FD3 0%, #10B981 100%)',
        'gradient-subtle': 'linear-gradient(180deg, #F3EBFF 0%, #FFFBEB 100%)',
        'gradient-accent': 'linear-gradient(90deg, #10B981 0%, #F59E0B 100%)',
        'gradient-dark': 'linear-gradient(135deg, #5D3FD3 0%, #059669 100%)',
        'gradient-warning': 'linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
      },
    },
  },
  plugins: [],
};
