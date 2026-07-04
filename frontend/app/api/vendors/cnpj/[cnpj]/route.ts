import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth';

type RouteParams = {
  params: Promise<{ cnpj: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Validar autenticação
    if (!validateToken(request)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 2. Extrair e sanitizar o CNPJ
    const { cnpj } = await params;
    const sanitizedCnpj = cnpj.replace(/\D/g, '');

    if (sanitizedCnpj.length !== 14) {
      return NextResponse.json(
        { error: 'CNPJ inválido. O CNPJ deve conter exatamente 14 dígitos.' },
        { status: 400 }
      );
    }

    // 3. Consultar CNPJ com arquitetura de Fallback Resiliente
    let data: any = null;
    let provider = 'brasilapi';

    // Tentativa 1: BrasilAPI
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${sanitizedCnpj}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        next: { revalidate: 86400 } // Cache por 24 horas
      });
      
      if (response.ok) {
        data = await response.json();
      } else if (response.status === 404) {
        return NextResponse.json({ error: 'CNPJ não encontrado na Receita Federal' }, { status: 404 });
      } else {
        console.warn(`BrasilAPI CNPJ lookup failed with status: ${response.status}. Trying ReceitaWS...`);
      }
    } catch (e: any) {
      console.warn(`Error querying BrasilAPI: ${e.message}. Trying ReceitaWS...`);
    }

    // Tentativa 2: ReceitaWS (Fallback se a BrasilAPI falhar ou expirar)
    if (!data) {
      try {
        provider = 'receitaws';
        const response = await fetch(`https://receitaws.com.br/v1/cnpj/${sanitizedCnpj}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          next: { revalidate: 86400 }
        });

        if (response.ok) {
          const raw = await response.json();
          if (raw.status === 'ERROR') {
            if (raw.message && raw.message.includes('não encontrado')) {
              return NextResponse.json({ error: 'CNPJ não encontrado na Receita Federal' }, { status: 404 });
            }
            console.warn(`ReceitaWS error message: ${raw.message}. Trying Minha Receita...`);
          } else {
            // Mapear campos da ReceitaWS para o padrão da BrasilAPI
            data = {
              cnpj: raw.cnpj ? raw.cnpj.replace(/\D/g, '') : sanitizedCnpj,
              razao_social: raw.nome || '',
              nome_fantasia: raw.fantasia || '',
              email: raw.email || '',
              ddd_telefone_1: raw.telefone ? raw.telefone.split('/')[0].trim() : '',
              logradouro: raw.logradouro || '',
              numero: raw.numero || '',
              complemento: raw.complemento || '',
              bairro: raw.bairro || '',
              municipio: raw.municipio || '',
              uf: raw.uf || '',
              cep: raw.cep ? raw.cep.replace(/\D/g, '') : '',
            };
          }
        } else {
          console.warn(`ReceitaWS CNPJ lookup failed with status: ${response.status}. Trying Minha Receita...`);
        }
      } catch (e: any) {
        console.warn(`Error querying ReceitaWS: ${e.message}. Trying Minha Receita...`);
      }
    }

    // Tentativa 3: Minha Receita (Último fallback gratuito/público)
    if (!data) {
      try {
        provider = 'minhareceita';
        const response = await fetch(`https://minhareceita.org/${sanitizedCnpj}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          next: { revalidate: 86400 }
        });

        if (response.ok) {
          data = await response.json();
        } else if (response.status === 404) {
          return NextResponse.json({ error: 'CNPJ não encontrado na Receita Federal' }, { status: 404 });
        } else {
          console.warn(`Minha Receita CNPJ lookup failed with status: ${response.status}`);
        }
      } catch (e: any) {
        console.warn(`Error querying Minha Receita: ${e.message}`);
      }
    }

    // Se todos falharam
    if (!data) {
      return NextResponse.json(
        { error: 'Falha ao consultar os dados do CNPJ na API pública. Tente novamente mais tarde.' },
        { status: 502 }
      );
    }

    console.log(`CNPJ ${sanitizedCnpj} resolvido com sucesso via ${provider}`);

    // 4. Formatar o Endereço Completo
    const logradouro = data.logradouro || '';
    const numero = data.numero || '';
    const complemento = data.complemento ? `, ${data.complemento}` : '';
    const bairro = data.bairro || '';
    const municipio = data.municipio || '';
    const uf = data.uf || '';
    const cep = data.cep || '';
    const tipoLogradouro = data.descricao_tipo_de_logradouro || '';

    const addressParts = [];
    if (tipoLogradouro || logradouro) {
      addressParts.push(`${tipoLogradouro} ${logradouro}`.trim());
    }
    if (numero) addressParts.push(numero + complemento);
    if (bairro) addressParts.push(bairro);
    if (municipio && uf) addressParts.push(`${municipio} / ${uf}`);
    if (cep) addressParts.push(`CEP ${cep}`);

    const formattedAddress = addressParts.join(', ');

    // 5. Formatar Telefone de forma robusta
    const rawPhone = data.ddd_telefone_1 || '';
    let formattedPhone = '';

    // Se já contiver formatação (ex: vindo da ReceitaWS)
    if (rawPhone.includes('(') || rawPhone.includes('-')) {
      formattedPhone = rawPhone;
    } else if (rawPhone && rawPhone.length >= 10) {
      const cleanPhone = rawPhone.replace(/\D/g, '');
      const ddd = cleanPhone.substring(0, 2);
      const number = cleanPhone.substring(2);
      if (number.length === 9) {
        formattedPhone = `(${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
      } else {
        formattedPhone = `(${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
      }
    } else if (rawPhone) {
      formattedPhone = rawPhone;
    }

    // 6. Mapear os dados para o padrão do formulário Vendor
    const mappedData = {
      cnpj: data.cnpj || sanitizedCnpj,
      name: data.razao_social || '',
      tradeName: data.nome_fantasia || '',
      email: data.email || '',
      phone: formattedPhone,
      address: formattedAddress,
    };

    return NextResponse.json(mappedData);
  } catch (error) {
    console.error('Error fetching CNPJ data:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a consulta de CNPJ.' },
      { status: 500 }
    );
  }
}
