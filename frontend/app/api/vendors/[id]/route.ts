import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

function validateToken(request: NextRequest) {
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
