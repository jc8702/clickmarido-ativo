import db from '../../../../lib/db';
import { withAuth } from '../../../../lib/auth';
import logger from '../../../../utils/logger';

async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const text = `
      UPDATE payments 
      SET status = 'aprovado', received_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const payment = await db.getOne(text, [id]);

    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado.' });
    }

    logger.info('Pagamento aprovado manualmente', { paymentId: id });
    
    // Log estruturado para After-Sales (Follow-up)
    logger.event('payment.approved', { 
      customer_id: payment.customer_id, // Pode precisar fazer um JOIN se não houver
      order_id: payment.service_order_id, 
      amount: payment.amount,
      note: 'Agendar follow-up em 7 dias'
    });

    return res.status(200).json(payment);
  } catch (error) {
    logger.error('Erro ao aprovar payment', { id, error: error.message });
    return res.status(500).json({ error: 'Erro ao aprovar pagamento.' });
  }
}

export default withAuth(handler);
