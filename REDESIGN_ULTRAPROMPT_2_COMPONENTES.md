# 🎯 ULTRAPROMPT 2: COMPONENTES BASE MODERNIZADOS

**Executor:** DeepSeek V4 Flash ou Gemini  
**Tempo estimado:** 50-60 minutos  
**Saída esperada:** 8 componentes React refatorados + Storybook stories

---

## 📋 CONTEXTO

Tu és um **React Component Engineer sênior** especializado em:
- Componentes reutilizáveis de alta qualidade
- Padrões de composição (compound components)
- Acessibilidade (ARIA, keyboard nav)
- Performance (React.memo, useMemo)
- Animações com Tailwind + CSS

**Objectivo:** Refatorar 8 componentes core que vão ser usados em toda a aplicação.

**Design System de Referência (Já criado):**
- Paleta: Roxo, Verde, Laranja
- Gradientes: hero, subtle, accent, dark, warning
- Animações: fade-in, slide-down/up, scale-in
- Transitions: fast (150ms), base (300ms), slow (500ms)

---

## ✅ MISSÃO

### COMPONENTE 1: Button (Refatorado)

**Arquivo:** `frontend/components/Button.tsx`

```typescript
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Base classes
  `
    inline-flex items-center justify-center gap-sm
    rounded-md font-semibold text-sm
    transition-all duration-300 ease-in-out
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-95
  `,
  {
    variants: {
      variant: {
        // Primário - Roxo com Gradiente
        primary: `
          bg-gradient-hero text-white
          hover:shadow-lg hover:scale-105
          active:scale-95
          focus-visible:ring-primary-600
        `,
        // Secundário - Verde
        secondary: `
          bg-success-600 text-white
          hover:bg-success-700 hover:shadow-md
          active:scale-95
          focus-visible:ring-success-600
        `,
        // Terciário - Outline
        outline: `
          border-2 border-primary-600 text-primary-600
          hover:bg-primary-50
          active:bg-primary-100
          focus-visible:ring-primary-600
        `,
        // Danger - Laranja/Vermelho
        danger: `
          bg-warning-600 text-white
          hover:bg-warning-700 hover:shadow-md
          focus-visible:ring-warning-600
        `,
        // Ghost - Sem fundo
        ghost: `
          text-primary-600
          hover:bg-primary-50
          focus-visible:ring-primary-600
        `,
      },
      size: {
        xs: 'px-sm py-xs text-xs',
        sm: 'px-md py-sm text-sm',
        md: 'px-lg py-md text-base',
        lg: 'px-xl py-lg text-lg',
        xl: 'px-2xl py-xl text-xl',
      },
      fullWidth: {
        true: 'w-full',
      },
      loading: {
        true: 'disabled opacity-75',
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
  (
    { 
      variant, 
      size, 
      fullWidth, 
      isLoading, 
      icon, 
      children, 
      className,
      disabled,
      ...props 
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={buttonVariants({ variant, size, fullWidth, loading: isLoading, className })}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
```

---

### COMPONENTE 2: Card (Refatorado)

**Arquivo:** `frontend/components/Card.tsx`

```typescript
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
          rounded-lg p-lg
          ${bgClass}
          ${shadowClass}
          ${interactive ? 'cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-102' : ''}
          ${className}
        `}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

// Compound Components
export function CardHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`border-b border-neutral-200 pb-md mb-md ${className}`} {...props} />;
}

export function CardTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`h3 text-neutral-900 ${className}`} {...props} />;
}

export function CardDescription({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm text-neutral-600 ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`space-y-md ${className}`} {...props} />;
}

export function CardFooter({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex gap-md justify-end border-t border-neutral-200 pt-md mt-lg ${className}`} {...props} />;
}

export { Card };
```

---

### COMPONENTE 3: Input (Refatorado)

**Arquivo:** `frontend/components/Input.tsx`

```typescript
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
          <label htmlFor={inputId} className="block text-sm font-medium text-neutral-900 mb-sm">
            {label}
            {required && <span className="text-warning-600 ml-xs">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && <div className="absolute left-md top-1/2 transform -translate-y-1/2 text-neutral-500">{icon}</div>}

          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-md py-sm rounded-md
              border-2 transition-all duration-200
              ${icon ? 'pl-2xl' : ''}
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

        {error && <p className="text-xs text-warning-600 mt-sm">{error}</p>}
        {helperText && !error && <p className="text-xs text-neutral-600 mt-sm">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export { Input };
```

---

### COMPONENTE 4: Badge (Novo)

**Arquivo:** `frontend/components/Badge.tsx`

```typescript
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center gap-xs px-md py-xs rounded-full text-xs font-semibold transition-all duration-200',
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
        sm: 'text-xs px-sm py-xs',
        md: 'text-sm px-md py-sm',
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
          className="ml-xs flex-shrink-0 hover:opacity-70 transition-opacity"
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
```

---

### COMPONENTE 5: Modal/Dialog (Refatorado)

**Arquivo:** `frontend/components/Modal.tsx`

```typescript
import React from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-modal">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div className="relative flex items-center justify-center min-h-screen p-lg">
        <div
          className={`
            bg-white rounded-xl shadow-2xl
            ${sizeMap[size]} w-full
            animate-scale-in
            max-h-[90vh] overflow-y-auto
          `}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between border-b border-neutral-200 p-lg">
              <h2 className="h3 text-neutral-900">{title}</h2>
              <button
                onClick={onClose}
                className="text-neutral-500 hover:text-neutral-700 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-lg">{children}</div>

          {/* Footer */}
          {footer && <div className="border-t border-neutral-200 p-lg bg-neutral-50">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body
  );
}
```

---

### COMPONENTE 6: Notification/Toast (Novo)

**Arquivo:** `frontend/components/Toast.tsx`

```typescript
import React from 'react';

export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose: () => void;
}

export function Toast({ type, title, message, onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colorMap = {
    success: 'bg-success-50 border-success-200 text-success-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-warning-50 border-warning-200 text-warning-900',
    info: 'bg-primary-50 border-primary-200 text-primary-900',
  };

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={`
        flex gap-md p-lg rounded-lg border-l-4 border
        ${colorMap[type]}
        animate-slide-down shadow-lg
      `}
    >
      <div className="text-xl font-bold flex-shrink-0">{iconMap[type]}</div>
      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
        {message && <p className="text-sm mt-xs opacity-75">{message}</p>}
      </div>
      <button onClick={onClose} className="text-lg opacity-50 hover:opacity-100 transition-opacity">
        ✕
      </button>
    </div>
  );
}
```

---

### COMPONENTE 7: Navigation (Refatorado)

**Arquivo:** `frontend/components/Navigation.tsx`

```typescript
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavLink {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export interface NavigationProps {
  links: NavLink[];
  logo?: React.ReactNode;
  user?: { name: string; email: string };
  onLogout?: () => void;
}

export function Navigation({ links, logo, user, onLogout }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="bg-gradient-dark text-white sticky top-0 z-fixed shadow-lg">
      <div className="max-w-7xl mx-auto px-lg">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-md">{logo}</div>

          {/* Nav Links */}
          <div className="hidden md:flex gap-lg">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-sm px-md py-sm rounded-md
                    transition-all duration-300
                    ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}
                  `}
                >
                  {link.icon && <span>{link.icon}</span>}
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          {user && (
            <div className="flex items-center gap-md">
              <div className="text-sm">
                <div className="font-semibold">{user.name}</div>
                <div className="opacity-75">{user.email}</div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-md py-sm rounded-md bg-white/20 hover:bg-white/30 transition-colors"
                >
                  Sair
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
```

---

### COMPONENTE 8: Tabela (Refatorado)

**Arquivo:** `frontend/components/Table.tsx`

```typescript
import React from 'react';

export function Table({ className = '', ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className={`w-full text-sm ${className}`} {...props} />
    </div>
  );
}

export function TableHead({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`bg-gradient-subtle border-b-2 border-neutral-200 ${className}`} {...props} />
  );
}

export function TableRow({ className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`
        border-b border-neutral-200 hover:bg-neutral-50
        transition-colors duration-150
        ${className}
      `}
      {...props}
    />
  );
}

export function TableCell({ className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-lg py-md text-neutral-700 ${className}`} {...props} />;
}

export function TableHeader({ className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`
        px-lg py-md text-left font-semibold text-neutral-900
        bg-neutral-100/50
        ${className}
      `}
      {...props}
    />
  );
}
```

---

## ✅ CHECKLIST DE CONCLUSÃO

- [ ] Button com 5 variantes (primary, secondary, outline, danger, ghost)
- [ ] Card com compound components (Header, Title, Content, Footer)
- [ ] Input com label, error, helperText, icon
- [ ] Badge com variant, size, onRemove
- [ ] Modal/Dialog com animações
- [ ] Toast notifications
- [ ] Navigation bar com active states
- [ ] Table com hover states
- [ ] Todos componentes com TypeScript types
- [ ] Animações testadas (fade-in, scale-in, slide-down)
- [ ] Acessibilidade (aria-labels, keyboard nav)
- [ ] Dark mode ready (usar design tokens)

---

**Quando completo, próximo passo:** ULTRAPROMPT 3: Layout + Navigation Redesenhada

---

**✨ COMPONENTES MODERNIZADOS. PRONTOS PARA USAR.**
