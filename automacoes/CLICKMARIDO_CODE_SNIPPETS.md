# CLICK MARIDO - CODE SNIPPETS PRONTOS (COPIAR/COLAR)

---

## 🎯 SNIPPET 1: Sidebar.tsx (Novo Componente)

**Arquivo:** `frontend/components/Sidebar.tsx`

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  links: NavLink[];
  logo?: React.ReactNode;
  user?: { name: string; email: string };
  onLogout?: () => void;
}

export function Sidebar({
  isOpen,
  onToggle,
  links,
  logo,
  user,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname() ?? '/';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load sidebar state from localStorage
    const saved = localStorage.getItem('sidebarOpen');
    if (saved === 'false') {
      onToggle();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', String(isOpen));
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 md:w-auto
          transition-all duration-300
          bg-white dark:bg-neutral-900
          border-r border-neutral-200 dark:border-neutral-700
          flex flex-col
          ${isOpen ? 'md:w-64' : 'md:w-20'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-6 border-b border-neutral-200 dark:border-neutral-700">
          {isOpen && logo && (
            <div className="text-lg font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              {logo}
            </div>
          )}
          {!isOpen && logo && (
            <div className="text-sm font-bold text-center w-full">CM</div>
          )}
          
          <button
            onClick={onToggle}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Toggle sidebar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={isOpen ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
              />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 768) {
                    onToggle();
                  }
                }}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg
                  transition-all duration-200 select-none whitespace-nowrap
                  ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }
                `}
                title={!isOpen ? link.label : undefined}
              >
                <span className="flex-shrink-0 w-5 h-5">{link.icon}</span>
                {isOpen && <span className="text-sm font-medium">{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer: User Info */}
        {user && (
          <div className="border-t border-neutral-200 dark:border-neutral-700 px-3 py-4 space-y-3">
            {isOpen ? (
              <>
                <div className="px-2 py-1">
                  <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {user.name}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {user.email}
                  </div>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="w-full px-3 py-2 rounded-lg text-sm font-medium
                      border border-neutral-200 dark:border-neutral-700
                      text-neutral-600 dark:text-neutral-400
                      hover:bg-neutral-50 dark:hover:bg-neutral-800
                      transition-colors"
                  >
                    Sair
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={onLogout}
                className="w-full p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800
                  transition-colors text-neutral-600 dark:text-neutral-400"
                title="Logout"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
```

---

## 🎯 SNIPPET 2: Dashboard Layout Refatorado

**Arquivo:** `frontend/app/(dashboard)/layout.jsx`

```javascript
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';

// Default icons (copiar do Navigation.tsx)
const defaultIcons = {
  'Dashboard': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
    </svg>
  ),
  'Clientes': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  'Orçamentos': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  'Serviços e Peças': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  'Ordens de Serviço': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  'Pagamentos': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  'Garantias': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  'Financeiro': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'Faturamento': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  'Despesas': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const navigationLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: defaultIcons['Dashboard'] },
  { href: '/customers', label: 'Clientes', icon: defaultIcons['Clientes'] },
  { href: '/quotations', label: 'Orçamentos', icon: defaultIcons['Orçamentos'] },
  { href: '/products', label: 'Serviços e Peças', icon: defaultIcons['Serviços e Peças'] },
  { href: '/service-orders', label: 'Ordens de Serviço', icon: defaultIcons['Ordens de Serviço'] },
  { href: '/payments', label: 'Pagamentos', icon: defaultIcons['Pagamentos'] },
  { href: '/warranties', label: 'Garantias', icon: defaultIcons['Garantias'] },
];

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Redirect to login if not authenticated
  if (!loading && !user) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleLogout = useCallback(() => {
    logout?.();
    router.push('/login');
  }, [logout, router]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-white dark:bg-neutral-950">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleToggleSidebar}
        links={navigationLinks}
        logo="Click Marido"
        user={user ? { name: user.name, email: user.email } : undefined}
        onLogout={handleLogout}
      />

      <main
        className="flex-1 overflow-auto transition-all duration-300"
        style={{
          marginLeft: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : undefined,
        }}
      >
        {children}
      </main>
    </div>
  );
}
```

---

## 🎯 SNIPPET 3: Prisma Singleton

**Arquivo:** `frontend/lib/prisma.ts` (NOVO)

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = prisma;

export default prisma;
```

---

## 🎯 SNIPPET 4: Automação Service Order Complete → Payment

**Arquivo:** `frontend/app/api/automations/service-order-completed.ts` (NOVO)

```typescript
import { prisma } from '@/lib/prisma';

interface AutomationResult {
  status: 'success' | 'skipped' | 'error';
  reason?: string;
  paymentId?: string;
  error?: string;
}

export async function handleServiceOrderCompleted(
  serviceOrderId: string
): Promise<AutomationResult> {
  try {
    // 1. Fetch service order
    const serviceOrder = await prisma.serviceOrder.findUniqueOrThrow({
      where: { id: serviceOrderId },
      include: { quotation: true, customer: true },
    });

    // 2. Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: { quotationId: serviceOrder.quotationId },
    });

    if (existingPayment) {
      return {
        status: 'skipped',
        reason: 'Payment already exists',
        paymentId: existingPayment.id,
      };
    }

    // 3. Create payment
    const payment = await prisma.payment.create({
      data: {
        quotationId: serviceOrder.quotationId,
        customerId: serviceOrder.customerId,
        amount: serviceOrder.finalTotal,
        method: 'pix',
        status: 'pendente',
        description: `Pagamento - Orçamento ${serviceOrder.quotationId.slice(-6).toUpperCase()}`,
      },
    });

    // 4. Log automation execution
    await logAutomationExecution({
      type: 'service_order.completed',
      entityId: serviceOrderId,
      action: 'create_payment',
      result: 'success',
      metadata: { paymentId: payment.id },
    });

    return {
      status: 'success',
      paymentId: payment.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await logAutomationExecution({
      type: 'service_order.completed',
      entityId: serviceOrderId,
      action: 'create_payment',
      result: 'error',
      metadata: { error: errorMessage },
    });

    return {
      status: 'error',
      error: errorMessage,
    };
  }
}

async function logAutomationExecution(data: any) {
  try {
    // Implement based on your AuditLog schema
    console.log('[AUTOMATION]', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to log automation:', error);
  }
}
```

---

## 🎯 SNIPPET 5: Integrar Automação em Service Order Update

**Arquivo:** `frontend/app/api/service-orders/[id]/route.ts` (MODIFICAR)

```typescript
// ... imports

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { technicianId, scheduledTime, address, notes, finalTotal, status } = body;

    const updateData: any = {};
    if (technicianId !== undefined) updateData.technicianId = technicianId;
    if (scheduledTime !== undefined) updateData.scheduledTime = new Date(scheduledTime);
    if (address !== undefined) updateData.address = address;
    if (notes !== undefined) updateData.notes = notes;
    if (finalTotal !== undefined) updateData.finalTotal = Number(finalTotal);
    if (status !== undefined) updateData.status = status;

    // Fetch current order to track status change
    const currentOrder = await prisma.serviceOrder.findUniqueOrThrow({
      where: { id },
    });

    const order = await prisma.serviceOrder.update({
      where: { id },
      data: updateData,
      include: { customer: true, technician: true, quotation: true },
    });

    // TRIGGER: Automação se status mudou para 'concluída'
    if (status === 'concluída' && currentOrder.status !== 'concluída') {
      try {
        const { handleServiceOrderCompleted } = await import('@/app/api/automations/service-order-completed');
        const result = await handleServiceOrderCompleted(id);
        console.log('[AUTOMATION TRIGGER] Service order completed:', result);
      } catch (error) {
        console.error('[AUTOMATION ERROR] Failed to trigger service order automation:', error);
        // Continue (não falhar a requisição)
      }
    }

    return NextResponse.json(order);

  } catch (error: any) {
    console.error('PUT /api/service-orders/[id] error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'OS não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro ao atualizar OS' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
```

---

## 🎯 SNIPPET 6: WhatsApp Notification Utility

**Arquivo:** `frontend/lib/notifications/whatsapp.ts` (NOVO)

```typescript
type WhatsAppTemplate =
  | 'quotation_approved'
  | 'service_order_created'
  | 'service_order_completed'
  | 'payment_pending'
  | 'payment_reminder'
  | 'payment_received'
  | 'warranty_expiring';

interface NotificationPayload {
  phone: string;
  template: WhatsAppTemplate;
  variables: Record<string, string>;
}

interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send WhatsApp notification via Meta WhatsApp Business API
 * Requires WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID env vars
 */
export async function sendWhatsAppNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn('[WHATSAPP] Missing credentials, skipping notification');
    return { success: false, error: 'Missing credentials' };
  }

  try {
    // Clean phone number: remove non-digits, add country code
    const cleanPhone = payload.phone.replace(/\D/g, '');
    const toPhone = cleanPhone.startsWith('55')
      ? cleanPhone
      : `55${cleanPhone}`;

    // Map variables to template parameters
    const templateParams = Object.values(payload.variables).map(value => ({
      type: 'text',
      text: value,
    }));

    const response = await fetch(
      `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: toPhone,
          type: 'template',
          template: {
            name: payload.template,
            language: { code: 'pt_BR' },
            components: [
              {
                type: 'body',
                parameters: templateParams,
              },
            ],
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message || `HTTP ${response.status}`;
      console.error(`[WHATSAPP] Error: ${errorMsg}`, data);
      return { success: false, error: errorMsg };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[WHATSAPP] Exception:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Send notification (fire-and-forget, non-blocking)
 */
export function fireAndForgetNotification(payload: NotificationPayload): void {
  sendWhatsAppNotification(payload).catch(error => {
    console.error('[WHATSAPP] Fire-and-forget failed:', error);
  });
}
```

---

## 🎯 SNIPPET 7: Vercel Cron Job Config

**Arquivo:** `vercel.json` (CRIAR/MODIFICAR)

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "devCommand": "npm run dev",
  "crons": [
    {
      "path": "/api/cron/payment-reminders",
      "schedule": "0 10 * * *"
    },
    {
      "path": "/api/cron/warranty-expiry-check",
      "schedule": "0 09 * * *"
    },
    {
      "path": "/api/cron/quotation-expiry-check",
      "schedule": "0 08 * * *"
    },
    {
      "path": "/api/cron/daily-report",
      "schedule": "0 18 * * *"
    }
  ]
}
```

---

## 🎯 SNIPPET 8: Cron Job - Payment Reminders

**Arquivo:** `frontend/app/api/cron/payment-reminders/route.ts` (NOVO)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppNotification } from '@/lib/notifications/whatsapp';

export async function GET(request: NextRequest) {
  // Validate Vercel cron auth
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // Find pending payments older than 3 days
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'pendente',
        createdAt: { lt: threeDaysAgo },
      },
      include: {
        customer: true,
        quotation: true,
      },
    });

    let sentCount = 0;

    for (const payment of pendingPayments) {
      try {
        // Send reminder
        const result = await sendWhatsAppNotification({
          phone: payment.customer.phone,
          template: 'payment_reminder',
          variables: {
            customer_name: payment.customer.name,
            amount: `R$ ${payment.amount.toFixed(2)}`,
            days_pending: Math.floor(
              (now.getTime() - payment.createdAt.getTime()) / (24 * 60 * 60 * 1000)
            ).toString(),
          },
        });

        if (result.success) {
          // Update reminder tracking
          const reminders = payment.remindersSent || 0;
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              remindersSent: reminders + 1,
              lastReminderAt: new Date(),
            },
          });
          sentCount++;
        }
      } catch (error) {
        console.error(`Failed to send reminder for payment ${payment.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      totalPaymentsPending: pendingPayments.length,
      remindersSent: sentCount,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}
```

---

## 🎯 SNIPPET 9: Webhook Asaas Payment Received

**Arquivo:** `frontend/app/api/webhooks/asaas/route.ts` (NOVO)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { fireAndForgetNotification } from '@/lib/notifications/whatsapp';

export async function POST(request: NextRequest) {
  try {
    // 1. Validate Asaas signature
    const signature = request.headers.get('asaas-signature');
    const body = await request.text();

    const expectedSignature = crypto
      .createHmac('sha256', process.env.ASAAS_WEBHOOK_SECRET || '')
      .update(body)
      .digest('hex');

    if (!signature || signature !== expectedSignature) {
      console.warn('[WEBHOOK] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Parse payload
    const payload = JSON.parse(body);

    if (payload.event !== 'PAYMENT_RECEIVED') {
      return NextResponse.json({ status: 'ignored', event: payload.event });
    }

    // 3. Find payment in DB
    const payment = await prisma.payment.findFirst({
      where: { pixCode: payload.pixCode },
      include: { quotation: true, customer: true },
    });

    if (!payment) {
      console.warn(`[WEBHOOK] Payment not found for pixCode: ${payload.pixCode}`);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // 4. Update payment status
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'pago',
        paidAt: new Date(payload.confirmedDate || new Date()),
      },
      include: { quotation: true, customer: true },
    });

    // 5. Update service order to 'concluída'
    if (payment.quotation) {
      await prisma.serviceOrder.updateMany({
        where: { quotationId: payment.quotationId },
        data: { status: 'concluída' },
      });
    }

    // 6. Send notification (non-blocking)
    fireAndForgetNotification({
      phone: updated.customer.phone,
      template: 'payment_received',
      variables: {
        customer_name: updated.customer.name,
        amount: `R$ ${updated.amount.toFixed(2)}`,
      },
    });

    // 7. Log
    console.log('[WEBHOOK] Payment received:', {
      paymentId: payment.id,
      amount: updated.amount,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[WEBHOOK] Error processing payment:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}
```

---

## ✅ RESUMO: ORDEM DE IMPLEMENTAÇÃO

```
1. Criar Sidebar.tsx (SNIPPET 1)
2. Refatorar layout dashboard (SNIPPET 2)
3. Criar Prisma singleton (SNIPPET 3)
4. Criar automação service-order-completed (SNIPPET 4)
5. Atualizar PUT /service-orders/[id] (SNIPPET 5)
6. Criar lib/notifications/whatsapp.ts (SNIPPET 6)
7. Configurar vercel.json com cron jobs (SNIPPET 7)
8. Implementar cron job payment-reminders (SNIPPET 8)
9. Implementar webhook Asaas (SNIPPET 9)

Teste cada um antes de passar para o próximo.
```

---

**Snippets prontos para produção**