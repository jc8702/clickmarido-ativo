const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Carregar .env manualmente para não depender de pacotes externos
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return {};
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      env[match[1]] = value.trim();
    }
  });
  return env;
}

async function run() {
  const env = loadEnv();
  const secret = env.JWT_SECRET || process.env.JWT_SECRET;
  
  if (!secret) {
    console.error('ERRO: JWT_SECRET não encontrado no .env');
    process.exit(1);
  }
  
  console.log('Gerando token JWT de teste...');
  const token = jwt.sign({ userId: 'test-admin-id', email: 'admin@clickmarido.com.br', role: 'admin' }, secret, {
    expiresIn: '1h'
  });
  
  console.log('Token gerado:', token.substring(0, 15) + '...');
  
  const cnpjTest = '83240333003130'; // CNPJ correto das Lojas Milium Ltda (correção do erro de digitação)
  const url = `http://localhost:3000/api/vendors/cnpj/${cnpjTest}`;
  
  console.log(`Efetuando chamada de teste para: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`Status de resposta: ${response.status}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('SUCESSO! Dados retornados da API:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error('ERRO RETORNADO PELA API:', data);
    }
  } catch (error) {
    console.error('Falha ao conectar na API local:', error.message);
    console.log('Certifique-se de que o servidor Next.js está rodando localmente (npm run dev na porta 3000).');
  }
}

run();
