import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceOrderId = searchParams.get('serviceOrderId');

    if (!serviceOrderId) {
      return NextResponse.json({ error: 'serviceOrderId é obrigatório' }, { status: 400 });
    }

    const mediaList = await prisma.media.findMany({
      where: {
        serviceOrderId,
        deletedAt: null,
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ data: mediaList });
  } catch (error: any) {
    console.error('GET /api/media error:', error);
    return NextResponse.json({ error: 'Erro ao listar mídias' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const userId = auth.user.userId;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const serviceOrderId = formData.get('serviceOrderId') as string;
    const type = (formData.get('type') as string) || 'geral';
    const caption = formData.get('caption') as string;
    const geoLocation = formData.get('geoLocation') as string;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (!serviceOrderId) {
      return NextResponse.json({ error: 'serviceOrderId é obrigatório' }, { status: 400 });
    }

    // Verificar se a OS existe
    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
    });

    if (!serviceOrder) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }

    // Converter para Base64 (Armazenamento em banco/dataURL conforme padrão do projeto)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const fileUrl = `data:${file.type};base64,${base64}`;

    const media = await prisma.media.create({
      data: {
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        type,
        caption: caption || null,
        geoLocation: geoLocation || null,
        serviceOrderId,
        uploadedByUserId: userId,
      },
    });

    return NextResponse.json({ success: true, data: media }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/media error:', error);
    return NextResponse.json({ error: 'Erro ao criar mídia' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
