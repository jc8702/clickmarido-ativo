import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'Código de autorização ("code") ausente na resposta do Google.' },
      { status: 400 }
    );
  }

  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectURI = process.env.GOOGLE_REDIRECT_URI;

  if (!clientID || !clientSecret || !redirectURI) {
    return NextResponse.json(
      { error: 'Configurações de cliente Google ausentes no arquivo .env.' },
      { status: 500 }
    );
  }

  try {
    const oAuth2Client = new google.auth.OAuth2(
      clientID,
      clientSecret,
      redirectURI
    );

    // Faz a troca do código de autorização pelos tokens
    const { tokens } = await oAuth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.json({
        success: true,
        warning:
          'Nenhum "refresh_token" foi retornado pelo Google. Isso costuma acontecer se a conta já foi autorizada antes. Para forçar a geração de um novo refresh_token, acesse https://myaccount.google.com/permissions, remova a permissão deste aplicativo e execute o login novamente.',
        tokens,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        'Autenticação realizada com sucesso! Copie o valor de "GOOGLE_GMAIL_REFRESH_TOKEN" abaixo e adicione-o no seu arquivo .env.',
      GOOGLE_GMAIL_REFRESH_TOKEN: tokens.refresh_token,
      tokens,
    });
  } catch (error: any) {
    console.error('Erro na troca do código de acesso por tokens:', error);
    return NextResponse.json(
      { error: 'Erro ao trocar código por tokens', details: error.message },
      { status: 500 }
    );
  }
}
