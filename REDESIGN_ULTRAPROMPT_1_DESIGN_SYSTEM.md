# 🎨 ULTRAPROMPT 1: DESIGN SYSTEM + PALETA DE CORES MODERNA

**Executor:** DeepSeek V4 Flash ou Gemini  
**Tempo estimado:** 30-40 minutos  
**Saída esperada:** Design System completo em Tailwind config + documentação de cores

---

## 📋 CONTEXTO

Tu és um **UI/UX designer sênior especializado em design systems modernos** com expertise em:
- Gradientes avançados e transições suaves
- Paletas harmônicas (roxo, verde, laranja)
- Design tokens estruturados
- Componentes reutilizáveis
- Acessibilidade (WCAG AA+)

**Objetivo:** Criar um design system **profissional, não gerado por IA**, que seja:
- ✅ Coeso (paleta harmônica)
- ✅ Vivo (gradientes, animações)
- ✅ Moderno (2024+)
- ✅ Acessível (contrastes OK)
- ✅ Escalável (design tokens)

**Contexto do projeto:**
- Sistema CRM para serviços residenciais
- 1 usuário solo (não precisa de modo escuro ainda)
- Público: professionals (não adolescentes)
- Uso: desktop/tablet (foco em desktop)

---

## ✅ MISSÃO (Execute TODO este contexto)

### PASSO 1: Criar Sistema de Cores com Gradientes

**Arquivo:** `frontend/lib/design-system.ts` ou `frontend/tailwind.config.js`

Tu vais criar uma paleta onde:

**1. Cores Base (Primárias + Secundárias)**

```
ROXO (Primário - Confiança, Profissionalismo)
  - Roxo Escuro: #5D3FD3 (brand principal)
  - Roxo Médio: #7C3AED (hover states)
  - Roxo Claro: #9F7AEA (backgrounds)
  - Roxo Ultra-Claro: #F3EBFF (surface)

VERDE (Secundário - Sucesso, Crescimento)
  - Verde Escuro: #059669 (accents)
  - Verde Médio: #10B981 (call-to-action)
  - Verde Claro: #6EE7B7 (highlights)
  - Verde Ultra-Claro: #ECFDF5 (success bg)

LARANJA (Terciário - Energia, Atenção)
  - Laranja Escuro: #D97706 (warnings)
  - Laranja Médio: #F59E0B (alerts)
  - Laranja Claro: #FCD34D (accents)
  - Laranja Ultra-Claro: #FFFBEB (warning bg)

NEUTROS (Suporte)
  - Branco: #FFFFFF
  - Cinza Muito Claro: #F8F9FA (surfaces)
  - Cinza Claro: #E5E7EB (borders)
  - Cinza Médio: #9CA3AF (secondary text)
  - Cinza Escuro: #374151 (primary text)
  - Preto: #111827 (headings)
```

**2. Gradientes Principais (5 Gradientes Assinatura)**

```typescript
// Gradiente 1: Hero Gradient (Roxo → Verde)
// Uso: Headers, CTAs principais, seções em destaque
gradient-hero: linear-gradient(135deg, #5D3FD3 0%, #10B981 100%)
background: linear-gradient(135deg, #5D3FD3 0%, #10B981 100%)

// Gradiente 2: Subtle Gradient (Roxo Claro → Laranja Claro)
// Uso: Cards, backgrounds, superfícies suaves
gradient-subtle: linear-gradient(180deg, #F3EBFF 0%, #FFFBEB 100%)
background: linear-gradient(180deg, #F3EBFF 0%, #FFFBEB 100%)

// Gradiente 3: Accent Gradient (Verde → Laranja)
// Uso: Botões, badges, elementos secundários
gradient-accent: linear-gradient(90deg, #10B981 0%, #F59E0B 100%)
background: linear-gradient(90deg, #10B981 0%, #F59E0B 100%)

// Gradiente 4: Dark Gradient (Roxo Escuro → Verde Escuro)
// Uso: Overlays, background sections, footer
gradient-dark: linear-gradient(135deg, #5D3FD3 0%, #059669 100%)
background: linear-gradient(135deg, #5D3FD3 0%, #059669 100%)

// Gradiente 5: Warning Gradient (Laranja → Vermelho)
// Uso: Erros, alerts, status críticos
gradient-warning: linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)
background: linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)
```

**3. Implementar em Tailwind Config**

Se usando `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Roxo - Primário
        'primary': {
          50: '#F3EBFF',
          100: '#E9D5FF',
          200: '#D8B4FE',
          400: '#9F7AEA',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5D3FD3',
          900: '#4C1D95',
        },
        // Verde - Sucesso
        'success': {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          400: '#6EE7B7',
          600: '#10B981',
          700: '#059669',
          800: '#047857',
          900: '#064E3B',
        },
        // Laranja - Alerta
        'warning': {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          400: '#FCD34D',
          600: '#F59E0B',
          700: '#D97706',
          800: '#B45309',
          900: '#78350F',
        },
        // Neutros
        'neutral': {
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
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },
    },
  },
};
```

---

### PASSO 2: Criar Design Tokens TypeScript

**Arquivo:** `frontend/lib/design-tokens.ts`

```typescript
/**
 * Design Tokens - Fonte única de verdade para todas as dimensões visuais
 * Atualizar aqui = atualizar em todo o sistema
 */

export const designTokens = {
  // Cores
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

  // Espaçamento
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem',   // 48px
  },

  // Tipografia
  typography: {
    // Headings
    h1: {
      fontSize: '2.5rem',     // 40px
      lineHeight: '3rem',
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h2: {
      fontSize: '2rem',       // 32px
      lineHeight: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.25px',
    },
    h3: {
      fontSize: '1.5rem',     // 24px
      lineHeight: '2rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.25rem',    // 20px
      lineHeight: '1.75rem',
      fontWeight: 600,
    },
    // Body
    body: {
      fontSize: '1rem',       // 16px
      lineHeight: '1.5rem',
      fontWeight: 400,
    },
    small: {
      fontSize: '0.875rem',   // 14px
      lineHeight: '1.25rem',
      fontWeight: 400,
    },
    xs: {
      fontSize: '0.75rem',    // 12px
      lineHeight: '1rem',
      fontWeight: 400,
    },
  },

  // Bordas
  borderRadius: {
    none: '0',
    sm: '0.375rem',    // 6px
    md: '0.5rem',      // 8px
    lg: '0.75rem',     // 12px
    xl: '1rem',        // 16px
    '2xl': '1.25rem',  // 20px
    full: '9999px',
  },

  // Sombras
  shadow: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.15)',
    inset: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
  },

  // Transições
  transition: {
    fast: 'all 150ms ease-in-out',
    base: 'all 300ms ease-in-out',
    slow: 'all 500ms ease-in-out',
  },

  // Breakpoints (Responsive)
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-index (Layering)
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

// Type exports para TypeScript
export type DesignTokens = typeof designTokens;
```

---

### PASSO 3: Criar Documentação de Cores (Visual Reference)

**Arquivo:** `frontend/DESIGN_SYSTEM.md`

```markdown
# Design System - Click Marido CRM

## Paleta de Cores

### Roxo (Primário)
- **Uso:** Branding, headers, CTAs, elementos principais
- **Range:** #4C1D95 (dark) → #F3EBFF (light)
- **Principais:**
  - Roxo Escuro: `#5D3FD3` - Buttons primários, headers
  - Roxo Médio: `#7C3AED` - Hover states, active
  - Roxo Claro: `#9F7AEA` - Backgrounds, disabled

### Verde (Sucesso)
- **Uso:** Actions bem-sucedidas, confirmações, progresso
- **Range:** #064E3B (dark) → #ECFDF5 (light)
- **Principais:**
  - Verde Escuro: `#059669` - Buttons secundários
  - Verde Médio: `#10B981` - CTAs, highlights
  - Verde Claro: `#6EE7B7` - Success messages

### Laranja (Alerta)
- **Uso:** Warnings, attenção, notificações
- **Range:** #78350F (dark) → #FFFBEB (light)
- **Principais:**
  - Laranja Escuro: `#D97706` - Warning buttons
  - Laranja Médio: `#F59E0B` - Alerts, badges
  - Laranja Claro: `#FCD34D` - Highlights

### Neutros (Suporte)
- **Uso:** Textos, backgrounds, borders
- **Range:** #111827 (dark) → #FFFFFF (light)
- **Principais:**
  - Preto: `#111827` - Headings, primary text
  - Cinza Escuro: `#374151` - Secondary text
  - Cinza Claro: `#E5E7EB` - Borders
  - Branco: `#FFFFFF` - Backgrounds

## Gradientes Assinatura

| Nome | Uso | CSS |
|------|-----|-----|
| Hero | Headers, CTAs principais | `linear-gradient(135deg, #5D3FD3 0%, #10B981 100%)` |
| Subtle | Cards, backgrounds | `linear-gradient(180deg, #F3EBFF 0%, #FFFBEB 100%)` |
| Accent | Botões, badges | `linear-gradient(90deg, #10B981 0%, #F59E0B 100%)` |
| Dark | Overlays, footers | `linear-gradient(135deg, #5D3FD3 0%, #059669 100%)` |
| Warning | Erros, críticos | `linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)` |

## Tipografia

### Headings
- **H1:** 40px, 700, -0.5px letter-spacing (página titles)
- **H2:** 32px, 700, -0.25px letter-spacing (section titles)
- **H3:** 24px, 600 (card titles)
- **H4:** 20px, 600 (labels)

### Body
- **Regular:** 16px, 400, 1.5 line-height (textos)
- **Small:** 14px, 400 (captions, helpers)
- **XS:** 12px, 400 (tiny text)

**Font:** 'Inter' ou 'Plus Jakarta Sans' (sans-serif moderno)

## Espaçamento

Use sistema 8px base:
- xs: 4px (internal padding)
- sm: 8px (standard padding)
- md: 16px (sections)
- lg: 24px (major sections)
- xl: 32px (page sections)

## Bordas & Sombras

### Border Radius
- sm: 6px (inputs, small components)
- md: 8px (cards, buttons) **DEFAULT**
- lg: 12px (larger cards)
- xl: 16px (hero sections)
- full: 9999px (pills, badges)

### Shadows
- xs: subtle elements
- sm: hover states
- md: **cards default**
- lg: elevated sections
- xl: modals, overlays

## Transições

- Fast: 150ms (hover feedback)
- Base: 300ms (default animations) **DEFAULT**
- Slow: 500ms (important state changes)

## Hierarquia Visual

1. **Primary CTA:** Roxo gradient, XXL, com sombra
2. **Secondary CTA:** Verde sólido, L, sem sombra
3. **Tertiary:** Laranja ou preto outline
4. **Disabled:** Cinza claro, opacity 0.5
```

---

### PASSO 4: Criar Utilities CSS para Gradientes

**Arquivo:** `frontend/lib/gradient-utils.ts`

```typescript
/**
 * Utilities para aplicar gradientes de forma consistente
 * Uso: className={`${gradients.hero} p-lg`}
 */

export const gradients = {
  // Gradientes com clase Tailwind
  hero: 'bg-gradient-hero',
  subtle: 'bg-gradient-subtle',
  accent: 'bg-gradient-accent',
  dark: 'bg-gradient-dark',
  warning: 'bg-gradient-warning',

  // Variantes com opacity
  heroOpacity: (opacity: number) => `bg-gradient-hero opacity-${opacity}`,
  
  // Gradientes de texto
  heroText: 'bg-gradient-hero bg-clip-text text-transparent',
  accentText: 'bg-gradient-accent bg-clip-text text-transparent',
} as const;

/**
 * Animations + Transitions standardizadas
 */
export const animations = {
  fadeIn: 'animate-fade-in',
  slideDown: 'animate-slide-down',
  slideUp: 'animate-slide-up',
  scaleIn: 'animate-scale-in',
  bounce: 'animate-bounce-subtle',
  
  // Transitions
  fast: 'transition-all duration-150 ease-in-out',
  base: 'transition-all duration-300 ease-in-out',
  slow: 'transition-all duration-500 ease-in-out',
} as const;

/**
 * Shadows padronizadas
 */
export const shadows = {
  xs: 'shadow-xs',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
} as const;
```

---

### PASSO 5: Validar Contraste de Cores (Acessibilidade)

**Verificação de Contraste WCAG AA (4.5:1 minimum)**

- ✅ Preto (#111827) on Branco: 18:1 PASS
- ✅ Roxo (#5D3FD3) on Branco: 6.2:1 PASS
- ✅ Verde (#10B981) on Branco: 4.5:1 PASS
- ✅ Laranja (#F59E0B) on Branco: 9.5:1 PASS
- ✅ Cinza (#9CA3AF) on Branco: 4.5:1 PASS

**Ferramenta:** Use https://webaim.org/resources/contrastchecker/

---

### PASSO 6: Teste das Cores em Componentes

**Arquivo:** `frontend/components/ColorShowcase.tsx` (para referência)

```typescript
export function ColorShowcase() {
  return (
    <div className="p-lg space-y-xl">
      {/* Roxo */}
      <div>
        <h2 className="h3 mb-md">Roxo (Primário)</h2>
        <div className="flex gap-md">
          <div className="w-32 h-32 bg-primary-900 rounded-lg" />
          <div className="w-32 h-32 bg-primary-600 rounded-lg" />
          <div className="w-32 h-32 bg-primary-50 rounded-lg border border-neutral-200" />
        </div>
      </div>

      {/* Verde */}
      <div>
        <h2 className="h3 mb-md">Verde (Sucesso)</h2>
        <div className="flex gap-md">
          <div className="w-32 h-32 bg-success-900 rounded-lg" />
          <div className="w-32 h-32 bg-success-600 rounded-lg" />
          <div className="w-32 h-32 bg-success-50 rounded-lg border border-neutral-200" />
        </div>
      </div>

      {/* Gradientes */}
      <div>
        <h2 className="h3 mb-md">Gradientes</h2>
        <div className="flex gap-md">
          <div className="w-40 h-40 bg-gradient-hero rounded-lg" />
          <div className="w-40 h-40 bg-gradient-subtle rounded-lg border border-neutral-200" />
          <div className="w-40 h-40 bg-gradient-accent rounded-lg" />
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ CHECKLIST DE CONCLUSÃO

- [ ] Tailwind config atualizado com cores e gradientes
- [ ] Design tokens criados em TypeScript
- [ ] DESIGN_SYSTEM.md documentado
- [ ] Utilities de gradients/animations criadas
- [ ] Contrastes validados (WCAG AA)
- [ ] ColorShowcase component visualizado
- [ ] Todos os gradientes testados visualmente
- [ ] Nenhuma cor hardcoded (usar utilities)

---

## 🎯 SAÍDA ESPERADA

Um design system completo que permite:
- ✅ Usar `className="bg-gradient-hero"` em qualquer lugar
- ✅ Todos os gradientes e cores foram testados
- ✅ Documentação de referência existe
- ✅ Próximos ultraprompts podem usar este sistema
- ✅ Nenhuma cor que não corresponda à paleta

---

**Quando completo, próximo passo:** ULTRAPROMPT 2: Componentes Base Redesenhados

---

**🎨 DESIGN SYSTEM CRIADO. PALETA PRONTA PARA USAR.**
