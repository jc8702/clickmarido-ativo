export const gradients = {
  hero: 'bg-gradient-hero',
  subtle: 'bg-gradient-subtle',
  accent: 'bg-gradient-accent',
  dark: 'bg-gradient-dark',
  warning: 'bg-gradient-warning',

  heroOpacity: (opacity: number) => `bg-gradient-hero opacity-${opacity}`,

  heroText: 'bg-gradient-hero bg-clip-text text-transparent',
  accentText: 'bg-gradient-accent bg-clip-text text-transparent',
} as const;

export const animations = {
  fadeIn: 'animate-fade-in',
  slideDown: 'animate-slide-down',
  slideUp: 'animate-slide-up',
  scaleIn: 'animate-scale-in',
  bounce: 'animate-bounce-subtle',

  fast: 'transition-all duration-150 ease-in-out',
  base: 'transition-all duration-300 ease-in-out',
  slow: 'transition-all duration-500 ease-in-out',
} as const;

export const shadows = {
  xs: 'shadow-xs',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
} as const;
