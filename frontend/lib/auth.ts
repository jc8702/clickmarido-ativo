import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Token não fornecido' };
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded) {
      return { success: false, error: 'Token inválido ou expirado' };
    }

    return { success: true, user: decoded };
  } catch (error) {
    return { success: false, error: 'Token inválido ou expirado' };
  }
}

export const signToken = (payload: any) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
