import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: 'subtle' | 'none';
  shadow?: 'sm' | 'md' | 'lg' | 'none';
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ gradient = 'subtle', shadow = 'md', interactive = false, className = '', ...props }, ref) => {
    const bgClass = gradient === 'subtle' ? 'bg-gradient-subtle' : 'bg-white';
    const shadowClass = {
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      none: '',
    }[shadow];

    return (
      <div
        ref={ref}
        className={`
          rounded-lg p-6
          ${bgClass}
          ${shadowClass}
          ${interactive ? 'cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]' : ''}
          ${className}
        `}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export function CardHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`border-b border-neutral-200 pb-4 mb-4 ${className}`} {...props} />;
}

export function CardTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-xl font-semibold text-neutral-900 ${className}`} {...props} />;
}

export function CardDescription({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm text-neutral-600 ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`space-y-4 ${className}`} {...props} />;
}

export function CardFooter({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex gap-4 justify-end border-t border-neutral-200 pt-4 mt-6 ${className}`} {...props} />;
}

export { Card };
