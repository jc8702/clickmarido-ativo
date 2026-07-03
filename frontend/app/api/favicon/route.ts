import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const settings = await prisma.companySettings.findFirst({
      select: { logoUrl: true }
    });

    if (settings?.logoUrl) {
      // Se for uma URL do drive (ou base64), vamos fazer um redirect temporário para a imagem real
      // Redirecionamento 302 permite que o browser atualize quando a imagem mudar
      return NextResponse.redirect(settings.logoUrl, { status: 302 });
    }

    // Fallback: redirecionar para um ícone padrão no public
    const fallbackUrl = new URL('/logo.jpg', request.url);
    return NextResponse.redirect(fallbackUrl, { status: 302 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
