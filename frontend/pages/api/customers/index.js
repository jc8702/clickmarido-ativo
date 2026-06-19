import db from '../../../lib/db';
import { withAuth } from '../../../lib/auth';
import logger from '../../../utils/logger';

async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return getCustomers(req, res);
    case 'POST':
      return createCustomer(req, res);
    default:
      return res.status(405).json({ error: 'Método não permitido' });
  }
}

async function getCustomers(req, res) {
  try {
    const text = 'SELECT * FROM customers ORDER BY created_at DESC';
    const { rows } = await db.query(text, []);
    return res.status(200).json(rows);
  } catch (error) {
    logger.error('Erro ao listar customers', { error: error.message });
    return res.status(500).json({ error: 'Erro ao buscar clientes.' });
  }
}

import { isValidEmail, isValidPhone, isValidCPFCNPJ } from '../../../utils/validators';

async function createCustomer(req, res) {
  try {
    const { name, email, phone, cpf_cnpj, address, city, state, zipcode, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Campo invalido: Nome e telefone são obrigatórios.' });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: 'Campo invalido: Email em formato incorreto' });
    }

    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ error: 'Campo invalido: Telefone deve ter no mínimo 10 dígitos' });
    }

    if (cpf_cnpj && !isValidCPFCNPJ(cpf_cnpj)) {
      return res.status(400).json({ error: 'Campo invalido: CPF/CNPJ deve ter entre 11 e 14 dígitos numéricos' });
    }

    const text = `
      INSERT INTO customers (name, email, phone, cpf_cnpj, address, city, state, zipcode, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [name, email, phone, cpf_cnpj, address, city, state, zipcode, notes];
    
    const customer = await db.getOne(text, values);
    logger.info('Cliente criado', { customerId: customer.id });
    
    return res.status(201).json(customer);
  } catch (error) {
    logger.error('Erro ao criar customer', { error: error.message });
    return res.status(500).json({ error: 'Erro ao criar cliente.' });
  }
}

// Protege a rota inteira
export default withAuth(handler);
