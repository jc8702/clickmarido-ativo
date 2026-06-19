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
      UPDATE service_orders 
      SET status = 'em_progresso', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const updatedSO = await db.getOne(text, [id]);

    if (!updatedSO) {
      return res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
    }

    logger.info('OS iniciada', { serviceOrderId: id });
    return res.status(200).json(updatedSO);
  } catch (error) {
    logger.error('Erro ao iniciar SO', { id, error: error.message });
    return res.status(500).json({ error: 'Erro ao iniciar ordem de serviço.' });
  }
}

export default withAuth(handler);
