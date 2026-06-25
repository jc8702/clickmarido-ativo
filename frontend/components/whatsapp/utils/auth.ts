/**
 * Utilitário compartilhado de autenticação
 * Consolida lógica de getUserId duplicada nas rotas de API
 */

import { NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'clickmarido_secret';

/**
 * Extrai o userId do token JWT no header Authorization
 * @returns userId ou null se não autorizado
 */
export function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}
