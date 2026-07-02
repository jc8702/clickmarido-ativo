const fs = require('fs');
const path = require('path');

// Função simples para carregar variáveis de ambiente
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  content.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (
        value.length > 0 &&
        value.charAt(0) === '"' &&
        value.charAt(value.length - 1) === '"'
      ) {
        value = value.substring(1, value.length - 1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

loadEnv(path.join(__dirname, '.env.local'));
loadEnv(path.join(__dirname, '.env'));

console.log('=== Validador e Visualizador de Layouts de E-mail ===\n');

const to = process.argv[2];
if (!to) {
  console.log(
    '[Erro] E-mail de destino não informado para os testes reais.'
  );
  console.log('Uso: node test_notifications.js seu-email-pessoal@example.com');
  process.exit(1);
}

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectURI = process.env.GOOGLE_REDIRECT_URI;
const refreshToken = process.env.GOOGLE_GMAIL_REFRESH_TOKEN;

if (!clientID || !clientSecret || !redirectURI || !refreshToken) {
  console.log(
    '[Erro] Credenciais Google ausentes no arquivo .env ou .env.local.'
  );
  process.exit(1);
}

// Layout HTML de e-mail unificado
function buildHtmlEmailMessage(template, variables, clientName) {
  let subject = 'Notificação - Click Marido';
  let title = 'Click Marido';
  let body = '';

  const buttonStyle =
    'display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;';

  switch (template) {
    case 'quotation_sent':
      subject = `Proposta Comercial de Serviço - Click Marido`;
      title = 'Sua Proposta Comercial está Pronta!';
      body = `
        <p>Olá <strong>${clientName}</strong>,</p>
        <p>Preparamos a proposta comercial de número <strong>#${
          variables.number || 'OS-0012'
        }</strong> conforme solicitado.</p>
        <p>Você pode visualizar o detalhamento completo dos serviços, valores e formas de pagamento clicando no botão abaixo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${
            variables.link || 'https://example.com'
          }" style="${buttonStyle}">Visualizar Proposta Comercial</a>
        </div>
        <p style="color: #666; font-size: 0.9em; line-height: 1.5;">Se tiver qualquer dúvida, responda a este e-mail ou entre em contato pelo nosso WhatsApp.</p>
      `;
      break;

    case 'service_order_completed':
      subject = `✅ Click Marido - Serviço Concluído e Avaliação`;
      title = 'Serviço Concluído!';
      body = `
        <p>Olá <strong>${clientName}</strong>,</p>
        <p>Sua Ordem de Serviço de número <strong>#${
          variables.number || 'OS-4321'
        }</strong> foi finalizada com sucesso por nossa equipe técnica.</p>
        <p>Agradecemos imensamente a preferência. Sua opinião é de extrema importância para nós!</p>
        <p>Por favor, dedique 1 minuto para preencher nossa pesquisa rápida de satisfação:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${
            variables.link || 'https://example.com/survey'
          }" style="${buttonStyle}">Avaliar Nosso Serviço</a>
        </div>
        <p style="color: #666; font-size: 0.9em; line-height: 1.5;">Muito obrigado por nos ajudar a melhorar continuamente!</p>
      `;
      break;

    case 'payment_pending':
      subject = `💵 Click Marido - Fatura Disponível para Pagamento`;
      title = 'Fatura Disponível';
      body = `
        <p>Olá <strong>${clientName}</strong>,</p>
        <p>A fatura referente ao serviço de número <strong>#${
          variables.number || 'OS-5678'
        }</strong> já está disponível para pagamento.</p>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #eaeaea; text-align: center;">
          <p style="margin: 5px 0; font-size: 1.1em; color: #4b5563;">Valor a ser pago:</p>
          <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #4f46e5;">R$ ${
            variables.amount || '150,00'
          }</p>
        </div>
        <p>Para efetuar o pagamento via PIX, Boleto ou Cartão, clique no botão abaixo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${
            variables.link || 'https://example.com/pay'
          }" style="${buttonStyle}">Pagar Fatura Online</a>
        </div>
      `;
      break;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="font-family: sans-serif; background-color: #f3f4f6; margin: 0; padding: 30px; -webkit-font-smoothing: antialiased;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); padding: 30px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Click Marido</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.85;">${title}</p>
        </div>
        <div style="padding: 30px; color: #374151; font-size: 16px; line-height: 1.6;">
          ${body}
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eaeaea; font-size: 12px; color: #9ca3af;">
          <p style="margin: 0 0 5px 0;">&copy; ${new Date().getFullYear()} Click Marido CRM. Todos os direitos reservados.</p>
          <p style="margin: 0;">Este é um e-mail automático enviado pelo sistema Click Marido.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

// Execução de disparo dos templates
async function runTest() {
  const { google } = require('googleapis');
  const oAuth2Client = new google.auth.OAuth2(
    clientID,
    clientSecret,
    redirectURI
  );
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  const templates = ['quotation_sent', 'service_order_completed', 'payment_pending'];

  console.log(`Disparando os 3 templates de teste para: ${to}...\n`);

  for (const template of templates) {
    try {
      const { subject, html } = buildHtmlEmailMessage(
        template,
        {
          number: '9999',
          amount: '280,00',
          link: 'https://clickmarido-ativo-frontend.vercel.app/survey/test',
        },
        'José Carlos (Cliente de Teste)'
      );

      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString(
        'base64'
      )}?=`;
      const messageParts = [
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        html,
      ];
      const message = messageParts.join('\n');
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage },
      });

      console.log(
        `[Sucesso] Template "${template}" enviado. ID: ${res.data.id}`
      );
    } catch (err) {
      console.error(
        `[Erro] Falha ao enviar template "${template}":`,
        err.message
      );
    }
  }

  console.log('\nTodos os testes finalizados.');
}

runTest();
