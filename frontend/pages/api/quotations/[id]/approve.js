import db from '../../../../lib/db';
import { withAuth } from '../../../../lib/auth';
import logger from '../../../../utils/logger';

async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // 1. Iniciar Transação (ou queries em série já que db wrapper simplifica, 
    // mas transação seria o ideal usando client. Aqui faremos sequencial por simplicidade no MVP).
    
    // Busca a quotation para garantir que existe e não foi aprovada.
    const quote = await db.getOne('SELECT * FROM quotations WHERE id = $1', [id]);
    if (!quote) {
      return res.status(404).json({ error: 'Orçamento não encontrado.' });
    }
    
    if (quote.status === 'approved') {
      return res.status(400).json({ error: 'Orçamento já está aprovado.' });
    }

    // 2. Atualiza Quotation para 'approved'
    await db.query(`UPDATE quotations SET status = 'approved' WHERE id = $1`, [id]);
    logger.info('Orçamento aprovado', { quotationId: id });

    // 3. Cria a Service Order automaticamente
    const soNumber = `OS-${quote.number.split('-')[1]}-${new Date().getFullYear()}`;
    const scheduled_date = req.body.scheduled_date || new Date().toISOString().split('T')[0]; // Default para hoje se não enviado
    
    const soText = `
      INSERT INTO service_orders (quotation_id, customer_id, number, scheduled_date, status)
      VALUES ($1, $2, $3, $4, 'agendada')
      RETURNING *
    `;
    const soValues = [quote.id, quote.customer_id, soNumber, scheduled_date];
    
    const serviceOrder = await db.getOne(soText, soValues);
    logger.info('Service Order auto-gerada a partir de Orçamento', { serviceOrderId: serviceOrder.id });

    return res.status(200).json({
      message: 'Orçamento aprovado e OS gerada com sucesso!',
      quotation: { ...quote, status: 'approved' },
      serviceOrder
    });

  } catch (error) {
    logger.error('Erro ao aprovar quotation', { id, error: error.message });
    return res.status(500).json({ error: 'Erro ao aprovar orçamento.' });
  }
}

export default withAuth(handler);
