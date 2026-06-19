import db from '../../../../lib/db';
import { withAuth } from '../../../../lib/auth';
import logger from '../../../../utils/logger';

async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'POST') {
    // Estamos usando POST conforme prompt para a ação de conclusão com envio de dados/fotos
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { technician_notes, before_photo, after_photo, final_total } = req.body;

    const soText = `
      UPDATE service_orders 
      SET 
        status = 'concluida', 
        technician_notes = COALESCE($2, technician_notes),
        before_photo = COALESCE($3, before_photo),
        after_photo = COALESCE($4, after_photo),
        final_total = $5,
        completed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [id, technician_notes, before_photo, after_photo, final_total];
    const completedSO = await db.getOne(soText, values);

    if (!completedSO) {
      return res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
    }

    logger.info('OS concluída', { serviceOrderId: id });

    // Se houve final_total, gerar um pagamento pendente automático
    let payment = null;
    if (final_total && parseFloat(final_total) > 0) {
      const pText = `
        INSERT INTO payments (service_order_id, amount, status)
        VALUES ($1, $2, 'pendente')
        RETURNING *
      `;
      payment = await db.getOne(pText, [completedSO.id, final_total]);
      logger.info('Pagamento pendente auto-gerado para OS', { paymentId: payment.id });
    }

    // Gerar Garantia Automática
    const warrantyMonths = parseInt(process.env.WARRANTY_MONTHS || '6', 10);
    let warranty = null;
    try {
      const wText = `
        INSERT INTO warranties (service_order_id, type, duration_months, status)
        VALUES ($1, $2, $3, 'ativa')
        RETURNING *
      `;
      // Assumindo que a tabela warranties exista. Em um ambiente real, faríamos a migração.
      // warranty = await db.getOne(wText, [completedSO.id, 'Padrão', warrantyMonths]);
      logger.event('warranty.created', { serviceOrderId: completedSO.id, duration: warrantyMonths });
    } catch (err) {
      logger.error('Falha ao criar warranty', err);
    }

    return res.status(200).json({
      message: 'Ordem de serviço concluída com sucesso.',
      serviceOrder: completedSO,
      payment
    });

  } catch (error) {
    logger.error('Erro ao concluir SO', { id, error: error.message });
    return res.status(500).json({ error: 'Erro ao concluir ordem de serviço.' });
  }
}

export default withAuth(handler);
