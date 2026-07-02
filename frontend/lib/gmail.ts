import { google } from 'googleapis';

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectURI = process.env.GOOGLE_REDIRECT_URI;
const refreshToken = process.env.GOOGLE_GMAIL_REFRESH_TOKEN;

// Instancia o cliente OAuth2 se as credenciais mínimas existirem
const oAuth2Client = new google.auth.OAuth2(
  clientID,
  clientSecret,
  redirectURI
);

if (refreshToken) {
  oAuth2Client.setCredentials({
    refresh_token: refreshToken,
  });
}

interface SendGmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envia um e-mail em formato HTML usando a API oficial do Gmail.
 * Requer o escopo: https://www.googleapis.com/auth/gmail.send
 */
export async function sendGmail({ to, subject, html }: SendGmailOptions) {
  if (!clientID || !clientSecret || !redirectURI) {
    throw new Error('Configuração pendente: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI precisam estar definidos no .env.');
  }

  if (!refreshToken) {
    throw new Error('Autenticação pendente: GOOGLE_GMAIL_REFRESH_TOKEN precisa estar definido no .env.');
  }

  try {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Monta a mensagem no padrão RFC 2822 com suporte a UTF-8 no assunto
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      html,
    ];
    const message = messageParts.join('\n');

    // Codifica para Base64 URL-safe (sem caracteres especiais de url e sem padding "=")
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return {
      success: true,
      messageId: res.data.id,
      threadId: res.data.threadId,
    };
  } catch (error: any) {
    console.error('Erro no envio via Gmail API:', error);
    throw new Error(
      error.response?.data?.error?.message ||
      error.message ||
      'Erro desconhecido ao enviar e-mail via Gmail API'
    );
  }
}
