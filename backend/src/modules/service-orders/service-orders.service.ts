import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateServiceOrderDto, CompleteServiceOrderDto, CancelServiceOrderDto, UploadPhotosDto } from './dto/service-order.dto';
import { RoundRobinTechnicianStrategy } from './strategies/technician-assignment.strategy';

let serviceOrdersDb: any[] = [];
let seqGlobal = 1000;

@Injectable()
export class ServiceOrdersService {
  private assignmentStrategy: RoundRobinTechnicianStrategy;

  constructor() {
    this.assignmentStrategy = new RoundRobinTechnicianStrategy(
      (tenantId: string) => serviceOrdersDb.filter(o => o.tenantId === tenantId)
    );
  }

  async findAll(tenantId: string, status?: string) {
    let filtered = serviceOrdersDb.filter(o => o.tenantId === tenantId);
    if (status) {
      filtered = filtered.filter(o => o.status === status);
    }
    return filtered;
  }

  async findById(id: string, tenantId: string) {
    const os = serviceOrdersDb.find(o => o.id === id && o.tenantId === tenantId);
    if (!os) throw new NotFoundException('Ordem de Serviço não encontrada');
    return os;
  }

  async create(tenantId: string, dto: CreateServiceOrderDto) {
    // 1. Busca o técnico menos ocupado
    const technicianId = await this.assignmentStrategy.assignNext(tenantId);

    seqGlobal++;
    const newOs = {
      id: Math.random().toString(36).substring(7),
      number: `OS-${seqGlobal}`,
      tenantId,
      quotation_id: dto.quotation_id,
      customer_id: 'cust-mock-123', // Em um cenário real, viria do quotation
      technician_id: technicianId,
      address_id: 'addr-mock-123', // Em um cenário real, viria do customer default address
      scheduled_date: new Date(dto.scheduled_date),
      scheduled_time: dto.scheduled_time,
      status: 'agendada',
      arrival_time: null,
      completion_time: null,
      before_photos: [],
      after_photos: [],
      final_total: null,
      created_at: new Date()
    };

    serviceOrdersDb.push(newOs);

    // Envio de notificações simulado
    console.log(`[MOCK NOTIFICAÇÃO] SMS Técnico ${technicianId}: Nova OS Agendada ${newOs.number}`);
    console.log(`[MOCK NOTIFICAÇÃO] E-mail Cliente: Serviço ${newOs.number} agendado para ${dto.scheduled_date} às ${dto.scheduled_time}`);

    return newOs;
  }

  async start(id: string, tenantId: string, userId: string) {
    const os = await this.findById(id, tenantId);
    if (os.status !== 'agendada') {
      throw new BadRequestException('Apenas ordens agendadas podem ser iniciadas');
    }

    os.status = 'em_progresso';
    os.arrival_time = new Date();

    console.log(`[MOCK NOTIFICAÇÃO] WhatsApp Cliente: O técnico acaba de chegar e iniciar a OS ${os.number}.`);
    
    return os;
  }

  async uploadPhotos(id: string, tenantId: string, dto: UploadPhotosDto) {
    const os = await this.findById(id, tenantId);
    
    // Simula validação de que só faz upload se não estiver concluída/cancelada
    if (os.status === 'concluida' || os.status === 'cancelada') {
      throw new BadRequestException('Impossível alterar fotos de uma OS finalizada');
    }

    if (dto.before_photos) os.before_photos = [...os.before_photos, ...dto.before_photos];
    if (dto.after_photos) os.after_photos = [...os.after_photos, ...dto.after_photos];

    console.log(`[MOCK CLOUDINARY] Upload de fotos realizado com sucesso para OS ${os.number}`);
    
    return os;
  }

  async complete(id: string, tenantId: string, dto: CompleteServiceOrderDto) {
    const os = await this.findById(id, tenantId);
    if (os.status !== 'em_progresso') {
      throw new BadRequestException('Apenas ordens em progresso podem ser concluídas');
    }

    os.status = 'concluida';
    os.completion_time = new Date();
    os.final_total = dto.finalTotal || null;
    os.notes = dto.notes || '';

    return os;
  }

  async cancel(id: string, tenantId: string, dto: CancelServiceOrderDto) {
    const os = await this.findById(id, tenantId);
    if (os.status === 'concluida') {
      throw new BadRequestException('Impossível cancelar uma OS já concluída');
    }

    os.status = 'cancelada';
    os.cancel_reason = dto.reason;
    os.canceled_at = new Date();

    return os;
  }
}
