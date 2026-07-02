import { sendGmail } from '../gmail';

type WhatsAppTemplate =
  | 'quotation_approved'
  | 'service_order_created'
  | 'service_order_completed'
  | 'payment_pending'
  | 'payment_reminder'
  | 'payment_received'
  | 'warranty_expiring'
  | 'quotation_sent';

interface NotificationPayload {
  phone: string;
  email?: string;
  template: WhatsAppTemplate;
  variables: Record<string, string>;
}

interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Configurações da Evolution API Local
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || process.env.NEXT_PUBLIC_WHATSAPP_API_URL || 'http://localhost:8080';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || process.env.NEXT_PUBLIC_WHATSAPP_API_KEY || 'clickmarido_key';
const WHATSAPP_INSTANCE_NAME = process.env.WHATSAPP_INSTANCE_NAME || 'clickmarido_instance';

/**
 * Cria a mensagem em formato de texto livre personalizada em português para o WhatsApp.
 */
function buildTextMessage(template: WhatsAppTemplate, variables: Record<string, string>): string {
  switch (template) {
    case 'quotation_sent':
      return `📄 *Click Marido - Proposta Disponível* \n\nOlá *${variables.customerName || 'Cliente'}*!\nSua proposta comercial de número *#${variables.number || 'OS'}* está pronta.\n\nVocê pode visualizá-la no link abaixo:\n👉 ${variables.link || ''}\n\nFicamos no aguardo de sua aprovação!`;

    case 'quotation_approved':
      return `🎉 *Click Marido* \n\nOlá *${variables.customerName || 'Cliente'}*!\nSeu orçamento de número *#${variables.number || 'OS'}* foi aprovado com sucesso.\n\nObrigado pela preferência e confiança!`;
    
    case 'service_order_created':
      return `🛠️ *Click Marido - Nova Ordem de Serviço* \n\nOlá *${variables.customerName || 'Cliente'}*!\nSua Ordem de Serviço *#${variables.number || 'OS'}* foi aberta com sucesso.\n\n📅 *Agendamento:* ${variables.date || 'Conforme agendamento'}\n👨‍🔧 *Técnico:* ${variables.technicianName || 'Não atribuído'}\n\nFicamos à disposição!`;

    case 'service_order_completed':
      return `✅ *Click Marido - Serviço Concluído* \n\nOlá *${variables.customerName || 'Cliente'}*!\nSua Ordem de Serviço *#${variables.number || 'OS'}* foi finalizada pelo técnico.\n\nAgradecemos muito a preferência! Por favor, avalie o nosso serviço em 1 minuto:\n👉 ${variables.link || variables.surveyLink || ''}`;

    case 'payment_pending':
      return `💵 *Click Marido - Fatura Disponível* \n\nOlá *${variables.customerName || 'Cliente'}*!\nO pagamento referente ao serviço *#${variables.number || 'OS'}* no valor de *R$ ${variables.amount || '0,00'}* está disponível.\n\nVocê pode realizar o pagamento no link abaixo:\n👉 ${variables.link || ''}\n\nMuito obrigado!`;

    case 'payment_reminder':
      return `⚠️ *Click Marido - Lembrete de Pagamento* \n\nOlá *${variables.customerName || 'Cliente'}*!\nLembramos que o pagamento referente ao serviço *#${variables.number || 'OS'}* no valor de *R$ ${variables.amount || '0,00'}* está pendente.\n\nLink para pagamento:\n👉 ${variables.link || ''}\n\nCaso já tenha pago, por favor ignore esta mensagem.`;

    case 'payment_received':
      return `💖 *Click Marido - Pagamento Confirmado* \n\nOlá *${variables.customerName || 'Cliente'}*!\nConfirmamos o recebimento do seu pagamento no valor de *R$ ${variables.amount || '0,00'}* referente ao serviço *#${variables.number || 'OS'}*.\n\nMuito obrigado pela parceria!`;

    case 'warranty_expiring':
      return `🛡️ *Click Marido - Garantia Expirando* \n\nOlá *${variables.customerName || 'Cliente'}*!\nLembramos que a garantia de 90 dias do serviço *#${variables.number || 'OS'}* expira em breve.\n\nSe precisar de algo, estamos à disposição!`;

    default:
      return `Mensagem automática do Click Marido CRM.`;
  }
}

/**
 * Cria a mensagem de e-mail em formato HTML premium em português.
 */
function buildHtmlEmailMessage(
  template: WhatsAppTemplate,
  variables: Record<string, string>,
  clientName: string
): { subject: string; html: string } {
  let subject = 'Notificação - Click Marido';
  let title = 'Click Marido';
  let body = '';

  const buttonStyle = 'display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;';
  
  switch (template) {
    case 'quotation_sent':
      subject = `Proposta Comercial de Serviço - Click Marido`;
      title = 'Sua Proposta Comercial está Pronta!';
      body = `
        <p>Olá <strong>${clientName}</strong>,</p>
        <p>Preparamos a proposta comercial de número <strong>#${variables.number || 'OS'}</strong> conforme solicitado.</p>
        <p>Você pode visualizar o detalhamento completo dos serviços, valores e formas de pagamento clicando no botão abaixo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${variables.link || ''}" style="${buttonStyle}">Visualizar Proposta Comercial</a>
        </div>
        <p style="color: #666; font-size: 0.9em; line-height: 1.5;">Se tiver qualquer dúvida, responda a este e-mail ou entre em contato pelo nosso WhatsApp.</p>
      `;
      break;

    case 'quotation_approved':
      subject = `🎉 Click Marido - Orçamento Aprovado!`;
      title = 'Orçamento Aprovado com Sucesso!';
      body = `
        <p>Olá <strong>${clientName}</strong>,</p>
        <p>Ficamos muito felizes em informar que seu orçamento de número <strong>#${variables.number || 'OS'}</strong> foi aprovado.</p>
        <p>Nossa equipe já está providenciando os próximos passos para o agendamento do serviço.</p>
        <p>Muito obrigado pela preferência e pela confiança em nosso trabalho!</p>
      `;
      break;

    case 'service_order_created':
      subject = `🛠️ Click Marido - Nova Ordem de Serviço`;
      title = 'Ordem de Serviço Aberta';
      body = `
        <p>Olá <strong>${clientName}</strong>,</p>
        <p>Sua Ordem de Serviço de número <strong>#${variables.number || 'OS'}</strong> foi criada e registrada em nosso sistema.</p>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #eaeaea;">
          <p style="margin: 5px 0;">📅 <strong>Agendamento:</strong> ${variables.date || 'Conforme agendamento'}</p>
          <p style="margin: 5px 0;">👨‍🔧 <strong>Técnico Responsável:</strong> ${variables.technicianName || 'Não atribuído'}</p>
        </div>
        <p>Qualquer dúvida ou alteração de data, por favor entre em contato.</p>
      `;
      break;

    case 'service_order_completed':
      subject = `✅ Click Marido - Serviço Concluído e Avaliação`;
      title = 'Serviço Concluído!';
      body = `
        <p>Olá <strong>${clientName}</strong>,</p>
        <p>Sua Ordem de Serviço de número <strong>#${variables.number || 'OS'}</strong> foi finalizada com sucesso por nossa equipe técnica.</p>
        <p>Agradecemos imensamente a preferência. Sua opinião é de extrema importância para nós!</p>
        <p>Por favor, dedique 1 minuto para preencher nossa pesquisa rápida de satisfação:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${variables.link || variables.surveyLink || ''}" style="${buttonStyle}">Avaliar Nosso Serviço</a>
        </div>
        <p style="color: #666; font-size: 0.9em; line-height: 1.5;">Muito obrigado por nos ajudar a melhorar continuamente!</p>
      `;
      break;

    case 'payment_pending':
      subject = `💵 Click Marido - Fatura Disponível para Pagamento`;
      title = 'Fatura Disponível';
      body = `
        <p>Olá <strong>${clientName}</strong>,</p>
        <p>A fatura referente ao serviço de número <strong>#${variables.number || 'OS'}</strong> já está disponível para pagamento.</p>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #eaeaea; text-align: center;">
          <p style="margin: 5px 0; font-size: 1.1em; color: #4b5563;">Valor a ser pago:</p>
          <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #4f46e5;">R$ ${variables.amount || '0,00'}</p>
        </div>
        <p>Para efetuar o pagamento via PIX, Boleto ou Cartão, clique no botão abaixo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${variables.link || ''}" style="${buttonStyle}">Pagar Fatura Online</a>
        </div>
      `;
      break;

    case 'payment_reminder':
      subject = `⚠️ Click Marido - Lembrete de Pagamento Pendente`;
      title = 'Lembrete de Pagamento';
      body = `
        <p>Olá <strong>${clientName}</strong>,</p>
        <p>Lembramos que o pagamento referente ao serviço de número <strong>#${variables.number || 'OS'}</strong> no valor de <strong>R$ ${variables.amount || '0,00'}</strong> ainda consta como pendente em nosso sistema.</p>
        <p>Evite atrasos efetuando o pagamento pelo link abaixo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${variables.link || ''}" style="${buttonStyle}">Acessar Link de Pagamento</a>
        </div>
        <p style="color: #9ca3af; font-size: 0.85em; text-align: center; margin-top: 20px;">Caso já tenha realizado o pagamento, por favor desconsidere este e-mail.</p>
      `;
      break;

    case 'payment_received':
      subject = `💖 Click Marido - Pagamento Confirmado!`;
      title = 'Pagamento Confirmado!';
      body = `
        <p>Olá <strong>${clientName}</strong>,</p>
        <p>Confirmamos com sucesso o recebimento do seu pagamento no valor de <strong>R$ ${variables.amount || '0,00'}</strong> referente ao serviço de número <strong>#${variables.number || 'OS'}</strong>.</p>
        <p>Sua fatura foi baixada em nosso sistema financeiro.</p>
        <p>Muito obrigado pela parceria e confiança!</p>
      `;
      break;

    case 'warranty_expiring':
      subject = `🛡️ Click Marido - Garantia Expirando`;
      title = 'Sua Garantia está Expirando';
      body = `
        <p>Olá <strong>${clientName}</strong>,</p>
        <p>Gostaríamos de lembrar que a garantia de 90 dias do serviço de número <strong>#${variables.number || 'OS'}</strong> expirará nos próximos dias.</p>
        <p>Fizemos essa visita para certificar que tudo ficou perfeito. Se precisar de qualquer ajuste ou novo serviço, fale conosco!</p>
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

/**
 * Send WhatsApp notification via Evolution API and email via Gmail API if available
 */
export async function sendWhatsAppNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  let success = false;
  let error: string | undefined;
  let messageId: string | undefined;

  // 1. DISPARAR WHATSAPP (Lógica Existente)
  try {
    const cleanPhone = payload.phone.replace(/\D/g, '');
    const toPhone = cleanPhone.startsWith('55')
      ? cleanPhone
      : `55${cleanPhone}`;

    const textMessage = buildTextMessage(payload.template, payload.variables);

    const response = await fetch(
      `${WHATSAPP_API_URL}/message/sendText/${WHATSAPP_INSTANCE_NAME}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': WHATSAPP_API_KEY,
        },
        body: JSON.stringify({
          number: toPhone,
          text: textMessage,
        }),
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      error = data?.error?.message || data?.message || `HTTP ${response.status}`;
      console.error(`[WHATSAPP] Evolution API Error: ${error}`, data);
    } else {
      success = true;
      messageId = data?.key?.id || data?.messageId || 'evolution_msg_id';
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
    console.error('[WHATSAPP] Evolution API Exception:', error);
  }

  // 2. BUSCAR E-MAIL DO CLIENTE E DISPARAR VIA GMAIL API (Nova Lógica Automática)
  try {
    let targetEmail = payload.email;
    let customerName = payload.variables.customerName || 'Cliente';

    // Se o e-mail não foi fornecido diretamente no payload, tenta resolver pelo telefone do cliente
    if (!targetEmail && payload.phone) {
      const cleanPhone = payload.phone.replace(/\D/g, '');
      const phoneDigits = cleanPhone.startsWith('55') ? cleanPhone.slice(2) : cleanPhone;
      
      const { prisma } = await import('@/lib/prisma');
      const customer = await prisma.customer.findFirst({
        where: {
          phone: {
            contains: phoneDigits,
          },
        },
        select: { email: true, name: true },
      });

      if (customer && customer.email) {
        targetEmail = customer.email;
        if (!payload.variables.customerName) {
          customerName = customer.name;
        }
      }
    }

    if (targetEmail) {
      const { subject, html } = buildHtmlEmailMessage(
        payload.template,
        payload.variables,
        customerName
      );

      // Envia em segundo plano (assíncrono) para não atrasar a requisição principal
      sendGmail({
        to: targetEmail,
        subject,
        html,
      }).then(gmailRes => {
        console.log(`[GMAIL AUTOMATION] E-mail enviado com sucesso para ${targetEmail}. ID: ${gmailRes.messageId}`);
      }).catch(gmailErr => {
        console.error(`[GMAIL AUTOMATION ERROR] Falha ao enviar e-mail para ${targetEmail}:`, gmailErr.message);
      });
    }
  } catch (emailAutomationErr: any) {
    console.error('[GMAIL AUTOMATION ERROR] Falha no fluxo de disparo de e-mail:', emailAutomationErr.message);
  }

  // Gravar log no banco de dados de forma assíncrona
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.messageLog.create({
      data: {
        phone: payload.phone,
        template: payload.template,
        status: success ? 'SENT' : 'FAILED',
        error: error || null,
        variables: payload.variables || {},
      },
    });
  } catch (dbError) {
    console.error('[WHATSAPP] Failed to write message log to database:', dbError);
  }

  return { success, messageId, error };
}

/**
 * Send notification (fire-and-forget, non-blocking)
 */
export function fireAndForgetNotification(payload: NotificationPayload): void {
  sendWhatsAppNotification(payload).catch(error => {
    console.error('[WHATSAPP] Fire-and-forget failed:', error);
  });
}

