import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) {
      return NextResponse.json({ error: 'ID da cotação não fornecido' }, { status: 400 });
    }

    const body = await request.json();
    const { signatureName } = body;

    if (!signatureName || signatureName.trim() === '') {
      return NextResponse.json({ error: 'Nome para assinatura é obrigatório' }, { status: 400 });
    }

    // Buscar a cotação
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Cotação não encontrada' }, { status: 404 });
    }

    if (quotation.status === 'aceito') {
      return NextResponse.json({ error: 'Esta cotação já foi aprovada anteriormente' }, { status: 400 });
    }

    // Coletar IP do cliente
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'IP não disponível';

    // 1. Atualizar a cotação
    const updatedQuotation = await prisma.quotation.update({
      where: { id },
      data: {
        status: 'aceito',
        approvedAt: new Date(),
        approvedBy: signatureName,
        approvalIp: ip,
        signatureImage: body.signatureImage || null,
        notes: quotation.notes ? `${quotation.notes}\nAssinado digitalmente por: ${signatureName}` : `Assinado digitalmente por: ${signatureName}`,
      },
    });

    // 2. Gerar a Ordem de Serviço automaticamente
    const existingOS = await prisma.serviceOrder.findUnique({
      where: { quotationId: id },
    });

    if (!existingOS) {
      // Buscar o primeiro endereço do cliente para a OS
      let address = '';
      try {
        const addresses = Array.isArray(quotation.customer.addresses) 
          ? quotation.customer.addresses 
          : JSON.parse((quotation.customer.addresses as string) || '[]');
        
        const firstAddress = addresses[0];
        if (firstAddress) {
          address = [
            firstAddress.street, 
            firstAddress.number, 
            firstAddress.neighborhood, 
            firstAddress.city, 
            firstAddress.state
          ].filter(Boolean).join(', ');
        }
      } catch (e) {
        console.error('Erro ao processar endereço do cliente para OS:', e);
      }

      // Gerar número sequencial da OS
      const lastOS = await prisma.serviceOrder.findFirst({
        orderBy: { number: 'desc' },
        select: { number: true },
      });
      
      let osNumber = 'OS-0001';
      if (lastOS) {
        const match = lastOS.number.match(/(\d+)$/);
        if (match) {
          osNumber = `OS-${String(parseInt(match[1], 10) + 1).padStart(4, '0')}`;
        }
      }

      // Encontrar técnico correspondente
      let technicianId = null;
      try {
        const itemWithCategory = await prisma.quotationItem.findFirst({
          where: { quotationId: id },
          include: { product: true }
        });

        if (itemWithCategory?.product?.category) {
          const matchingTechnician = await prisma.technician.findFirst({
            where: {
              active: true,
              specialty: {
                contains: itemWithCategory.product.category,
                mode: 'insensitive'
              }
            }
          });
          if (matchingTechnician) {
            technicianId = matchingTechnician.id;
          }
        }
      } catch (err) {
        console.error('Erro ao buscar tecnico', err);
      }

      // Criar a OS
      const osData: any = {
        number: osNumber,
        quotationId: id,
        customerId: quotation.customerId,
        status: 'agendada',
        address,
        finalTotal: quotation.total,
        notes: `Gerado automaticamente via aprovação digital pelo cliente (${signatureName}).`,
      };

      if (technicianId) {
        osData.technicianId = technicianId;
      }

      await prisma.serviceOrder.create({
        data: osData,
      });
    }

    return NextResponse.json({ success: true, message: 'Proposta aprovada com sucesso!' });
  } catch (error) {
    console.error('Erro na aprovação pública da cotação:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno ao tentar aprovar a proposta' }, { status: 500 });
  }
}
