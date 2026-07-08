import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { validateToken } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/vendors/[id] - Buscar fornecedor por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        expenses: {
          orderBy: { expenseDate: 'desc' },
          take: 10,
        },
        purchaseOrders: {
          orderBy: { issueDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 });
    }

    return NextResponse.json(vendor);
  } catch (error) {
    console.error('GET /api/vendors/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao buscar fornecedor' }, { status: 500 });
  }
}

// PUT /api/vendors/[id] - Editar fornecedor
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      tradeName,
      email,
      phone,
      whatsapp,
      cnpjCpf,
      stateRegistration,
      municipalRegistration,
      address,
      contactName,
      category,
      classification,
      paymentTerms,
      averageDeliveryDays,
      isActive,
      isBlocked,
      notes
    } = body;

    const existingVendor = await prisma.vendor.findUnique({
      where: { id },
    });

    if (!existingVendor) {
      return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 });
    }

    // Verificar se CNPJ/CPF já existe em outro fornecedor
    if (cnpjCpf && cnpjCpf !== existingVendor.cnpjCpf) {
      const duplicateVendor = await prisma.vendor.findUnique({
        where: { cnpjCpf },
      });

      if (duplicateVendor) {
        return NextResponse.json(
          { error: 'Já existe fornecedor com este CNPJ/CPF' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (tradeName !== undefined) updateData.tradeName = tradeName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
    if (cnpjCpf !== undefined) updateData.cnpjCpf = cnpjCpf || null;
    if (stateRegistration !== undefined) updateData.stateRegistration = stateRegistration;
    if (municipalRegistration !== undefined) updateData.municipalRegistration = municipalRegistration;
    if (address !== undefined) updateData.address = address;
    if (contactName !== undefined) updateData.contactName = contactName;
    if (category !== undefined) updateData.category = category;
    if (classification !== undefined) updateData.classification = classification;
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
    if (averageDeliveryDays !== undefined) {
      updateData.averageDeliveryDays = averageDeliveryDays !== null ? parseInt(averageDeliveryDays) : 0;
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked;
    if (notes !== undefined) updateData.notes = notes;

    const vendor = await prisma.vendor.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(vendor);
  } catch (error) {
    console.error('PUT /api/vendors/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar fornecedor' }, { status: 500 });
  }
}

// DELETE /api/vendors/[id] - Excluir fornecedor
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 1. Verificar se existem ordens de compra vinculadas
    const purchaseOrdersCount = await prisma.purchaseOrder.count({
      where: { vendorId: id },
    });

    if (purchaseOrdersCount > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir o fornecedor porque existem ordens de compra associadas a ele. Sugerimos desativar o cadastro.' },
        { status: 400 }
      );
    }

    // 2. Usar transação para garantir integridade referencial ao excluir o fornecedor
    await prisma.$transaction(async (tx) => {
      // Desvincular despesas (Expense)
      await tx.expense.updateMany({
        where: { vendorId: id },
        data: { vendorId: null },
      });

      // Desvincular produtos (Product)
      await tx.product.updateMany({
        where: { vendorId: id },
        data: { vendorId: null },
      });

      // Excluir o fornecedor
      await tx.vendor.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: 'Fornecedor excluído com sucesso' });
  } catch (error) {
    console.error('DELETE /api/vendors/[id] error:', error);
    return NextResponse.json({ error: 'Erro ao excluir fornecedor' }, { status: 500 });
  }
}
