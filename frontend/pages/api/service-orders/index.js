import db from '../../../lib/db';
import { withAuth } from '../../../lib/auth';
import logger from '../../../utils/logger';

async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return getServiceOrders(req, res);
    case 'POST':
      return createServiceOrder(req, res);
    default:
      return res.status(405).json({ error: 'Método não permitido' });
  }
}

async function getServiceOrders(req, res) {
  try {
    const text = `
      SELECT so.*, c.name as customer_name 
      FROM service_orders so
      JOIN customers c ON so.customer_id = c.id
      ORDER BY so.scheduled_date DESC, so.scheduled_time DESC NULLS LAST
    `;
    const { rows } = await db.query(text, []);
    return res.status(200).json(rows);
  } catch (error) {
    logger.error('Erro ao listar service_orders', { error: error.message });
    return res.status(500).json({ error: 'Erro ao buscar ordens de serviço.' });
  }
}

async function createServiceOrder(req, res) {
  try {
    const { quotation_id, customer_id, scheduled_date, scheduled_time, technician_notes } = req.body;

    if (!customer_id || !scheduled_date) {
      return res.status(400).json({ error: 'Cliente e data agendada são obrigatórios.' });
    }

    const number = `OS-M-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;

    const text = `
      INSERT INTO service_orders (quotation_id, customer_id, number, scheduled_date, scheduled_time, technician_notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [quotation_id || null, customer_id, number, scheduled_date, scheduled_time || null, technician_notes || null];
    
    const serviceOrder = await db.getOne(text, values);
    logger.info('Service Order avulsa criada', { serviceOrderId: serviceOrder.id, number });
    
    return res.status(201).json(serviceOrder);
  } catch (error) {
    logger.error('Erro ao criar service_order', { error: error.message });
    return res.status(500).json({ error: 'Erro ao criar ordem de serviço.' });
  }
}

export default withAuth(handler);
