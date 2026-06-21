import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  label?: string;
  required?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, helperText, icon, label, required, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-neutral-900 mb-1">
            {label}
            {required && <span className="text-warning-600 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">{icon}</div>}

          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-2 rounded-md
              border-2 transition-all duration-200
              ${icon ? 'pl-10' : ''}
              ${
                error
                  ? 'border-warning-500 focus:border-warning-600 focus:ring-warning-100'
                  : 'border-neutral-300 focus:border-primary-600 focus:ring-primary-100'
              }
              focus:outline-none focus:ring-4
              disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50
              placeholder:text-neutral-500
              ${className}
            `}
            {...props}
          />
        </div>

        {error && <p className="text-xs text-warning-600 mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-neutral-600 mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export { Input };
export default Input;
