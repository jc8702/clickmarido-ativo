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
      // Remove aspas simples ou duplas ao redor do valor
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

// Tenta carregar .env.local e depois .env
loadEnv(path.join(__dirname, '.env.local'));
loadEnv(path.join(__dirname, '.env'));

console.log('=== Validador de Configuração Gmail API ===\n');
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectURI = process.env.GOOGLE_REDIRECT_URI;
const refreshToken = process.env.GOOGLE_GMAIL_REFRESH_TOKEN;

console.log(
  'GOOGLE_CLIENT_ID:            ',
  clientID ? 'OK (Configurado)' : 'Pendente (FALTA)'
);
console.log(
  'GOOGLE_CLIENT_SECRET:        ',
  clientSecret ? 'OK (Configurado)' : 'Pendente (FALTA)'
);
console.log(
  'GOOGLE_REDIRECT_URI:         ',
  redirectURI ? `OK (${redirectURI})` : 'Pendente (FALTA)'
);
console.log(
  'GOOGLE_GMAIL_REFRESH_TOKEN:  ',
  refreshToken ? 'OK (Configurado)' : 'Pendente (FALTA)'
);

if (!clientID || !clientSecret || !redirectURI || !refreshToken) {
  console.log(
    '\n[Aviso] Preencha as chaves no arquivo .env.local para realizar disparos reais.'
  );
  console.log('\nPasso a passo de configuração:');
  console.log('1. Crie um projeto no Google Cloud Console.');
  console.log('2. Habilite a Gmail API.');
  console.log('3. Configure a tela de consentimento OAuth (adicione seu e-mail como usuário de teste se estiver em desenvolvimento).');
  console.log('4. Crie credenciais do tipo "ID do cliente OAuth 2.0" (Aplicativo da Web).');
  console.log('5. Configure as URLs de redirecionamento autorizadas (Redirect URIs):');
  console.log('   - Desenvolvimento local: http://localhost:3000/api/auth/google/callback');
  console.log('   - Produção: https://seu-dominio.vercel.app/api/auth/google/callback');
  console.log('6. Preencha GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI no seu .env.local.');
  console.log('7. Inicie a aplicação local com "npm run dev".');
  console.log('8. Acesse no seu navegador: http://localhost:3000/api/auth/google/login');
  console.log('9. Complete o login com a conta Gmail corporativa/central do sistema.');
  console.log('10. Copie o GOOGLE_GMAIL_REFRESH_TOKEN retornado na tela e salve-o no .env.local.');
  process.exit(0);
}

try {
  const { google } = require('googleapis');

  const oAuth2Client = new google.auth.OAuth2(
    clientID,
    clientSecret,
    redirectURI
  );
  oAuth2Client.setCredentials({ refresh_token: refreshToken });

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  const to = process.argv[2] || 'teste@example.com';
  console.log(`\nIniciando disparo real de e-mail teste para: ${to}...`);

  const subject = 'Teste Standalone Gmail API - Click Marido';
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: #4f46e5;">Conexão Ativa!</h2>
      <p>Este e-mail foi enviado de forma standalone usando o validador local do Click Marido CRM.</p>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">Data de envio: ${new Date().toLocaleString('pt-BR')}</p>
    </div>
  `;

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
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  gmail.users.messages
    .send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    })
    .then((res) => {
      console.log('\n[Sucesso] E-mail enviado com sucesso via Gmail API!');
      console.log('Mensagem ID:', res.data.id);
    })
    .catch((err) => {
      console.error('\n[Erro] Falha ao enviar e-mail:', err.message);
    });
} catch (err) {
  console.error(
    '\n[Erro] Falha ao executar script de testes:',
    err.message
  );
}
