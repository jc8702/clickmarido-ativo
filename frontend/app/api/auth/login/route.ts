import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';

const ADMIN_CREDENTIALS = {
  email: 'jose@clickmarido.local',
  password: '123456',
};

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRATION = '7d';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (email !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    return NextResponse.json({
      token,
      user: {
        email,
        role: 'admin',
      },
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar login' },
      { status: 500 }
    );
  }
}
