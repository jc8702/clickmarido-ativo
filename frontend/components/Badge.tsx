import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-all duration-200',
  {
    variants: {
      variant: {
        primary: 'bg-primary-50 text-primary-700 border border-primary-200',
        success: 'bg-success-50 text-success-700 border border-success-200',
        warning: 'bg-warning-50 text-warning-700 border border-warning-200',
        danger: 'bg-red-50 text-red-700 border border-red-200',
        neutral: 'bg-neutral-100 text-neutral-700 border border-neutral-300',
      },
      size: {
        sm: 'text-xs px-1.5 py-0.5',
        md: 'text-sm px-2 py-1',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  onRemove?: () => void;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant, size, icon, onRemove, children, className, ...props }, ref) => (
    <span ref={ref} className={badgeVariants({ variant, size, className })} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Remove"
        >
          ✕
        </button>
      )}
    </span>
  )
);

Badge.displayName = 'Badge';
export { Badge, badgeVariants };
