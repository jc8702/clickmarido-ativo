import db from '../../../../lib/db';
import { withAuth } from '../../../../lib/auth';
import logger from '../../../../utils/logger';
import crypto from 'crypto';

async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const payment = await db.getOne('SELECT * FROM payments WHERE id = $1', [id]);
    
    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado.' });
    }

    if (payment.pix_code) {
      return res.status(200).json({ pix_code: payment.pix_code });
    }

    // Mock PIX: string aleatoria 32 chars
    const mockPixCode = crypto.randomBytes(16).toString('hex');

    const updatedPayment = await db.getOne(
      `UPDATE payments SET pix_code = $2, payment_method = 'pix' WHERE id = $1 RETURNING *`,
      [id, mockPixCode]
    );

    logger.info('PIX gerado para pagamento', { paymentId: id });
    return res.status(200).json({ pix_code: mockPixCode });
  } catch (error) {
    logger.error('Erro ao gerar pix', { id, error: error.message });
    return res.status(500).json({ error: 'Erro ao gerar código PIX.' });
  }
}

export default withAuth(handler);
