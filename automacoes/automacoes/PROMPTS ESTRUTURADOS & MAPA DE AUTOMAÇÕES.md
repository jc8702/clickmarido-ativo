# CLICK MARIDO - PROMPTS ESTRUTURADOS & MAPA DE AUTOMAÇÕES

**Data:** 2026-06-22  
**Status:** Pronto para execução por agentes de IA  
**Repositório:** https://github.com/jc8702/clickmarido-ativo.git

---

## 📋 PARTE 1: REFATORAÇÃO DE NAVEGAÇÃO (SUPERIOR → LATERAL)

### Problema Atual
- Menu horizontal na barra superior (Navigation.tsx)
- Espaço limitado, sem scrollbar
- Sem opção de colapsar/expandir
- Links aparecem apenas em desktop; mobile usa hamburger menu

### Solução Alvo
- Menu vertical na lateral esquerda
- Barra de rolagem interna
- Botão toggle para esconder/mostrar
- Sidebar responsiva com transições suaves
- Logo integrado no topo da sidebar

---

### PROMPT 1: Criar Componente Sidebar

```
Crie um novo componente React chamado Sidebar.tsx (em /frontend/components/).

Requisitos:
1. Menu vertical layout à esquerda
2. Largura: 260px (expandido) / 80px (colapsado)
3. Propriedades aceitas:
   - isOpen: boolean (controla estado expandido/colapsado)
   - onToggle: () => void (callback para alternar estado)
   - links: Array<{href, label, icon}>
   - logo?: React.ReactNode
   - user?: {name, email}
   - onLogout?: () => void

4. Styling:
   - Background: dark: bg-neutral-900, light: bg-white
   - Borda direita: border-r border-neutral-200 dark:border-neutral-700
   - Scrollbar interna: max-height com overflow-y-auto
   - Transição suave: transition-all duration-300
   - Z-index: z-50 (acima do conteúdo)

5. Estrutura interna:
   - Header (logo + toggle button)
   - Nav links com icones (mostrar label apenas quando expandido)
   - Footer (user info + logout) fixo no rodapé

6. Estados:
   - isOpen=true: mostra labels completos, ícones + textos
   - isOpen=false: apenas ícones com tooltips ao hover
   - Icones: reutilizar do Navigation.tsx (defaultIcons)

7. Responsividade:
   - Mobile (<768px): sidebar oculta por padrão, overlay ao abrir
   - Desktop (≥768px): sidebar sempre visível, toggle alterna tamanho

Exemplo de prop links:
[
  { href: '/dashboard', label: 'Dashboard', icon: <SvgIcon /> },
  { href: '/quotations', label: 'Orçamentos', icon: <SvgIcon /> },
  ...
]

Tecnologias: React 18+, Tailwind CSS, Next.js usePathname para active state

Output: Componente funcional com hooks (useState, useEffect) para estado aberto/fechado
```

---

### PROMPT 2: Refatorar Layout do Dashboard

```
Modifique /frontend/app/(dashboard)/layout.jsx para integrar a nova Sidebar.

Requisitos:
1. Adicione estado local: isMenuOpen usando useState(false)
2. Importe Sidebar.tsx
3. Estrutura JSX:
   - <div className="flex min-h-screen">
     - <Sidebar isOpen={isMenuOpen} onToggle={...} links={navLinks} />
     - <main className="flex-1 overflow-auto">
       - {children}

4. navLinks array:
   - Dashboard → /dashboard
   - Clientes → /customers
   - Orçamentos → /quotations
   - Serviços e Peças → /products
   - Ordens de Serviço → /service-orders
   - Pagamentos → /payments
   - Garantias → (verificar rota existente)
   - Financeiro → (verificar se existe ou criar rota /financeiro)
   - Faturamento → (verificar se existe ou criar rota /faturamento)
   - Despesas → (verificar se existe ou criar rota /despesas)

5. Remova Navigation.tsx do layout (será substituída)
6. Adapte className do <main> para acomodar sidebar dinâmica:
   - margin-left dinâmico baseado em isMenuOpen
   - ou use flex-1 (mais limpo)

7. Passe user e onLogout props para Sidebar
8. Estado should persist: localStorage.setItem('sidebarOpen', isMenuOpen)

Testing:
- Verifique em mobile (< 768px): sidebar overlay
- Verifique em desktop (≥ 768px): sidebar toggle dinâmico
- Cliques em links devem navegar e manter estado consistente
```

---

### PROMPT 3: Remover Navigation Horizontal

```
1. Remova <Navigation /> de todos os layouts que a usam:
   - Verifique /frontend/app/layout.tsx
   - Verifique se existe em /frontend/app/profile/page.tsx
   - Qualquer outro arquivo que importa Navigation.tsx

2. Limpe imports:
   - Remova: import { Navigation } from '@/components/Navigation';
   - Mantenha apenas se necessário em other pages não-dashboard

3. Se Navigation for usada em login page (/frontend/app/login/page.tsx):
   - Mantenha como está (Sidebar é apenas para dashboard autenticado)

4. Após refatoração:
   - Teste todas as rotas de navegação
   - Verifique links ativos (pathname matching)
   - Confirme logout funciona na Sidebar
```

---

## 📊 PARTE 2: MAPA COMPLETO DE AUTOMAÇÕES & INTEGRAÇÕES

### Automações Já Implementadas

#### ✅ 1. QUOTATION → SERVICE ORDER (Aprovação)
**Localização:** `/frontend/app/api/quotations/[id]/route.ts` (linhas 153-194)

**Trigger:** Status atualizado para `'aceito'`

**Ação:**
```
Se não existir ServiceOrder vinculado:
  1. Busca dados do cliente (endereço principal)
  2. Gera número sequencial OS (OS-0001, OS-0002, ...)
  3. Cria ServiceOrder com:
     - status: 'agendada'
     - address: extraído do customer.addresses
     - finalTotal: quotation.total
     - notes: "Orçamento {ID} aprovado"
```

**Código referência:**
```javascript
if (body.status === 'aceito') {
  const existingOS = await prisma.serviceOrder.findFirst({
    where: { quotationId: id },
  });
  if (!existingOS) {
    // ... criar ServiceOrder
  }
}
```

---

### Automações Recomendadas (Próximas Implementações)

#### 🔲 2. SERVICE ORDER CONCLUÍDO → AUTO-CRIAR PAYMENT
**Entidades Envolvidas:** ServiceOrder, Payment, Quotation

**Cenário:** Técnico marca OS como `'concluída'`

**Ações Propostas:**
```
Ao atualizar ServiceOrder.status = 'concluída':
  1. Se Payment não existir para quotation:
     - Criar Payment com:
       - amount: ServiceOrder.finalTotal
       - status: 'pendente'
       - method: 'pix' (padrão)
       - description: `Pagamento - Orçamento {quotation.id}`
       
  2. Notificação WhatsApp (se integrado):
     - Enviar para customer.phone: "Serviço concluído! Aguardamos pagamento de R$ {amount}"
     
  3. Gerar QR Code PIX:
     - Chamar /api/payments/[id]/generate-pix
     - Retornar pixCode para cliente via WhatsApp
```

**Impacto:** Reduz 3 cliques manuais (criar payment, gerar PIX, enviar)

---

#### 🔲 3. PAYMENT PENDENTE → LEMBRETE AUTOMÁTICO (RECURRING)
**Entidades:** Payment, Customer

**Cenário:** Payment com status `'pendente'` e data de criação > 3 dias

**Ações Propostas:**
```
Executar job diário (cron) ou sob demanda:
  1. Buscar todos os Payments com status='pendente' AND (now - createdAt) > 3 dias
  2. Para cada Payment:
     - Buscar customer.phone
     - Enviar WhatsApp: "Lembrete: Pagamento pendente de R$ {amount}. PIX: {pixCode}"
     
  3. Log no banco (auditLog table - TBD):
     - Registrar quando lembrete foi enviado
     - Evitar duplicatas (máx 1 lembrete por 24h)
```

**Implementação:** Webhook externo (Vercel Cron) ou task queue

---

#### 🔲 4. PAYMENT RECEBIDO → AUTO-MARCAR COMO PAGO + CONFIRMAR OS
**Entidades:** Payment, ServiceOrder

**Cenário:** Webhook de confirmação PIX recebida (Asaas integration)

**Ações Propostas:**
```
Ao receber webhook Asaas (payment_confirmed):
  1. Atualizar Payment:
     - status: 'pago'
     - paidAt: now()
     
  2. Buscar ServiceOrder vinculada:
     - Atualizar status: 'concluída' (se ainda não está)
     - Notificar admin: "Pagamento confirmado - OS pode ser encerrada"
     
  3. Enviar confirmação WhatsApp ao cliente:
     - "Pagamento recebido com sucesso! Obrigado!"
```

**Requer:** Setup Asaas webhook

---

#### 🔲 5. QUOTATION NÃO APROVADA POR 14 DIAS → NOTIFICAÇÃO DE EXPIRAÇÃO
**Entidades:** Quotation, Customer, Audit

**Cenário:** Quotation com status `'enviado'` por > 14 dias

**Ações Propostas:**
```
Executar job diário:
  1. Buscar Quotations com:
     - status = 'enviado'
     - (now - updatedAt) > 14 dias
     
  2. Para cada Quotation não notificada:
     - Enviar WhatsApp: "Orçamento ainda pendente: R$ {total}. Aprova?"
     - Marcar com flag expiring_notification_sent
     
  3. Se > 30 dias:
     - Auto-arquivar: status = 'expirado'
     - Notificar admin: "Orçamento expirado"
```

**Impacto:** Evita perda de leads, melhora follow-up

---

#### 🔲 6. WARRANTY PRÓXIMA DE EXPIRAR → LEMBRETE PRÉ-VENCIMENTO
**Entidades:** Warranty, Customer

**Cenário:** Warranty.expiry_date está dentro de 30 dias

**Ações Propostas:**
```
Executar job diário:
  1. Buscar Warranties com:
     - expiry_date entre now() e now() + 30 dias
     - reminder_sent = false
     
  2. Enviar WhatsApp:
     - "Sua garantia expira em {dias}. Serviço: {service_description}"
     - Link para renovação (se houver)
     
  3. Marcar: reminder_sent = true
```

**Schema update:** Adicionar campo `reminder_sent: Boolean` em Warranty

---

#### 🔲 7. TECHNICIAN ATRIBUÍDO → NOTIFICAÇÃO + AGENDAMENTO AUTOMÁTICO
**Entidades:** ServiceOrder, Technician

**Cenário:** Técnico atribuído a ServiceOrder sem scheduledTime

**Ações Propostas:**
```
Ao atualizar ServiceOrder.technicianId:
  1. Se ServiceOrder.scheduledTime não existe:
     - Sugerir 3 horários baseado em disponibilidade do técnico
     - Enviar WhatsApp ao técnico: "Nova OS! Cliente: {customer.name}, Endereço: {address}"
     
  2. Se scheduledTime existe:
     - Enviar confirmação: "OS agendada para {scheduledTime}"
     - Criar reminder 24h antes
     
  3. Log de atribuição no auditLog
```

**Requer:** Disponibilidade table para technicians (TBD)

---

#### 🔲 8. PRODUCT ESTOQUE BAIXO → ALERTA AUTOMÁTICO
**Entidades:** Product, QuotationItem

**Cenário:** Produto usado em quotation, estoque < limite mínimo

**Ações Propostas:**
```
Ao criar QuotationItem:
  1. Verificar se produto tem estoque_minimo definido
  2. Se sim e estoque_atual < estoque_minimo:
     - Gerar alerta: "Estoque baixo - {productName}"
     - Notificar admin
     - (Futuro: integrar com supplier para auto-compra)
```

**Requer:** Adicionar campos `estoque_atual`, `estoque_minimo`, `supplier` em Product

---

#### 🔲 9. INVOICE/FATURAMENTO → CÁLCULO E ENVIO AUTOMÁTICO
**Entidades:** ServiceOrder, Payment, Invoice (nova)

**Cenário:** ServiceOrder concluída e payment recebida

**Ações Propostas:**
```
Ao marcar Payment.status = 'pago':
  1. Se não existir Invoice:
     - Gerar número sequencial (NF-0001)
     - Calcular totais (base, impostos, descontos)
     - Status: 'gerada'
     
  2. Enviar PDF via email + WhatsApp:
     - Customer recebe nota fiscal
     - Admin recebe cópia
     
  3. Registrar em auditLog com timestamp
```

**Requer:** Novo schema Invoice e gerador PDF

---

#### 🔲 10. RELATÓRIOS DIÁRIOS AUTOMÁTICOS
**Entidades:** Quotation, Payment, ServiceOrder (aggregates)

**Cenário:** Fim do dia comercial (18h)

**Ações Propostas:**
```
Executar job diário às 18h:
  1. Compilar métricas:
     - Total orçamentos enviados (dia)
     - Orçamentos aprovados (dia)
     - Pagamentos recebidos (dia)
     - OS concluídas (dia)
     - Faturamento (dia)
     
  2. Enviar relatório em:
     - Email: admin@clickmarido.com
     - WhatsApp: número admin
     
  3. Armazenar em dailyReport table (analytics)
```

**Impacto:** Dashboard executivo em tempo real

---

## 🔗 INTEGRAÇÕES RECOMENDADAS

### 1. ASAAS (Pagamentos PIX)
**Status:** Parcialmente implementado (/api/payments/[id]/generate-pix)

**Próximos passos:**
```
1. Implementar webhook receiver: POST /api/payments/asaas-webhook
2. Validar assinatura Asaas (HMAC-SHA256)
3. Trigger automação #4 (Payment recebido)
4. Logs de webhook no BD para debug
```

---

### 2. WHATSAPP BUSINESS API
**Status:** Mencionado em prompts, não implementado

**Requisitos:**
```
1. Provider: Meta (WhatsApp Business API) ou Twilio
2. Endpoints necessários:
   - POST /api/whatsapp/send-message
   - POST /api/whatsapp/handle-incoming
   
3. Templates pré-aprovados:
   - Confirmação orçamento
   - Lembrete pagamento
   - Confirmação OS
   - Conclusão serviço
   
4. Rate limit: respeitar 80 msg/s (Meta)
```

---

### 3. GOOGLE CALENDAR / AGENDA
**Status:** Não implementado

**Uso proposto:**
```
1. Sincronizar ServiceOrder.scheduledTime com calendário técnico
2. Evitar conflitos de agendamento
3. Enviar convites automáticos para técnicos
```

---

### 4. EMAIL (SMTP / Resend)
**Status:** Não implementado

**Uso proposto:**
```
1. Notificações: ordem status, pagamento, invoice
2. Relatórios: daily summary, financial statements
3. Provider recomendado: Resend (serverless, Vercel-friendly)
```

---

## 🛠️ IMPLEMENTAÇÃO: ORDER OF PRIORITY

### FASE 1 (SEMANA 1) - Refatoração UI
- [x] Criar Sidebar.tsx
- [x] Refatorar layout dashboard
- [x] Remover Navigation horizontal
- [x] Testar em mobile/desktop

### FASE 2 (SEMANA 2) - Automações Críticas
- [ ] Automação #4: Payment recebido → marcar pago
- [ ] Webhook Asaas setup
- [ ] Testes end-to-end

### FASE 3 (SEMANA 3) - Automações Secundárias
- [ ] Automação #2: OS concluída → criar payment
- [ ] Automação #3: Lembrete pagamento (cron job)
- [ ] Schema updates (Payment.reminder_sent, etc)

### FASE 4 (SEMANA 4) - Notificações & Relatórios
- [ ] WhatsApp integration (basic)
- [ ] Automação #10: Daily reports
- [ ] Email setup (Resend)

---

## 📝 CHECKLIST DE VARREDURA

### APIs Existentes (Verificadas)
- ✅ /api/quotations - List, Create
- ✅ /api/quotations/[id] - Get, Update, Delete + Auto-create OS
- ✅ /api/service-orders - List, Create
- ✅ /api/service-orders/[id] - Get, Update (sem automações)
- ✅ /api/payments - List, Create
- ✅ /api/payments/[id]/generate-pix - Gera QR Code
- ✅ /api/customers - CRUD
- ✅ /api/products - CRUD
- ✅ /api/warranties - CRUD

### Tables/Models (Verificadas)
- ✅ User
- ✅ Technician
- ✅ Customer
- ✅ Quotation
- ✅ QuotationItem
- ✅ ServiceOrder
- ✅ Payment
- ✅ Warranty
- ✅ Product
- ✅ ServiceOrderPhoto

### Tables Ausentes (Recomendadas)
- ⚠️ AuditLog (logging de ações)
- ⚠️ Invoice (faturamento)
- ⚠️ DailyReport (relatórios)
- ⚠️ TechnicianAvailability (agendamento)
- ⚠️ WebhookLog (integração externa)

---

## 🚀 PRÓXIMAS EXECUÇÕES

### Command para Agente 1 (UI Refactor)
```bash
git clone https://github.com/jc8702/clickmarido-ativo.git
cd clickmarido-ativo
# Execute PROMPT 1, 2, 3 acima
# Commit: "feat: sidebar navigation refactor"
```

### Command para Agente 2 (Automações)
```bash
# Após UI estar mergeado
# Execute automações #2, #3, #4
# Adicione schema updates
# Commit: "feat: auto-payment-on-service-complete"
```

---

## 📞 Contato & Validação

**Por favor validar:**
1. Ordem de prioridade das automações
2. Comportamento esperado em edge cases (ex: OS duplicada?)
3. Permissões de acesso (quem pode fazer o quê?)
4. Compliance LGPD em notificações WhatsApp/Email

---

**Documento preparado para execução autônoma por AI agents**  
**Sem necessidade de aprovação manual em cada passo (salvo validação final)**