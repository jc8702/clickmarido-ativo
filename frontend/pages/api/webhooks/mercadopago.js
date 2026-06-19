import db from '../../../../lib/db';
import logger from '../../../../utils/logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const payload = req.body;
    logger.webhook('POST', '/api/webhooks/mercadopago', 200, payload);

    const { action, data } = payload;

    if (action === 'payment.updated' && data && data.id) {
      logger.info('Processando Webhook de Payment (MercadoPago)', { mpId: data.id });
      
      // Busca e atualiza o payment pelo mercadopago_id = data.id
      await db.query(`UPDATE payments SET status = 'aprovado' WHERE mercadopago_id = $1`, [data.id]);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Erro no Webhook', error);
    // Sempre retornar 200 pro MP não ficar reenviando indiscriminadamente
    return res.status(200).json({ received: true, note: 'Error processed internally' });
  }
}
