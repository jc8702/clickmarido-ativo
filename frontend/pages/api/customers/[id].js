import db from '../../../lib/db';
import { withAuth } from '../../../lib/auth';
import logger from '../../../utils/logger';

async function handler(req, res) {
  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      return getCustomerById(req, res, id);
    case 'PATCH':
      return updateCustomer(req, res, id);
    default:
      return res.status(405).json({ error: 'Método não permitido' });
  }
}

async function getCustomerById(req, res, id) {
  try {
    const text = 'SELECT * FROM customers WHERE id = $1';
    const customer = await db.getOne(text, [id]);

    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    return res.status(200).json(customer);
  } catch (error) {
    logger.error('Erro ao buscar customer por ID', { id, error: error.message });
    return res.status(500).json({ error: 'Erro ao buscar cliente.' });
  }
}

async function updateCustomer(req, res, id) {
  try {
    const { name, email, phone, cpf_cnpj, address, city, state, zipcode, notes } = req.body;
    
    // Simplificando o update para os campos enviados
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const addUpdate = (field, value) => {
      if (value !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    };

    addUpdate('name', name);
    addUpdate('email', email);
    addUpdate('phone', phone);
    addUpdate('cpf_cnpj', cpf_cnpj);
    addUpdate('address', address);
    addUpdate('city', city);
    addUpdate('state', state);
    addUpdate('zipcode', zipcode);
    addUpdate('notes', notes);

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum dado para atualizar.' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(id);
    const text = `
      UPDATE customers 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;

    const updatedCustomer = await db.getOne(text, values);

    if (!updatedCustomer) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    logger.info('Cliente atualizado', { customerId: id });
    return res.status(200).json(updatedCustomer);
  } catch (error) {
    logger.error('Erro ao atualizar customer', { id, error: error.message });
    return res.status(500).json({ error: 'Erro ao atualizar cliente.' });
  }
}

export default withAuth(handler);
