import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { QuotationDto } from './dto/quotation.dto';
import { QuotationCreatedEvent, QuotationApprovedEvent } from './events/quotation.events';

// In-memory mock replacing DB
let quotationsDb: any[] = [];
let seqGlobal = 1000;

@Injectable()
export class QuotationsService {
  
  // Emulates an Event Emitter
  private emitEvent(eventName: string, payload: any) {
    console.log(`[EVENT EMITTED] ${eventName}:`, payload);
    if (eventName === 'quotation.approved') {
      console.log(`[MOCK] ServiceOrder automatically created for quotation ${payload.quotationId}`);
    }
  }

  async findAll(tenantId: string, status?: string) {
    let filtered = quotationsDb.filter(q => q.tenantId === tenantId);
    if (status) {
      filtered = filtered.filter(q => q.status === status);
    }
    return filtered;
  }

  async findById(id: string, tenantId: string) {
    const q = quotationsDb.find(q => q.id === id && q.tenantId === tenantId);
    if (!q) throw new NotFoundException('Orçamento não encontrado');
    return q;
  }

  async create(tenantId: string, userId: string, dto: QuotationDto) {
    const subtotal = dto.items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
    const total = subtotal - (dto.discount || 0);
    if (total <= 0) throw new BadRequestException('Total deve ser maior que zero');

    seqGlobal++;
    const newQuotation = {
      id: Math.random().toString(36).substring(7),
      number: `ORC-${seqGlobal}`,
      tenantId,
      created_by: userId,
      customer_id: dto.customer_id,
      items: dto.items,
      subtotal,
      discount: dto.discount,
      total,
      status: 'draft',
      valid_until: new Date(dto.valid_until),
      approval_link: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
      created_at: new Date(),
    };

    quotationsDb.push(newQuotation);

    this.emitEvent('quotation.created', new QuotationCreatedEvent(
      newQuotation.id, tenantId, newQuotation.customer_id, newQuotation.total
    ));

    return newQuotation;
  }

  async update(id: string, tenantId: string, dto: Partial<QuotationDto>) {
    const q = await this.findById(id, tenantId);
    if (q.status !== 'draft') {
      throw new BadRequestException('Apenas orçamentos em rascunho podem ser alterados');
    }

    if (dto.items) {
      q.items = dto.items;
      q.subtotal = q.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0);
    }
    if (dto.discount !== undefined) q.discount = dto.discount;
    
    q.total = q.subtotal - (q.discount || 0);
    if (dto.valid_until) q.valid_until = new Date(dto.valid_until);

    return q;
  }

  async send(id: string, tenantId: string, method: 'email' | 'whatsapp') {
    const q = await this.findById(id, tenantId);
    if (q.status === 'approved' || q.status === 'rejected' || q.status === 'expired') {
      throw new BadRequestException('Este orçamento já está finalizado');
    }
    q.status = 'sent';
    console.log(`[MOCK] Orçamento ${q.number} enviado via ${method}. Link: /quotations/view?token=${q.approval_link}`);
    return { success: true, status: q.status };
  }

  async getPublicView(approvalToken: string) {
    const q = quotationsDb.find(q => q.approval_link === approvalToken);
    if (!q) throw new NotFoundException('Link inválido ou não encontrado');

    if (new Date() > new Date(q.valid_until)) {
      q.status = 'expired';
      throw new NotFoundException('Este orçamento já expirou');
    }

    return {
      id: q.id,
      number: q.number,
      items: q.items,
      subtotal: q.subtotal,
      discount: q.discount,
      total: q.total,
      valid_until: q.valid_until,
      status: q.status,
      customer_id: q.customer_id
    };
  }

  async approveByCustomer(approvalToken: string) {
    const q = quotationsDb.find(q => q.approval_link === approvalToken);
    if (!q) throw new NotFoundException('Link inválido');

    if (q.status === 'approved') throw new BadRequestException('Orçamento já aprovado');
    if (new Date() > new Date(q.valid_until) || q.status === 'expired') {
      throw new BadRequestException('Este orçamento expirou');
    }

    q.status = 'approved';
    
    this.emitEvent('quotation.approved', new QuotationApprovedEvent(
      q.id, q.tenantId, q.customer_id, q.items, q.total
    ));

    return { success: true, status: q.status, message: 'Orçamento aprovado com sucesso' };
  }

  async markAsExpired() {
    const now = new Date();
    let count = 0;
    quotationsDb.forEach(q => {
      if ((q.status === 'draft' || q.status === 'sent' || q.status === 'viewed') && now > new Date(q.valid_until)) {
        q.status = 'expired';
        count++;
      }
    });
    return { expired_count: count };
  }
}
