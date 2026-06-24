import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

interface AuditParams {
  request: NextRequest;
  entity: 'quotation' | 'payment' | 'service_order' | 'user';
  entityId: string;
  action: 'created' | 'updated' | 'deleted' | 'automation_triggered' | string;
  oldValue?: any;
  newValue?: any;
}

export async function logAudit({
  request,
  entity,
  entityId,
  action,
  oldValue,
  newValue,
}: AuditParams) {
  let createdBy = 'system';

  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ') && JWT_SECRET) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { email?: string };
      if (decoded && decoded.email) {
        createdBy = decoded.email;
      }
    }
  } catch (err) {
    console.error('[AUDIT_LOG_AUTH_ERROR]', err);
  }

  try {
    await prisma.auditLog.create({
      data: {
        entity,
        entityId,
        action,
        oldValue: oldValue || null,
        newValue: newValue || null,
        createdBy,
      },
    });
  } catch (error) {
    console.error('[AUDIT_LOG_CREATE_ERROR]', error);
  }
}
