import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { uploadFile } from '@/lib/google-drive';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

function validateToken(request: NextRequest) {
  if (!JWT_SECRET) return null;
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    jwt.verify(authHeader.substring(7), JWT_SECRET);
    return true;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const serviceOrderId = formData.get('serviceOrderId') as string;
    const type = formData.get('type') as string || 'geral';

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (!serviceOrderId) {
      return NextResponse.json({ error: 'serviceOrderId é obrigatório' }, { status: 400 });
    }

    // Verificar se a OS existe
    const order = await prisma.serviceOrder.findUnique({ where: { id: serviceOrderId } });
    if (!order) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload para Google Drive
    const result = await uploadFile(buffer, file.name, file.type, undefined);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Erro ao fazer upload' }, { status: 500 });
    }

    // Salvar referência no banco
    const photo = await prisma.serviceOrderPhoto.create({
      data: {
        serviceOrderId,
        url: result.url || '',
        fileName: result.fileName || file.name,
        type,
      },
    });

    return NextResponse.json(photo, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/upload error:', error);
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
