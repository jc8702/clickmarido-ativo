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

  if (!token || !phoneNumberId) {
    console.warn('[WHATSAPP] Missing credentials, skipping notification');
    return { success: false, error: 'Missing credentials' };
  }

  try {
    // Clean phone number: remove non-digits, add country code
    const cleanPhone = payload.phone.replace(/\D/g, '');
    const toPhone = cleanPhone.startsWith('55')
      ? cleanPhone
      : `55${cleanPhone}`;

    // Map variables to template parameters
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
      const errorMsg = data.error?.message || `HTTP ${response.status}`;
      console.error(`[WHATSAPP] Error: ${errorMsg}`, data);
      return { success: false, error: errorMsg };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[WHATSAPP] Exception:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Send notification (fire-and-forget, non-blocking)
 */
export function fireAndForgetNotification(payload: NotificationPayload): void {
  sendWhatsAppNotification(payload).catch(error => {
    console.error('[WHATSAPP] Fire-and-forget failed:', error);
  });
}
