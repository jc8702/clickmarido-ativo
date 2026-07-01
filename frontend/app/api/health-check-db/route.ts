import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const counts = {
      customers: await prisma.customer.count(),
      leads: await prisma.lead.count(),
      quotations: await prisma.quotation.count(),
      serviceOrders: await prisma.serviceOrder.count(),
      payments: await prisma.payment.count(),
      invoices: await prisma.invoice.count(),
      expenses: await prisma.expense.count(),
      purchaseOrders: await prisma.purchaseOrder.count(),
      appointments: await prisma.appointment.count(),
      users: await prisma.user.count(),
      technicians: await prisma.technician.count(),
    };
    
    // Buscar alguns registros recentes de cada tabela para auditar
    const sampleCustomers = await prisma.customer.findMany({ take: 3, select: { name: true, createdAt: true } });
    const sampleLeads = await prisma.lead.findMany({ take: 3, select: { name: true, funnelStage: true } });
    const sampleQuotations = await prisma.quotation.findMany({ take: 3, select: { total: true, status: true } });
    const sampleServiceOrders = await prisma.serviceOrder.findMany({ take: 3, select: { number: true, status: true } });

    return NextResponse.json({
      success: true,
      database: 'connected',
      counts,
      samples: {
        customers: sampleCustomers,
        leads: sampleLeads,
        quotations: sampleQuotations,
        serviceOrders: sampleServiceOrders,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
