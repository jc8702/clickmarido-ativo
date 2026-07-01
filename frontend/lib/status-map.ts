/**
 * STATUS-MAP: Fonte única da verdade para todos os status do sistema ClickMarido.
 * 
 * REGRA: Qualquer novo status DEVE ser definido aqui antes de ser usado em rotas,
 * frontend ou webhooks.
 */

// ============================
// QUOTATION (Orçamento)
// ============================
export const QuotationStatus = {
  RASCUNHO: 'rascunho',
  PENDENTE: 'pendente',
  ENVIADO: 'enviado',
  ACEITO: 'aceito',
  REJEITADO: 'rejeitado',
  CANCELADO: 'cancelado',
} as const;

export type QuotationStatusType = typeof QuotationStatus[keyof typeof QuotationStatus];

export const QUOTATION_STATUS_LABELS: Record<QuotationStatusType, string> = {
  rascunho: 'Rascunho',
  pendente: 'Pendente',
  enviado: 'Enviado',
  aceito: 'Aprovado',
  rejeitado: 'Rejeitado',
  cancelado: 'Cancelado',
};

// ============================
// SERVICE ORDER (Ordem de Serviço)
// ============================
export const ServiceOrderStatus = {
  AGENDADA: 'agendada',
  EM_EXECUCAO: 'em_execucao',
  CONCLUIDA: 'concluida',
  CANCELADA: 'cancelada',
} as const;

export type ServiceOrderStatusType = typeof ServiceOrderStatus[keyof typeof ServiceOrderStatus];

export const SERVICE_ORDER_STATUS_LABELS: Record<ServiceOrderStatusType, string> = {
  agendada: 'Agendada',
  em_execucao: 'Em Execução',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

// ============================
// PAYMENT (Pagamento)
// ============================
export const PaymentStatus = {
  PENDENTE: 'pendente',
  CONFIRMADO: 'confirmado',
  CANCELADO: 'cancelado',
} as const;

export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatusType, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
};

/**
 * Normaliza status de pagamento para o valor canônico.
 * Usado para converter valores legados (aprovado, pago) para o padrão (confirmado).
 */
export function normalizePaymentStatus(status: string): PaymentStatusType {
  const normalizeMap: Record<string, PaymentStatusType> = {
    aprovado: 'confirmado',
    pago: 'confirmado',
    confirmado: 'confirmado',
    pendente: 'pendente',
    cancelado: 'cancelado',
  };
  return normalizeMap[status] || 'pendente';
}

// ============================
// INVOICE (Nota Fiscal)
// ============================
export const InvoiceStatus = {
  RASCUNHO: 'rascunho',
  EMITIDA: 'emitida',
  PAGA: 'paga',
  CANCELADA: 'cancelada',
} as const;

export type InvoiceStatusType = typeof InvoiceStatus[keyof typeof InvoiceStatus];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatusType, string> = {
  rascunho: 'Rascunho',
  emitida: 'Emitida',
  paga: 'Paga',
  cancelada: 'Cancelada',
};

// ============================
// PURCHASE ORDER (Ordem de Compra)
// ============================
export const PurchaseOrderStatus = {
  RASCUNHO: 'rascunho',
  EMITIDA: 'emitida',
  APROVADA: 'aprovada',
  PARCIALMENTE_RECEBIDA: 'parcialmente_recebida',
  RECEBIDA: 'recebida',
  CANCELADA: 'cancelada',
} as const;

export type PurchaseOrderStatusType = typeof PurchaseOrderStatus[keyof typeof PurchaseOrderStatus];

// ============================
// EXPENSE (Despesa)
// ============================
export const ExpenseStatus = {
  PENDENTE: 'pendente',
  PAGA: 'paga',
  CANCELADA: 'cancelada',
} as const;

export type ExpenseStatusType = typeof ExpenseStatus[keyof typeof ExpenseStatus];

// ============================
// APPOINTMENT (Agendamento)
// ============================
export const AppointmentStatusModel = {
  AGENDADA: 'agendada',
  CONFIRMADA: 'confirmada',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDA: 'concluida',
  CANCELADA: 'cancelada',
  NAO_COMPARECEU: 'nao_compareceu',
} as const;

export type AppointmentStatusModelType = typeof AppointmentStatusModel[keyof typeof AppointmentStatusModel];

// Transições válidas de status de agendamento
export const APPOINTMENT_VALID_TRANSITIONS: Record<string, string[]> = {
  agendada: ['confirmada', 'cancelada'],
  confirmada: ['em_andamento', 'cancelada'],
  em_andamento: ['concluida', 'nao_compareceu'],
  concluida: [],
  cancelada: [],
  nao_compareceu: [],
};

// ============================
// CAMPOS PERMITIDOS (anti mass-assignment)
// ============================
export const APPOINTMENT_ALLOWED_FIELDS = ['date', 'duration', 'notes', 'location', 'technicianId'] as const;
