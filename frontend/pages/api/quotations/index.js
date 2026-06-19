import db from '../../../lib/db';
import { withAuth } from '../../../lib/auth';
import logger from '../../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return getQuotations(req, res);
    case 'POST':
      return createQuotation(req, res);
    default:
      return res.status(405).json({ error: 'Método não permitido' });
  }
}

async function getQuotations(req, res) {
  try {
    const text = 'SELECT * FROM quotations ORDER BY created_at DESC';
    const { rows } = await db.query(text, []);
    return res.status(200).json(rows);
  } catch (error) {
    logger.error('Erro ao listar quotations', { error: error.message });
    return res.status(500).json({ error: 'Erro ao buscar orçamentos.' });
  }
}

async function createQuotation(req, res) {
  try {
    const { customer_id, description, items, total, valid_until } = req.body;

    if (!customer_id || !description || total === undefined || !valid_until) {
      return res.status(400).json({ error: 'Faltam campos obrigatórios.' });
    }

    const number = `ORC-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;
    const itemsJson = JSON.stringify(items || []);

    const text = `
      INSERT INTO quotations (customer_id, number, description, items, total, valid_until)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [customer_id, number, description, itemsJson, total, valid_until];
    
    const quotation = await db.getOne(text, values);
    logger.info('Orçamento criado', { quotationId: quotation.id, number });
    
    return res.status(201).json(quotation);
  } catch (error) {
    logger.error('Erro ao criar quotation', { error: error.message });
    return res.status(500).json({ error: 'Erro ao criar orçamento.' });
  }
}

export default withAuth(handler);
