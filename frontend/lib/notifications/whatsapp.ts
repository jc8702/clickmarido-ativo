type WhatsAppTemplate =
  | 'quotation_approved'
  | 'service_order_created'
  | 'service_order_completed'
  | 'payment_pending'
  | 'payment_reminder'
  | 'payment_received'
  | 'warranty_expiring';

interface NotificationPayload {
  phone: string;
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
 * Cria a mensagem em formato de texto livre personalizada em português.
 */
function buildTextMessage(template: WhatsAppTemplate, variables: Record<string, string>): string {
  switch (template) {
    case 'quotation_approved':
      return `🎉 *Click Marido* \n\nOlá *${variables.customerName || 'Cliente'}*!\nSeu orçamento de número *#${variables.number || 'OS'}* foi aprovado com sucesso.\n\nObrigado pela preferência e confiança!`;
    
    case 'service_order_created':
      return `🛠️ *Click Marido - Nova Ordem de Serviço* \n\nOlá *${variables.customerName || 'Cliente'}*!\nSua Ordem de Serviço *#${variables.number || 'OS'}* foi aberta com sucesso.\n\n📅 *Agendamento:* ${variables.date || 'Conforme agendamento'}\n👨‍🔧 *Técnico:* ${variables.technicianName || 'Não atribuído'}\n\nFicamos à disposição!`;

    case 'service_order_completed':
      return `✅ *Click Marido - Serviço Concluído* \n\nOlá *${variables.customerName || 'Cliente'}*!\nSua Ordem de Serviço *#${variables.number || 'OS'}* foi finalizada pelo técnico.\n\nAgradecemos muito a preferência! Por favor, avalie o nosso serviço em 1 minuto:\n👉 ${variables.link || ''}`;

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
 * Send WhatsApp notification via Evolution API (Zero-Cost WhatsApp Web Emulator)
 */
export async function sendWhatsAppNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  let success = false;
  let error: string | undefined;
  let messageId: string | undefined;

  try {
    const cleanPhone = payload.phone.replace(/\D/g, '');
    // Evolution API espera o número completo (com DDI do Brasil 55)
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

