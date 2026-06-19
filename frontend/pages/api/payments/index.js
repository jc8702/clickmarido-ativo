import db from '../../../lib/db';
import { withAuth } from '../../../lib/auth';
import logger from '../../../utils/logger';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const text = `
      SELECT p.*, so.number as so_number, c.name as customer_name
      FROM payments p
      JOIN service_orders so ON p.service_order_id = so.id
      JOIN customers c ON so.customer_id = c.id
      ORDER BY p.created_at DESC
    `;
    const { rows } = await db.query(text, []);
    return res.status(200).json(rows);
  } catch (error) {
    logger.error('Erro ao listar payments', { error: error.message });
    return res.status(500).json({ error: 'Erro ao buscar pagamentos.' });
  }
}

export default withAuth(handler);
