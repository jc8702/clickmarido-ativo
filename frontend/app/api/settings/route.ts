import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    let settings = await prisma.companySettings.findFirst();

    if (!settings) {
      // Criar o primeiro registro padrão se não existir
      settings = await prisma.companySettings.create({
        data: {
          companyName: 'Click Marido',
          cnpj: '12.345.678/0001-90',
          phone: '(47) 99999-9999',
          email: 'contato@clickmarido.local',
          address: 'Rua das Flores, 123 - Centro, Blumenau - SC',
          defaultHourlyRate: 80.0,
          defaultWarranty: '90 dias nos termos do art. 26, II do CDC.',
          defaultCommissionRate: 40.0,
        },
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}

export async function PUT(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const existing = await prisma.companySettings.findFirst();

    let settings;
    if (existing) {
      settings = await prisma.companySettings.update({
        where: { id: existing.id },
        data: {
          companyName: body.companyName ?? existing.companyName,
          cnpj: body.cnpj !== undefined ? body.cnpj : existing.cnpj,
          phone: body.phone !== undefined ? body.phone : existing.phone,
          email: body.email !== undefined ? body.email : existing.email,
          address: body.address !== undefined ? body.address : existing.address,
          defaultHourlyRate: body.defaultHourlyRate !== undefined ? parseFloat(body.defaultHourlyRate) : existing.defaultHourlyRate,
          defaultWarranty: body.defaultWarranty !== undefined ? body.defaultWarranty : existing.defaultWarranty,
          defaultCommissionRate: body.defaultCommissionRate !== undefined ? parseFloat(body.defaultCommissionRate) : existing.defaultCommissionRate,
          logoUrl: body.logoUrl !== undefined ? body.logoUrl : existing.logoUrl,
        },
      });
    } else {
      settings = await prisma.companySettings.create({
        data: {
          companyName: body.companyName ?? 'Click Marido',
          cnpj: body.cnpj ?? '',
          phone: body.phone ?? '',
          email: body.email ?? '',
          address: body.address ?? '',
          defaultHourlyRate: body.defaultHourlyRate !== undefined ? parseFloat(body.defaultHourlyRate) : 80.0,
          defaultWarranty: body.defaultWarranty ?? '90 dias nos termos do art. 26, II do CDC.',
          defaultCommissionRate: body.defaultCommissionRate !== undefined ? parseFloat(body.defaultCommissionRate) : 40.0,
          logoUrl: body.logoUrl ?? null,
        },
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
}
}