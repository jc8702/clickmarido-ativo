import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return { success: false, error: 'JWT_SECRET não configurado' };

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Token não fornecido' };
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, secret);

    if (!decoded) {
      return { success: false, error: 'Token inválido ou expirado' };
    }

    return { success: true, user: decoded };
  } catch (error) {
    return { success: false, error: 'Token inválido ou expirado' };
  }
}

export const signToken = (payload: any) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET não configurado');
  return jwt.sign(payload, secret, {
    expiresIn: '7d',
  });
};

export const verifyToken = (token: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};
