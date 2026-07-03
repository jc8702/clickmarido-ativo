import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Converte links de visualização do Google Drive para links de download direto
function getDirectDriveUrl(url: string): string {
  if (url.includes('drive.google.com')) {
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
    }
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
    }
  }
  return url;
}

export async function GET(request: Request) {
  try {
    const settings = await prisma.companySettings.findFirst({
      select: { logoUrl: true }
    });

    if (settings?.logoUrl) {
      // 1. Imagem em Base64
      if (settings.logoUrl.startsWith('data:')) {
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
      
      // 2. URL Externa (ex: Google Drive, S3, Asaas)
      if (settings.logoUrl.startsWith('http')) {
        try {
          const targetUrl = getDirectDriveUrl(settings.logoUrl);
          const response = await fetch(targetUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = response.headers.get('content-type') || 'image/jpeg';
            
            if (contentType.startsWith('image/')) {
              return new NextResponse(buffer, {
                headers: {
                  'Content-Type': contentType,
                  'Cache-Control': 'public, max-age=86400'
                }
              });
            } else {
              console.warn('Fetched URL content-type is not an image:', contentType);
            }
          }
        } catch (fetchError) {
          console.error('Error fetching external logo:', fetchError);
        }
      }
    }

    // 3. Fallback: Proxy da imagem padrão /logo.jpg usando fetch interno no CDN
    try {
      const fallbackUrl = new URL('/logo.jpg', request.url);
      const fallbackResponse = await fetch(fallbackUrl.toString());
      if (fallbackResponse.ok) {
        const arrayBuffer = await fallbackResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = fallbackResponse.headers.get('content-type') || 'image/jpeg';
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400'
          }
        });
      }
    } catch (fallbackError) {
      console.error('Error fetching fallback logo:', fallbackError);
    }

    // 4. Último recurso (redirect caso o fetch falhe gravemente)
    const fallbackUrl = new URL('/logo.jpg', request.url);
    return NextResponse.redirect(fallbackUrl, { status: 302 });
  } catch (error) {
    console.error('API Favicon general error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
