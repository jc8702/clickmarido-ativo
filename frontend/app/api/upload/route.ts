import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { uploadFile } from '@/lib/google-drive';

// Configurações de upload
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

export async function POST(request: NextRequest) {
  try {
    // Autenticação obrigatória
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const serviceOrderId = formData.get('serviceOrderId') as string;
    const type = (formData.get('type') as string) || 'geral';

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (!serviceOrderId) {
      return NextResponse.json({ error: 'serviceOrderId é obrigatório' }, { status: 400 });
    }

    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Arquivo excede o limite de ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validar MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de arquivo não permitido: ${file.type}. Tipos aceitos: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Verificar se a OS existe
    const order = await prisma.serviceOrder.findUnique({ where: { id: serviceOrderId } });
    if (!order) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let url = '';
    // Tentar fazer o upload para o Google Drive
    const driveResult = await uploadFile(buffer, file.name, file.type);
    if (driveResult.success && driveResult.url) {
      url = driveResult.url;
    } else {
      // Em produção, não usar fallback base64
      if (process.env.NODE_ENV === 'production') {
        console.error('[UPLOAD] Falha no upload para Google Drive em produção:', driveResult.error);
        return NextResponse.json(
          { error: 'Falha no upload. Tente novamente mais tarde.' },
          { status: 500 }
        );
      }
      // Em desenvolvimento, usar base64 como fallback
      console.warn('[UPLOAD] Fallback para Base64 local (desenvolvimento):', driveResult.error);
      const base64 = buffer.toString('base64');
      url = `data:${file.type};base64,${base64}`;
    }

    // Salvar referência no banco
    const photo = await prisma.serviceOrderPhoto.create({
      data: {
        serviceOrderId,
        url,
        fileName: file.name,
        type,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error('[UPLOAD] Erro ao fazer upload:', error);
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 });
  }
}
