# CLICK MARIDO - ARQUITECTURA & PATTERNS DE IMPLEMENTAÇÃO

**Versão:** 2.0  
**Tech Stack:** Next.js 15 + Prisma + Neon PostgreSQL + Tailwind CSS  
**Deploy:** Vercel  

---

## 🏗️ ARQUITETURA ATUAL

```
frontend/
├── app/
│   ├── (dashboard)/          # Protected routes (authenticated users)
│   │   ├── customers/        # CRUD clientes
│   │   ├── quotations/       # CRUD orçamentos
│   │   ├── service-orders/   # CRUD ordens de serviço
│   │   ├── products/         # CRUD produtos/serviços
│   │   ├── payments/         # CRUD pagamentos
│   │   └── dashboard/        # Dashboard principal
│   ├── api/                  # REST API endpoints
│   │   ├── auth/             # Login/logout
│   │   ├── quotations/       # [id]/ for CRUD + auto-OS
│   │   ├── service-orders/   # [id]/ for CRUD
│   │   ├── payments/         # [id]/generate-pix for PIX
│   │   ├── customers/
│   │   ├── products/
│   │   └── ...
│   ├── login/                # Auth page (public)
│   ├── profile/              # User profile
│   └── layout.tsx            # Root layout
├── components/               # Reusable React components
│   ├── Navigation.tsx        # Top nav (será removido)
│   ├── Sidebar.tsx           # New: vertical nav
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── Table.tsx
│   └── ...
├── hooks/                    # Custom React hooks
│   ├── useAuth.ts            # Auth context
│   ├── useQuotations.ts      # Quotation CRUD
│   └── ...
├── lib/                      # Utilities
│   ├── validations/          # Zod schemas
│   └── ...
├── prisma/
│   ├── schema.prisma         # Data models
│   └── migrations/           # DB migrations
└── utils/                    # Helper functions
```

---

## 🔐 PADRÕES DE SEGURANÇA & AUTENTICAÇÃO

### 1. JWT Token Validation (Atual)

```typescript
// Pattern usado em todos os /api/* endpoints

function validateToken(request: NextRequest) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) return null;

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.substring(7);
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  // ... rest of handler
}
```

**✅ Aplicar este padrão** em TODAS as novas automações/webhooks:
- Webhooks Asaas devem validar assinatura HMAC (não JWT)
- Cron jobs internos (Vercel) usam `X-Vercel-Auth-Token`
- APIs externas precisam chaves diferentes

---

### 2. Prisma Client Lifecycle

```typescript
// CORRETO
const prisma = new PrismaClient();
try {
  // query
} finally {
  await prisma.$disconnect();
}

// MELHOR (singleton em production)
// lib/prisma.ts
export const prisma = new PrismaClient();

// app/api/route.ts
import { prisma } from '@/lib/prisma';
// sem disconnect (Vercel lambda reutiliza conexão)
```

**Action:** Criar `/frontend/lib/prisma.ts` singleton e refatorar todos os endpoints

---

## 🔄 PADRÃO: AUTOMAÇÕES COM SIDE EFFECTS

### Estrutura Recomendada

```typescript
// app/api/automations/quotation-approved.ts
// Executado quando Quotation.status muda para 'aceito'

import { prisma } from '@/lib/prisma';

export async function handleQuotationApproved(quotationId: string) {
  try {
    // 1. Fetch quotation
    const quotation = await prisma.quotation.findUniqueOrThrow({
      where: { id: quotationId },
      include: { customer: true },
    });

    // 2. Check if already processed
    const existingOS = await prisma.serviceOrder.findFirst({
      where: { quotationId },
    });
    if (existingOS) return { status: 'skipped', reason: 'OS already exists' };

    // 3. Execute automation (create OS)
    const osNumber = await generateServiceOrderNumber();
    const serviceOrder = await prisma.serviceOrder.create({
      data: {
        number: osNumber,
        quotationId,
        customerId: quotation.customerId,
        status: 'agendada',
        address: extractAddress(quotation.customer),
        finalTotal: quotation.total,
        notes: `Orçamento ${quotationId.slice(-6).toUpperCase()} aprovado`,
      },
    });

    // 4. Log result
    await logAutomationExecution({
      type: 'quotation.approved',
      quotationId,
      result: 'success',
      serviceOrderId: serviceOrder.id,
    });

    // 5. Trigger side effect (notification)
    await notifyCustomerQuotationApproved(quotation, serviceOrder);

    return { status: 'success', serviceOrder };
  } catch (error) {
    await logAutomationExecution({
      type: 'quotation.approved',
      quotationId,
      result: 'error',
      error: error.message,
    });
    throw error;
  }
}

// Helper: Extract address from customer.addresses JSON
function extractAddress(customer: any): string {
  const addresses = customer.addresses || [];
  if (addresses.length === 0) return '';
  const addr = addresses[0];
  return [addr.street, addr.number, addr.neighborhood, addr.city, addr.state]
    .filter(Boolean)
    .join(', ');
}

// Helper: Generate sequential OS number
async function generateServiceOrderNumber(): Promise<string> {
  const lastOS = await prisma.serviceOrder.findFirst({
    orderBy: { number: 'desc' },
    select: { number: true },
  });
  
  if (!lastOS) return 'OS-0001';
  const match = lastOS.number.match(/(\d+)$/);
  if (!match) return 'OS-0001';
  
  const nextNum = parseInt(match[1], 10) + 1;
  return `OS-${String(nextNum).padStart(4, '0')}`;
}
```

**Integração em endpoint PUT /quotations/[id]:**

```typescript
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!validateToken(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const { id } = await params;

  // Update quotation
  const quotation = await prisma.quotation.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.total !== undefined && { total: body.total }),
    },
    include: { customer: true },
  });

  // TRIGGER: Automação ao mudar status
  if (body.status && body.status !== quotation.status) {
    try {
      await handleAutomationTrigger('quotation.status_changed', {
        quotationId: id,
        oldStatus: quotation.status,
        newStatus: body.status,
      });
    } catch (error) {
      console.error('Automation trigger failed:', error);
      // Continue (não falhar a requisição)
    }
  }

  return NextResponse.json(quotation);
}
```

---

## 🔔 PADRÃO: NOTIFICAÇÕES (WhatsApp/Email)

### Exemplo: Notificação WhatsApp

```typescript
// lib/notifications/whatsapp.ts

type WhatsAppTemplate = 
  | 'quotation_approved'
  | 'service_order_completed'
  | 'payment_pending_reminder'
  | 'payment_received';

interface NotificationPayload {
  phone: string;
  template: WhatsAppTemplate;
  variables: Record<string, string>;
}

export async function sendWhatsAppNotification(
  payload: NotificationPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Provider: Meta WhatsApp Business API (ou Twilio)
    const response = await fetch('https://graph.instagram.com/v18.0/{phone-number-id}/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: payload.phone.replace(/\D/g, ''), // Remove non-digits
        type: 'template',
        template: {
          name: payload.template,
          language: { code: 'pt_BR' },
          components: [
            {
              type: 'body',
              parameters: Object.values(payload.variables).map(v => ({ type: 'text', text: v })),
            },
          ],
        },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to send message');
    }

    return { success: true, messageId: data.messages[0].id };
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return { success: false, error: error.message };
  }
}

// Usage
await sendWhatsAppNotification({
  phone: '+5547999999999',
  template: 'quotation_approved',
  variables: {
    customer_name: 'João',
    service_order_number: 'OS-0001',
    total: 'R$ 350,00',
  },
});
```

---

## 📊 PADRÃO: CRON JOBS (Vercel Cron)

### Exemplo: Daily Report Job

```typescript
// app/api/cron/daily-report/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Vercel: Configure em vercel.json
// {
//   "crons": [{
//     "path": "/api/cron/daily-report",
//     "schedule": "0 18 * * *"
//   }]
// }

export async function GET(request: NextRequest) {
  // Validate Vercel's cron auth header
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Compile metrics
    const quotationsSent = await prisma.quotation.count({
      where: {
        status: 'enviado',
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    const quotationsApproved = await prisma.quotation.count({
      where: {
        status: 'aceito',
        updatedAt: { gte: today, lt: tomorrow },
      },
    });

    const paymentsReceived = await prisma.payment.count({
      where: {
        status: 'pago',
        paidAt: { gte: today, lt: tomorrow },
      },
    });

    const totalRevenue = await prisma.payment.aggregate({
      where: {
        status: 'pago',
        paidAt: { gte: today, lt: tomorrow },
      },
      _sum: { amount: true },
    });

    const report = {
      date: today.toISOString().split('T')[0],
      quotationsSent,
      quotationsApproved,
      paymentsReceived,
      totalRevenue: totalRevenue._sum.amount || 0,
    };

    // Store in DB
    // await prisma.dailyReport.create({ data: report });

    // Send notification
    await sendAdminDailyReport(report);

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

async function sendAdminDailyReport(report: any) {
  // Send via email or WhatsApp
  console.log('Daily report:', report);
}
```

**Config Vercel (vercel.json):**
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-report",
      "schedule": "0 18 * * *"
    },
    {
      "path": "/api/cron/payment-reminders",
      "schedule": "0 10 * * *"
    }
  ]
}
```

---

## 🪝 PADRÃO: WEBHOOKS (Asaas Integration)

### Exemplo: Webhook PIX Confirmado

```typescript
// app/api/webhooks/asaas/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // 1. Validate signature
    const signature = request.headers.get('asaas-signature');
    const body = await request.text();
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.ASAAS_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Parse payload
    const payload = JSON.parse(body);
    
    if (payload.event !== 'PAYMENT_RECEIVED') {
      return NextResponse.json({ status: 'ignored' });
    }

    // 3. Update payment in DB
    const payment = await prisma.payment.findFirst({
      where: { pixCode: payload.pixCode },
      include: { quotation: true },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'pago',
        paidAt: new Date(payload.confirmedDate),
      },
      include: { quotation: true },
    });

    // 4. Trigger automation: mark service order as completed
    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { quotationId: updated.quotationId },
    });

    if (serviceOrder) {
      await prisma.serviceOrder.update({
        where: { id: serviceOrder.id },
        data: { status: 'concluída' },
      });
    }

    // 5. Send confirmation to customer
    await sendWhatsAppNotification({
      phone: updated.quotation.customer.phone,
      template: 'payment_received',
      variables: { amount: updated.amount.toString() },
    });

    // 6. Log
    await logWebhookExecution('asaas', 'payment_received', payload, { success: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    await logWebhookExecution('asaas', 'payment_received', {}, { error: error.message });
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

---

## 📋 SCHEMA UPDATES (Prisma Migrations)

### 1. Adicionar auditLog table

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  entity    String   @db.VarChar(50)    // 'quotation', 'payment', 'service_order'
  entityId  String   @db.VarChar(100)
  action    String   @db.VarChar(100)   // 'created', 'updated', 'automation_triggered'
  oldValue  Json?
  newValue  Json?
  createdAt DateTime @default(now())
  createdBy String?  @db.VarChar(100)

  @@index([entity])
  @@index([entityId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### 2. Adicionar campos Payment (reminders)

```prisma
model Payment {
  // ... existing fields
  remindersSent   Int      @default(0)     // count of reminders
  lastReminderAt  DateTime?
  notificationLog Json?    // log de notifications (WhatsApp, email)
}
```

### 3. Adicionar flags automação

```prisma
model ServiceOrder {
  // ... existing fields
  automationLog Json?     // track automation executions
  notificationsSent Json? // log of notifications
}

model Quotation {
  // ... existing fields
  expiryNotificationSent Boolean @default(false)
}
```

**Commands:**

```bash
cd frontend
npx prisma migrate dev --name add_audit_logs
npx prisma migrate dev --name enhance_payment_tracking
npx prisma migrate dev --name add_automation_logging
npx prisma db push  # se usar Neon
```

---

## 🧪 TESTING PATTERN

### Exemplo: Test para Automação

```typescript
// __tests__/automations/quotation-approved.test.ts

import { handleQuotationApproved } from '@/api/automations/quotation-approved';
import { prisma } from '@/lib/prisma';

describe('handleQuotationApproved', () => {
  it('should create service order when quotation is approved', async () => {
    // 1. Setup
    const customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        phone: '1234567890',
        addresses: JSON.stringify([
          { street: 'Rua A', number: '123', neighborhood: 'Centro', city: 'Blumenau', state: 'SC' }
        ]),
      },
    });

    const quotation = await prisma.quotation.create({
      data: {
        customerId: customer.id,
        total: 350.00,
        status: 'rascunho',
      },
    });

    // 2. Execute
    const result = await handleQuotationApproved(quotation.id);

    // 3. Assert
    expect(result.status).toBe('success');
    expect(result.serviceOrder).toBeDefined();
    expect(result.serviceOrder.number).toMatch(/^OS-\d{4}$/);

    // Verify in DB
    const dbServiceOrder = await prisma.serviceOrder.findUnique({
      where: { id: result.serviceOrder.id },
    });
    expect(dbServiceOrder?.status).toBe('agendada');
  });

  it('should not create duplicate service order', async () => {
    // ... similar setup
    const result1 = await handleQuotationApproved(quotation.id);
    const result2 = await handleQuotationApproved(quotation.id);

    expect(result2.status).toBe('skipped');
    expect(result2.reason).toBe('OS already exists');
  });
});
```

---

## ⚠️ ANTI-PATTERNS A EVITAR

### ❌ NÃO FAZER

```typescript
// 1. Sem validação JWT em automações
export async function PUT(request: NextRequest) {
  const body = await request.json();
  // ... sem validar token!
}

// 2. Sem tratamento de erro
await prisma.quotation.update({ ... });
// ... se erro, vai derrubar a request

// 3. Múltiplas conexões Prisma
const prisma1 = new PrismaClient();
const prisma2 = new PrismaClient();
// Vai vazar conexões

// 4. Notificações síncronas bloqueantes
await sendWhatsAppNotification(...); // vai lentificar request
return NextResponse.json(...);

// 5. Sem logging de automações
await createServiceOrder(...);
// Como debugar se der erro?

// 6. Status strings hardcoded
if (status === 'aceito') { ... }
if (status === 'aprovado') { ... }
// Inconsistência inevitável
```

### ✅ FAZER

```typescript
// 1. Sempre validar
if (!validateToken(request)) return Unauthorized();

// 2. Try-catch com logging
try {
  await prisma.quotation.update(...);
} catch (error) {
  await logAutomationError('quotation.update', error);
  return ErrorResponse(500);
}

// 3. Singleton Prisma
export const prisma = new PrismaClient();

// 4. Notificações assíncronas
// fire-and-forget com logging
sendWhatsAppNotification(...).catch(error => {
  console.error('Notification failed (non-blocking):', error);
});
return NextResponse.json(...);

// 5. Log tudo
await logAutomationExecution({
  type: 'quotation.approved',
  quotationId,
  result: 'success',
  timestamp: new Date(),
});

// 6. Constants para status
const QUOTATION_STATUS = {
  DRAFT: 'rascunho',
  APPROVED: 'aceito',
} as const;
if (status === QUOTATION_STATUS.APPROVED) { ... }
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Variáveis de ambiente configuradas:
  - `JWT_SECRET`
  - `DATABASE_URL`
  - `WHATSAPP_API_TOKEN` (se implementado)
  - `ASAAS_WEBHOOK_SECRET`
  - `CRON_SECRET`
  
- [ ] Prisma migrations rodadas: `npm run prisma:deploy`
- [ ] Testes passando: `npm test`
- [ ] Build sem erros: `npm run build`
- [ ] Vercel config (vercel.json) com cron jobs
- [ ] Webhooks registrados em provedores (Asaas, etc)
- [ ] Logs e monitoring ativados
- [ ] Rate limits configurados (WhatsApp, Asaas)
- [ ] Error tracking (Sentry, LogRocket, etc)

---

**Documento de referência para implementações seguras e escaláveis**