export const designTokens = {
  colors: {
    primary: {
      900: '#4C1D95',
      800: '#5D3FD3',
      700: '#6D28D9',
      600: '#7C3AED',
      500: '#9F7AEA',
      400: '#D8B4FE',
      50: '#F3EBFF',
    },
    success: {
      900: '#064E3B',
      800: '#047857',
      700: '#059669',
      600: '#10B981',
      500: '#6EE7B7',
      50: '#ECFDF5',
    },
    warning: {
      900: '#78350F',
      800: '#B45309',
      700: '#D97706',
      600: '#F59E0B',
      500: '#FCD34D',
      50: '#FFFBEB',
    },
    neutral: {
      900: '#111827',
      800: '#1F2937',
      700: '#374151',
      600: '#4B5563',
      500: '#6B7280',
      400: '#9CA3AF',
      300: '#D1D5DB',
      200: '#E5E7EB',
      100: '#F3F4F6',
      50: '#F8F9FA',
      0: '#FFFFFF',
    },
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '2.5rem',
    '3xl': '3rem',
  },

  typography: {
    h1: { fontSize: '2.5rem', lineHeight: '3rem', fontWeight: 700, letterSpacing: '-0.5px' },
    h2: { fontSize: '2rem', lineHeight: '2.5rem', fontWeight: 700, letterSpacing: '-0.25px' },
    h3: { fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 600 },
    h4: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 600 },
    body: { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 400 },
    small: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 400 },
    xs: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 400 },
  },

  borderRadius: {
    none: '0',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.25rem',
    full: '9999px',
  },

  shadow: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.15)',
    inset: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
  },

  transition: {
    fast: 'all 150ms ease-in-out',
    base: 'all 300ms ease-in-out',
    slow: 'all 500ms ease-in-out',
  },

  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    backdrop: 1040,
    offcanvas: 1050,
    modal: 1060,
    popover: 1070,
    tooltip: 1080,
  },
};

export type DesignTokens = typeof designTokens;
