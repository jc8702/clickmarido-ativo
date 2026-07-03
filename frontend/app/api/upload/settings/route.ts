import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { uploadFile } from '@/lib/google-drive';

// Configurações de upload
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB para logo
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
];

export async function POST(request: NextRequest) {
  try {
    // Autenticação obrigatória (apenas admin para settings seria o ideal)
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
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
        { error: `Tipo de arquivo não permitido: ${file.type}. Tipos aceitos: JPG, PNG, WEBP, GIF, SVG` },
        { status: 400 }
      );
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
      // Em caso de falha no Google Drive, faz o fallback para Base64 (mesmo em produção) para garantir o funcionamento
      console.warn('[UPLOAD] Fallback para Base64:', driveResult.error);
      const base64 = buffer.toString('base64');
      url = `data:${file.type};base64,${base64}`;
    }

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error('[UPLOAD SETTINGS] Erro ao fazer upload:', error);
    return NextResponse.json({ error: 'Erro ao fazer upload da logo' }, { status: 500 });
  }
}
