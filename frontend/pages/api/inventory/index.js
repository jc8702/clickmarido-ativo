import db from '../../../lib/db';
import { withAuth } from '../../../lib/auth';
import logger from '../../../utils/logger';

async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return getInventory(req, res);
    case 'POST':
      return createInventoryItem(req, res);
    default:
      return res.status(405).json({ error: 'Método não permitido' });
  }
}

async function getInventory(req, res) {
  try {
    const text = 'SELECT * FROM inventory ORDER BY name ASC';
    const { rows } = await db.query(text, []);
    return res.status(200).json(rows);
  } catch (error) {
    logger.error('Erro ao listar inventory', { error: error.message });
    return res.status(500).json({ error: 'Erro ao buscar estoque.' });
  }
}

async function createInventoryItem(req, res) {
  try {
    const { name, sku, quantity, unit_cost, unit_price } = req.body;

    if (!name || !sku) {
      return res.status(400).json({ error: 'Nome e SKU são obrigatórios.' });
    }

    const text = `
      INSERT INTO inventory (name, sku, quantity, unit_cost, unit_price)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [name, sku, quantity || 0, unit_cost, unit_price];
    
    const item = await db.getOne(text, values);
    logger.info('Item de estoque criado', { itemId: item.id, sku });
    
    return res.status(201).json(item);
  } catch (error) {
    logger.error('Erro ao criar inventory item', { error: error.message });
    return res.status(500).json({ error: 'Erro ao criar item no estoque.' });
  }
}

export default withAuth(handler);
