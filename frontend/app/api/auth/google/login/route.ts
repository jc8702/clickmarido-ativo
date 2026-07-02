import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectURI = process.env.GOOGLE_REDIRECT_URI;

  if (!clientID || !clientSecret || !redirectURI) {
    return NextResponse.json(
      {
        error:
          'Configuração pendente: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI precisam estar definidos no .env para iniciar o fluxo.',
      },
      { status: 500 }
    );
  }

  try {
    const oAuth2Client = new google.auth.OAuth2(
      clientID,
      clientSecret,
      redirectURI
    );

    // Gera a URL do consentimento Google
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline', // Solicita refresh_token offline
      scope: ['https://www.googleapis.com/auth/gmail.send'], // Escopo restrito apenas para envio de e-mails
      prompt: 'consent', // Força a exibição da tela de consentimento para garantir o refresh_token
    });

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao gerar URL de autenticação', details: error.message },
      { status: 500 }
    );
  }
}
