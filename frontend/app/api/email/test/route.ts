import { NextRequest, NextResponse } from 'next/server';
import { sendGmail } from '@/lib/gmail';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get('to');

  if (!to) {
    return NextResponse.json(
      {
        error:
          'Parâmetro de e-mail de destino ("to") ausente na URL. Use ex: ?to=usuario@example.com',
      },
      { status: 400 }
    );
  }

  try {
    const htmlContent = `
      <div style="font-family: sans-serif; padding: 24px; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <h1 style="color: #4f46e5; border-bottom: 2px solid #f3f4f6; padding-bottom: 16px; margin-top: 0; font-size: 24px;">Click Marido CRM</h1>
        <p style="font-size: 16px; line-height: 1.5; color: #4b5563;">Olá!</p>
        <p style="font-size: 16px; line-height: 1.5; color: #4b5563;">Este é um e-mail de teste disparado pelo módulo de disparos automáticos do <strong>Click Marido CRM</strong> utilizando a <strong>Gmail API oficial via OAuth 2.0</strong>.</p>
        <div style="background: #f9fafb; padding: 16px; border-left: 4px solid #4f46e5; border-radius: 0 8px 8px 0; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #4b5563; font-weight: 500;">
            A conexão com a API do Google foi validada com sucesso e a renovação de tokens está operando corretamente!
          </p>
        </div>
        <p style="font-size: 14px; color: #9ca3af; margin-bottom: 0;">Atenciosamente,<br>Plataforma Click Marido</p>
      </div>
    `;

    const result = await sendGmail({
      to,
      subject: 'Teste de Conexão Gmail - Click Marido CRM',
      html: htmlContent,
    });

    return NextResponse.json({
      success: true,
      message: `E-mail de teste enviado com sucesso para ${to}!`,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Falha no envio do e-mail de teste', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        {
          error:
            'Campos "to", "subject" e "html" são obrigatórios no corpo da requisição POST.',
        },
        { status: 400 }
      );
    }

    const result = await sendGmail({ to, subject, html });

    return NextResponse.json({
      success: true,
      message: 'E-mail enviado com sucesso!',
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Falha ao processar disparo de e-mail via POST',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
