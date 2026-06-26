import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.JWT_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];

  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "paymentMethods" TEXT DEFAULT ''`
    );
    results.push('Added paymentMethods column');

    await prisma.$executeRawUnsafe(
      `ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "executionDeadline" TEXT DEFAULT ''`
    );
    results.push('Added executionDeadline column');
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message, results }, { status: 500 });
  }

  return NextResponse.json({ success: true, results });
}
