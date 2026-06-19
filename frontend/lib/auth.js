import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

/**
 * Função geradora de token JWT
 */
export const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d', // Válido por 7 dias
  });
};

/**
 * Helper de verificação JWT
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Higher Order Function para proteger as rotas da API no Next.js
 * Atua como o antigo middleware verifyToken do Express.
 * @param {Function} handler O handler da API route (req, res) => {}
 */
export const withAuth = (handler) => {
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.error('Token não fornecido ou inválido');
        return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);

      if (!decoded) {
        logger.error('Token inválido ou expirado');
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
      }

      // Injeta o usuário decodificado na request
      req.user = decoded;

      // Chama o handler original
      return await handler(req, res);
    } catch (error) {
      logger.error('Erro no middleware de autenticação', { error: error.message });
      return res.status(500).json({ error: 'Erro interno de servidor.' });
    }
  };
};
