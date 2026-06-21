# Componentes - Click Marido CRM

## Button

```tsx
import { Button } from '@/components/Button';

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="danger">Danger</Button>
<Button variant="ghost">Ghost</Button>

// Sizes
<Button size="xs">XS</Button>
<Button size="sm">SM</Button>
<Button size="md">MD</Button>
<Button size="lg">LG</Button>
<Button size="xl">XL</Button>

// States
<Button isLoading>Carregando...</Button>
<Button disabled>Desabilitado</Button>
<Button fullWidth>Largura total</Button>

// Com ícone
<Button icon={<span>🔍</span>}>Buscar</Button>
```

## Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/Card';

<Card gradient="subtle" shadow="md">
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição opcional</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Conteúdo principal</p>
  </CardContent>
  <CardFooter>
    <Button>Ok</Button>
  </CardFooter>
</Card>

// Card interativo (hover scale)
<Card interactive>
  <CardContent>Passe o mouse</CardContent>
</Card>
```

## Input

```tsx
import { Input } from '@/components/Input';

// Estados
<Input label="Normal" placeholder="Digite algo" />
<Input label="Com erro" error="Campo inválido" />
<Input label="Com ajuda" helperText="Formato esperado" />
<Input label="Obrigatório" required />
<Input label="Desabilitado" disabled />
<Input label="Com ícone" icon={<span>📧</span>} />
```

## Badge

```tsx
import { Badge } from '@/components/Badge';

// Variants
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="danger">Danger</Badge>
<Badge variant="neutral">Neutral</Badge>

// Sizes
<Badge size="sm">Pequeno</Badge>
<Badge size="md">Médio</Badge>

// Com remover
<Badge onRemove={() => {}}>Filtrável</Badge>
```

## Modal

```tsx
import { Modal } from '@/components/Modal';

<Modal
  isOpen={isOpen}
  onClose={() => setOpen(false)}
  title="Título"
  size="md" // sm | md | lg
>
  <p>Conteúdo</p>
</Modal>

// Com footer
<Modal
  isOpen={isOpen}
  onClose={() => setOpen(false)}
  title="Confirmar"
  footer={<Button onClick={handleConfirm}>Confirmar</Button>}
>
  <p>Tem certeza?</p>
</Modal>
```

## Toast

```tsx
import { Toast } from '@/components/Toast';

<Toast
  type="success" // success | error | warning | info
  title="Salvo!"
  message="Operação concluída"
  onClose={() => {}}
/>
```

## Navigation

```tsx
import { Navigation } from '@/components/Navigation';

<Navigation
  logo={<div className="text-xl font-bold text-white">Logo</div>}
  links={[
    { href: '/', label: 'Dashboard' },
    { href: '/customers', label: 'Clientes' },
    { href: '/quotations', label: 'Orçamentos' },
  ]}
  user={{ name: 'José', email: 'jose@email.com' }}
  onLogout={handleLogout}
/>
```

## Table

```tsx
import { Table, TableHead, TableHeader, TableRow, TableCell } from '@/components/Table';

<Table>
  <TableHead>
    <TableRow>
      <TableHeader>Nome</TableHeader>
      <TableHeader>Ações</TableHeader>
    </TableRow>
  </TableHead>
  <tbody>
    <TableRow>
      <TableCell className="font-medium">João</TableCell>
      <TableCell>
        <Button size="xs" variant="outline">Editar</Button>
      </TableCell>
    </TableRow>
  </tbody>
</Table>
```

## FormBuilder

```tsx
import { FormBuilder } from '@/components/FormBuilder';

<FormBuilder
  title="Novo Cadastro"
  description="Preencha os dados abaixo"
  fields={[
    { name: 'name', label: 'Nome', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Telefone', type: 'phone' },
    { name: 'type', label: 'Tipo', type: 'select', options: [
      { label: 'Residencial', value: 'res' },
      { label: 'Comercial', value: 'com' },
    ]},
    { name: 'obs', label: 'Obs', type: 'textarea' },
  ]}
  onSubmit={async (data) => { await api.post('/endpoint', data); }}
  submitText="Salvar"
/>
```

## Design Tokens

```tsx
import { designTokens } from '@/lib/design-tokens';
import { gradients, animations, shadows } from '@/lib/gradient-utils';

// Gradientes
<div className={gradients.hero}>Hero</div>
<div className={gradients.subtle}>Subtle</div>
<div className={gradients.dark}>Dark</div>
<div className={gradients.accent}>Accent</div>
<div className={gradients.warning}>Warning</div>

// Animações
<div className={animations.fadeIn}>Fade in</div>
<div className={animations.slideDown}>Slide down</div>
<div className={animations.scaleIn}>Scale in</div>

// Sombras
<div className={shadows.md}>Shadow md</div>

// Texto com gradiente
<h1 className={gradients.heroText}>Título com Gradiente</h1>
```

## Animações Custom CSS

```css
.animate-shimmer       /* Loading skeleton */
.animate-pulse-subtle  /* Pulsar suave */
.animate-float         /* Flutuação lenta */
.bg-gradient-animated  /* Gradiente com shift animado */
.transition-smooth     /* Cubic-bezier suave */
```

## Página de Testes

Acesse `/test` para ver todos os componentes em funcionamento.
