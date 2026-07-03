import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const settings = await prisma.companySettings.findFirst({
      select: { logoUrl: true }
    });

    if (settings?.logoUrl) {
      if (settings.logoUrl.startsWith('data:')) {
        // Extrair o tipo e os dados da string em Base64
        const matches = settings.logoUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=60'
            }
          });
        }
      }
      
      // Se for uma URL externa (ex: Google Drive), faz o redirect
      return NextResponse.redirect(settings.logoUrl, { status: 302 });
    }

    // Fallback: redirecionar para um ícone padrão no public
    const fallbackUrl = new URL('/logo.jpg', request.url);
    return NextResponse.redirect(fallbackUrl, { status: 302 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
