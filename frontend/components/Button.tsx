import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  `
    inline-flex items-center justify-center gap-2
    rounded-md font-semibold text-sm
    transition-all duration-300 ease-in-out
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-95
  `,
  {
    variants: {
      variant: {
        primary: `
          bg-gradient-hero text-white
          hover:shadow-lg hover:scale-105
          active:scale-95
          focus-visible:ring-primary-600
        `,
        secondary: `
          bg-success-600 text-white
          hover:bg-success-700 hover:shadow-md
          active:scale-95
          focus-visible:ring-success-600
        `,
        outline: `
          border-2 border-primary-600 text-primary-600
          hover:bg-primary-50
          active:bg-primary-100
          focus-visible:ring-primary-600
        `,
        danger: `
          bg-warning-600 text-white
          hover:bg-warning-700 hover:shadow-md
          focus-visible:ring-warning-600
        `,
        ghost: `
          text-primary-600
          hover:bg-primary-50
          focus-visible:ring-primary-600
        `,
      },
      size: {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
        xl: 'px-8 py-4 text-xl',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant,
    size,
    fullWidth,
    isLoading,
    icon,
    children,
    className,
    disabled,
    ...props
  }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={buttonVariants({ variant, size, fullWidth, className })}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Carregando...
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  )
);

Button.displayName = 'Button';
export { Button, buttonVariants };
export default Button;
