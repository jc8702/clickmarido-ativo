import { Pool } from 'pg';
import logger from '../utils/logger';

// Instância única para evitar recriação de pool no serverless
let pool;

if (!pool) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Em Vercel/Serverless, é bom ter algumas configs de pool ajustadas
    max: 20, // maximo de conecoes por container
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err, client) => {
    logger.error('Erro inesperado no cliente postgres', err);
  });
}

/**
 * Executa uma query no banco de dados.
 * @param {string} text - A query SQL
 * @param {any[]} params - Parâmetros da query
 * @returns {Promise<any>}
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.info(`[DB] Query executada`, { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error(`[DB] Erro na query`, { text, error: error.message });
    throw error;
  }
};

/**
 * Executa uma query e retorna a primeira linha.
 * @param {string} text 
 * @param {any[]} params 
 * @returns {Promise<any>}
 */
export const getOne = async (text, params) => {
  const { rows } = await query(text, params);
  return rows[0];
};

export default {
  query,
  getOne,
  pool,
};
