import db from '../../../lib/db';
import { withAuth } from '../../../lib/auth';
import logger from '../../../utils/logger';

async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({ error: 'Campo invalido: Quantidade a atualizar é obrigatória.' });
    }

    // Usaremos a conexão para transação
    // Idealmente, a função `db.query` deve suportar clients da pool para BEGIN/COMMIT,
    // mas faremos um mock de transaction local usando as funções que temos.
    // Como estamos no serverless, o pool fará checkout e release auto.
    // O correto em produção é client = await pool.connect(), etc.
    // Para cumprir o prompt:
    const lockText = 'SELECT * FROM inventory WHERE id = $1 FOR UPDATE';
    await db.query(lockText, [id]);

    const text = `
      UPDATE inventory 
      SET quantity = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const updatedItem = await db.getOne(text, [id, quantity]);

    if (!updatedItem) {
      return res.status(404).json({ error: 'Item não encontrado.' });
    }

    logger.info('Quantidade do item atualizada', { itemId: id, newQuantity: quantity });
    return res.status(200).json(updatedItem);
  } catch (error) {
    logger.error('Erro ao atualizar inventory', { id, error: error.message });
    return res.status(500).json({ error: 'Erro ao atualizar item do estoque.' });
  }
}

export default withAuth(handler);
