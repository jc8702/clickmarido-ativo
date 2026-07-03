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
      
      if (settings.logoUrl.startsWith('http')) {
        // Ao invés de redirect, baixar e servir a imagem diretamente (Proxy)
        // Isso previne que o browser bloqueie o carregamento do favicon por CORS ou redirect
        try {
          const response = await fetch(settings.logoUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = response.headers.get('content-type') || 'image/jpeg';
            
            return new NextResponse(buffer, {
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400'
              }
            });
          }
        } catch (fetchError) {
          console.error('Error fetching external logo:', fetchError);
        }
      }
      
      // Fallback redirect case
      return NextResponse.redirect(settings.logoUrl, { status: 302 });
    }

    // Fallback: redirecionar para um ícone padrão no public
    try {
      const fs = require('fs');
      const path = require('path');
      const fallbackPath = path.join(process.cwd(), 'public', 'logo.jpg');
      if (fs.existsSync(fallbackPath)) {
        const buffer = fs.readFileSync(fallbackPath);
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      }
    } catch (e) {
      console.error('Error reading fallback logo:', e);
    }
    
    const fallbackUrl = new URL('/logo.jpg', request.url);
    return NextResponse.redirect(fallbackUrl, { status: 302 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
