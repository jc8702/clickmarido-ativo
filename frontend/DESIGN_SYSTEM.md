# Design System - Click Marido CRM

## Paleta de Cores

### Roxo (Primário)
- **Uso:** Branding, headers, CTAs, elementos principais
- **Principais:**
  - Roxo Escuro: `#5D3FD3` - Buttons primários, headers
  - Roxo Médio: `#7C3AED` - Hover states, active
  - Roxo Claro: `#9F7AEA` - Backgrounds, disabled

### Verde (Sucesso)
- **Uso:** Actions bem-sucedidas, confirmações, progresso
- **Principais:**
  - Verde Escuro: `#059669` - Buttons secundários
  - Verde Médio: `#10B981` - CTAs, highlights
  - Verde Claro: `#6EE7B7` - Success messages

### Laranja (Alerta)
- **Uso:** Warnings, atenção, notificações
- **Principais:**
  - Laranja Escuro: `#D97706` - Warning buttons
  - Laranja Médio: `#F59E0B` - Alerts, badges
  - Laranja Claro: `#FCD34D` - Highlights

### Neutros (Suporte)
- **Uso:** Textos, backgrounds, borders
- **Principais:**
  - Preto: `#111827` - Headings, primary text
  - Cinza Escuro: `#374151` - Secondary text
  - Cinza Claro: `#E5E7EB` - Borders
  - Branco: `#FFFFFF` - Backgrounds

## Gradientes Assinatura

| Nome | Uso | Classe Tailwind |
|------|-----|-----------------|
| Hero | Headers, CTAs principais | `bg-gradient-hero` |
| Subtle | Cards, backgrounds | `bg-gradient-subtle` |
| Accent | Botões, badges | `bg-gradient-accent` |
| Dark | Overlays, footers | `bg-gradient-dark` |
| Warning | Erros, críticos | `bg-gradient-warning` |

## Tipografia

### Headings
- **H1:** 40px, 700 (página titles)
- **H2:** 32px, 700 (section titles)
- **H3:** 24px, 600 (card titles)
- **H4:** 20px, 600 (labels)

### Body
- **Regular:** 16px, 400 (textos)
- **Small:** 14px, 400 (captions, helpers)
- **XS:** 12px, 400 (tiny text)

**Font:** 'Inter' (sans-serif moderno)

## Espaçamento

- xs: 4px (internal padding)
- sm: 8px (standard padding)
- md: 16px (sections)
- lg: 24px (major sections)
- xl: 32px (page sections)

## Bordas & Sombras

### Border Radius
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
- Base: 300ms (default animations)
- Slow: 500ms (important state changes)
