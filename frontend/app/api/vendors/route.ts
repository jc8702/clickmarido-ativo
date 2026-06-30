import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { validateToken } from '@/lib/auth';

// GET /api/vendors - Listar fornecedores
export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const isBlocked = searchParams.get('isBlocked');
    const category = searchParams.get('category');
    const classification = searchParams.get('classification');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true';
    if (isBlocked !== null && isBlocked !== undefined) where.isBlocked = isBlocked === 'true';
    if (category) where.category = category;
    if (classification) where.classification = classification;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tradeName: { contains: search, mode: 'insensitive' } },
        { cnpjCpf: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          _count: { select: { expenses: true, purchaseOrders: true } },
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.vendor.count({ where }),
    ]);

    return NextResponse.json({
      data: vendors,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/vendors error:', error);
    return NextResponse.json({ error: 'Erro ao listar fornecedores' }, { status: 500 });
  }
}

// POST /api/vendors - Criar fornecedor
export async function POST(request: NextRequest) {
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
      isBlocked,
      notes
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    // Verificar se CNPJ/CPF já existe
    if (cnpjCpf) {
      const existingVendor = await prisma.vendor.findUnique({
        where: { cnpjCpf },
      });

      if (existingVendor) {
        return NextResponse.json(
          { error: 'Já existe fornecedor com este CNPJ/CPF' },
          { status: 400 }
        );
      }
    }

    const vendor = await prisma.vendor.create({
      data: {
        name,
        tradeName: tradeName || '',
        email: email || '',
        phone: phone || '',
        whatsapp: whatsapp || '',
        cnpjCpf: cnpjCpf || null,
        stateRegistration: stateRegistration || '',
        municipalRegistration: municipalRegistration || '',
        address: address || '',
        contactName: contactName || '',
        category: category || 'OUTROS',
        classification: classification || 'B',
        paymentTerms: paymentTerms || '',
        averageDeliveryDays: averageDeliveryDays !== undefined && averageDeliveryDays !== null ? parseInt(averageDeliveryDays) : 0,
        isBlocked: isBlocked === true,
        notes: notes || '',
        isActive: true,
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/vendors error:', error);
    return NextResponse.json({ error: 'Erro ao criar fornecedor' }, { status: 500 });
  }
}
