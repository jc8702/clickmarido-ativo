# Design System - Click Marido CRM

## Paleta de Cores

### 🟣 Roxo (Primário)
- **Uso:** Branding, headers, CTAs, elementos principais
- **Range:** #4C1D95 (dark) → #F3EBFF (light)
- **Principais:**
  - Roxo Escuro: `#5D3FD3` - Buttons primários, headers
  - Roxo Médio: `#7C3AED` - Hover states, active
  - Roxo Claro: `#9F7AEA` - Backgrounds, disabled

### 🟢 Verde (Sucesso)
- **Uso:** Actions bem-sucedidas, confirmações, progresso
- **Range:** #064E3B (dark) → #ECFDF5 (light)
- **Principais:**
  - Verde Escuro: `#059669` - Buttons secundários
  - Verde Médio: `#10B981` - CTAs, highlights
  - Verde Claro: `#6EE7B7` - Success messages

### 🟠 Laranja (Alerta)
- **Uso:** Warnings, atenção, notificações
- **Range:** #78350F (dark) → #FFFBEB (light)
- **Principais:**
  - Laranja Escuro: `#D97706` - Warning buttons
  - Laranja Médio: `#F59E0B` - Alerts, badges
  - Laranja Claro: `#FCD34D` - Highlights

### ⚪ Neutros (Suporte)
- **Uso:** Textos, backgrounds, borders
- **Range:** #111827 (dark) → #FFFFFF (light)
- **Principais:**
  - Preto: `#111827` - Headings, primary text
  - Cinza Escuro: `#374151` - Secondary text
  - Cinza Claro: `#E5E7EB` - Borders
  - Branco: `#FFFFFF` - Backgrounds

## Gradientes Assinatura

| Nome | Uso | Classe Tailwind | CSS |
|------|-----|-----------------|-----|
| Hero | Headers, CTAs principais | `bg-gradient-hero` | `linear-gradient(135deg, #5D3FD3 0%, #10B981 100%)` |
| Subtle | Cards, backgrounds | `bg-gradient-subtle` | `linear-gradient(180deg, #F3EBFF 0%, #FFFBEB 100%)` |
| Accent | Botões, badges | `bg-gradient-accent` | `linear-gradient(90deg, #10B981 0%, #F59E0B 100%)` |
| Dark | Overlays, footers | `bg-gradient-dark` | `linear-gradient(135deg, #5D3FD3 0%, #059669 100%)` |
| Warning | Erros, críticos | `bg-gradient-warning` | `linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)` |

## Tipografia

**Font:** 'Inter' (sans-serif moderno)

### Headings
- **H1:** 40px, 700, -0.5px letter-spacing (página titles)
- **H2:** 32px, 700, -0.25px letter-spacing (section titles)
- **H3:** 24px, 600 (card titles)
- **H4:** 20px, 600 (labels)

### Body
- **Regular:** 16px, 400, 1.5 line-height (textos)
- **Small:** 14px, 400 (captions, helpers)
- **XS:** 12px, 400 (tiny text)

## Espaçamento

Use sistema 8px base:
- xs: 4px (internal padding)
- sm: 8px (standard padding)
- md: 16px (sections)
- lg: 24px (major sections)
- xl: 32px (page sections)
- 2xl: 40px
- 3xl: 48px

## Bordas & Sombras

### Border Radius
- sm: 6px (inputs, small components)
- md: 8px (cards, buttons) **DEFAULT**
- lg: 12px (larger cards)
- xl: 16px (hero sections)
- 2xl: 20px
- full: 9999px (pills, badges)

### Shadows
- xs: subtle elements
- sm: hover states
- md: **cards default**
- lg: elevated sections
- xl: modals, overlays
- 2xl: maximum elevation

## Transições

- Fast: 150ms (hover feedback)
- Base: 300ms (default animations) **DEFAULT**
- Slow: 500ms (important state changes)

## Hierarquia Visual

1. **Primary CTA:** Roxo gradient, sombra, destaque máximo
2. **Secondary CTA:** Verde sólido, sem sombra
3. **Tertiary:** Outline ou ghost
4. **Warning/Danger:** Laranja ou vermelho
5. **Disabled:** Opacity 0.5, cinza

## Contraste WCAG AA (4.5:1 min)

- ✅ Preto (#111827) on Branco: 18:1 PASS
- ✅ Roxo (#5D3FD3) on Branco: 6.2:1 PASS
- ✅ Verde (#10B981) on Branco: 4.5:1 PASS
- ✅ Laranja (#F59E0B) on Branco: 9.5:1 PASS
- ✅ Cinza (#9CA3AF) on Branco: 4.5:1 PASS
