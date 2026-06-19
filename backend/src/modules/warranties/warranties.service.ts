import { Injectable, NotFoundException } from '@nestjs/common';

export interface Warranty {
  id: string;
  tenantId: string;
  service_order_id: string;
  type: string;
  start_date: Date;
  end_date: Date;
  status: 'ativa' | 'expirada' | 'usada';
  claim_reason?: string;
  claimed_at?: Date;
}

export let warrantiesDb: Warranty[] = [];

@Injectable()
export class WarrantiesService {
  async createFromServiceOrder(tenantId: string, serviceOrderId: string, durationMonths = 12) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    const newWarranty: Warranty = {
      id: `warr_${Math.random().toString(36).substring(7)}`,
      tenantId,
      service_order_id: serviceOrderId,
      type: `${durationMonths} Meses de Cobertura`,
      start_date: startDate,
      end_date: endDate,
      status: 'ativa',
    };

    warrantiesDb.push(newWarranty);
    return newWarranty;
  }

  async findActive(tenantId: string, customerId?: string) {
    // Para simplificar a simulação de RLS / Tenant
    return warrantiesDb.filter(w => w.tenantId === tenantId && w.status === 'ativa');
  }

  async findExpiringSoon(tenantId: string) {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return warrantiesDb.filter(w => 
      w.tenantId === tenantId && 
      w.status === 'ativa' && 
      w.end_date > now && 
      w.end_date <= thirtyDaysFromNow
    );
  }

  async claimWarranty(id: string, tenantId: string, description: string) {
    const warranty = warrantiesDb.find(w => w.id === id && w.tenantId === tenantId);
    if (!warranty) throw new NotFoundException('Garantia não encontrada');

    warranty.status = 'usada';
    warranty.claim_reason = description;
    warranty.claimed_at = new Date();

    console.log(`[WARRANTY CLAIMED] Garantia ${warranty.id} acionada. Descrição: "${description}"`);
    return warranty;
  }

  async clear() {
    warrantiesDb = [];
  }
}
