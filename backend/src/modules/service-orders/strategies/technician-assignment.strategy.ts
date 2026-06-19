import { Injectable } from '@nestjs/common';

// Mock DB de técnicos
const techniciansDb = [
  { id: 'tech-1', name: 'Técnico Alpha', tenantId: 'tenant-a-123' },
  { id: 'tech-2', name: 'Técnico Beta', tenantId: 'tenant-a-123' },
];

export interface AssignmentStrategy {
  assignNext(tenantId: string): Promise<string>;
}

@Injectable()
export class RoundRobinTechnicianStrategy implements AssignmentStrategy {
  
  // Injecting the service-orders DB reference loosely for the MVP mock
  constructor(private readonly getActiveOrders: (tenantId: string) => any[]) {}

  async assignNext(tenantId: string): Promise<string> {
    const availableTechs = techniciansDb.filter(t => t.tenantId === tenantId);
    if (availableTechs.length === 0) {
      throw new Error('Nenhum técnico disponível neste tenant');
    }

    const activeOrders = this.getActiveOrders(tenantId);
    
    // Calcula a carga de cada técnico
    const loads = availableTechs.map(tech => {
      const activeCount = activeOrders.filter(o => 
        o.technician_id === tech.id && 
        (o.status === 'agendada' || o.status === 'em_progresso')
      ).length;
      return { techId: tech.id, count: activeCount };
    });

    // Ordena do menor pro maior e pega o primeiro (round-robin / balanceamento por carga)
    loads.sort((a, b) => a.count - b.count);
    return loads[0].techId;
  }
}
