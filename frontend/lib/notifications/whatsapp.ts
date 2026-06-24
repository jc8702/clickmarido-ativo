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

/**
 * Send WhatsApp notification via Meta WhatsApp Business API
 * Requires WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID env vars
 */
export async function sendWhatsAppNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  let success = false;
  let error: string | undefined;
  let messageId: string | undefined;

  if (!token || !phoneNumberId) {
    console.warn('[WHATSAPP] Missing credentials, skipping notification');
    error = 'Missing credentials';
  } else {
    try {
      const cleanPhone = payload.phone.replace(/\D/g, '');
      const toPhone = cleanPhone.startsWith('55')
        ? cleanPhone
        : `55${cleanPhone}`;

      const templateParams = Object.values(payload.variables).map(value => ({
        type: 'text',
        text: value,
      }));

      const response = await fetch(
        `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: toPhone,
            type: 'template',
            template: {
              name: payload.template,
              language: { code: 'pt_BR' },
              components: [
                {
                  type: 'body',
                  parameters: templateParams,
                },
              ],
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        error = data.error?.message || `HTTP ${response.status}`;
        console.error(`[WHATSAPP] Error: ${error}`, data);
      } else {
        success = true;
        messageId = data.messages?.[0]?.id;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      console.error('[WHATSAPP] Exception:', error);
    }
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
