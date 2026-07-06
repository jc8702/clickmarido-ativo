// Script de teste dos providers de IA
// Execute com: npx tsx scripts/test-ai-providers.ts

import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente
config({ path: resolve(__dirname, '../.env.local') });

async function testOpenRouter() {
  console.log('\n=== Teste OpenRouter ===');
  
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.log('❌ OPENROUTER_API_KEY não configurada');
    return;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://clickmarido.com.br',
        'X-Title': 'ClickMarido Test',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          { role: 'user', content: 'Olá! Responda apenas com "OK" para testar.' },
        ],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ Erro HTTP ${response.status}: ${error}`);
      return;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log(`✅ OpenRouter funcionando! Resposta: "${content.substring(0, 50)}"`);
    console.log(`   Modelo: ${data.model || 'openrouter/free'}`);
    console.log(`   Tokens: ${data.usage?.total_tokens || 'N/A'}`);
  } catch (error) {
    console.log(`❌ Erro de conexão: ${error}`);
  }
}

async function testKilo() {
  console.log('\n=== Teste Kilo ===');
  
  const apiKey = process.env.KILO_API_KEY;
  if (!apiKey) {
    console.log('⚠️  KILO_API_KEY não configurada (funciona sem chave com rate limit)');
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch('https://api.kilo.ai/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          { role: 'user', content: 'Olá! Responda apenas com "OK" para testar.' },
        ],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ Erro HTTP ${response.status}: ${error}`);
      return;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log(`✅ Kilo funcionando! Resposta: "${content.substring(0, 50)}"`);
    console.log(`   Modelo: ${data.model || 'openrouter/free'}`);
    console.log(`   Tokens: ${data.usage?.total_tokens || 'N/A'}`);
  } catch (error) {
    console.log(`❌ Erro de conexão: ${error}`);
  }
}

async function main() {
  console.log('🔧 Teste de Providers de IA - ClickMarido');
  console.log('==========================================');
  
  await testOpenRouter();
  await testKilo();
  
  console.log('\n==========================================');
  console.log('Testes concluídos!');
}

main().catch(console.error);
