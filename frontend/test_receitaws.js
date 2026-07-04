async function test() {
  const cnpj = '83240330003130';
  
  console.log('1. Testando ReceitaWS sem headers...');
  try {
    const res = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpj}`);
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log('Resposta sem headers:', data);
  } catch (e) {
    console.error('Erro 1:', e.message);
  }

  console.log('\n2. Testando ReceitaWS com User-Agent...');
  try {
    const res = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpj}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log('Resposta com User-Agent:', data);
  } catch (e) {
    console.error('Erro 2:', e.message);
  }
}

test();
