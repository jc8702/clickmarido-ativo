import { signToken } from '../../../lib/auth';
import logger from '../../../utils/logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { email, password } = req.body;

    // A validação é feita via variáveis de ambiente, conforme requisito:
    // "Validar email + password vs .env (ADMIN_EMAIL, ADMIN_PASSWORD)"
    // Usamos NEXT_PUBLIC_ADMIN_EMAIL ou ADMIN_EMAIL (a requisição é server-side, então os dois funcionariam, 
    // mas na config do prompt havia ADMIN_EMAIL).
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    if (email !== adminEmail || password !== adminPassword) {
      logger.error('Tentativa de login falhou - Credenciais inválidas', { email });
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Gerar token
    const token = signToken({ email, role: 'admin' });

    logger.info('Login bem-sucedido', { email });
    return res.status(200).json({ token, message: 'Autenticado com sucesso' });
  } catch (error) {
    logger.error('Erro no endpoint de login', { error: error.message });
    return res.status(500).json({ error: 'Erro interno de servidor' });
  }
}
