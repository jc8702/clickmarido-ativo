const fs = require('fs');
const path = require('path');

// Função simples para carregar variáveis de ambiente de um arquivo .env sem dependência externa
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

console.log('=== Validador de Configuração Google Calendar API ===\n');
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectURI = process.env.GOOGLE_REDIRECT_URI;
const refreshToken = process.env.GOOGLE_GMAIL_REFRESH_TOKEN;

console.log('GOOGLE_CLIENT_ID:            ', clientID ? 'OK' : 'FALTA');
console.log('GOOGLE_CLIENT_SECRET:        ', clientSecret ? 'OK' : 'FALTA');
console.log('GOOGLE_REDIRECT_URI:         ', redirectURI ? `OK (${redirectURI})` : 'FALTA');
console.log('GOOGLE_GMAIL_REFRESH_TOKEN:  ', refreshToken ? 'OK' : 'FALTA');

if (!clientID || !clientSecret || !redirectURI || !refreshToken) {
  console.log('\n[Aviso] Preencha as chaves no arquivo .env.local.');
  process.exit(1);
}

const { google } = require('googleapis');

const oAuth2Client = new google.auth.OAuth2(
  clientID,
  clientSecret,
  redirectURI
);
oAuth2Client.setCredentials({ refresh_token: refreshToken });

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

async function runTest() {
  try {
    console.log('\nIniciando criação de evento de teste no Google Calendar...');
    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hora depois

    const res = await calendar.events.insert({
      calendarId: 'primary',
      sendUpdates: 'all',
      requestBody: {
        summary: 'Teste de Integração Click Marido CRM',
        description: 'Se você está vendo este evento, a integração com o Google Calendar funcionou com sucesso!',
        start: {
          dateTime: start.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        attendees: [
          { email: 'clickmarido@gmail.com' } // Convidando a si mesmo para testar
        ]
      }
    });

    console.log('\n[SUCESSO] Evento criado com sucesso!');
    console.log('ID do Evento: ', res.data.id);
    console.log('Link do Evento: ', res.data.htmlLink);
  } catch (error) {
    console.error('\n[ERRO] Falha ao interagir com o Google Calendar API:');
    if (error.response && error.response.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message || error);
    }
    console.log('\n[Dica] Se o erro for "insufficientPermissions" ou "403 Forbidden", você precisa gerar um novo refresh token.');
    console.log('Para isso:');
    console.log('1. Vá em http://localhost:3000/api/auth/google/login no navegador.');
    console.log('2. Faça login com a conta clickmarido@gmail.com e aprove os novos escopos.');
    console.log('3. Atualize o GOOGLE_GMAIL_REFRESH_TOKEN no seu .env.local e nas variáveis da Vercel.');
  }
}

runTest();
