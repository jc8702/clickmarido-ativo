// ============================================================
// Client Mercado Pago - Integração Pagamentos
// ============================================================

import { MercadoPagoConfig, Payment, PaymentRefund } from 'mercadopago';

// ATENÇÃO: Credenciais devem vir de .env.local (NUNCA hardcoded)
if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
  console.warn('⚠️ MERCADO_PAGO_ACCESS_TOKEN não configurado');
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
  },
});

export const paymentClient = new Payment(client);
export const refundClient = new PaymentRefund(client);

// ============================================================
// Tipos
// ============================================================

export interface CreatePixPaymentParams {
  transactionAmount: number;
  description: string;
  externalReference: string;
  email?: string;
  expiresIn?: number; // segundos
}

export interface CreateBoletoPaymentParams {
  transactionAmount: number;
  description: string;
  externalReference: string;
  email?: string;
  expiresIn?: number; // dias
}

export interface CreateCardPaymentParams {
  transactionAmount: number;
  description: string;
  externalReference: string;
  token: string;
  paymentMethodId: string;
  installments?: number;
  payerEmail?: string;
}

export interface MercadoPagoPayment {
  id: string;
  status: string;
  statusDetail: string;
  paymentMethodId: string;
  transactionAmount: number;
  externalReference?: string;
  dateOfExpiration?: string;
  pointOfInteraction?: {
    transactionData?: {
      qrCodeBase64?: string;
      ticketUrl?: string;
    };
  };
  transactionDetails?: {
    externalResourceUrl?: string;
  };
  barcode?: {
    content?: string;
  };
}

// ============================================================
// Funções
// ============================================================

/**
 * Criar pagamento PIX via Mercado Pago
 */
export async function createPixPayment(params: CreatePixPaymentParams) {
  const { transactionAmount, description, externalReference, email, expiresIn = 3600 } = params;

  const expirationDate = new Date(Date.now() + expiresIn * 1000);

  const payment = await paymentClient.create({
    body: {
      transaction_amount: transactionAmount,
      description,
      payment_method_id: 'pix',
      date_of_expiration: expirationDate.toISOString(),
      external_reference: externalReference,
      notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL,
      ...(email && {
        payer: { email },
      }),
    },
  });

  const p = payment as any;
  return {
    mpPaymentId: p.id,
    status: p.status,
    qrCodeBase64: p.point_of_interaction?.transaction_data?.qr_code_base64,
    pixKey: p.point_of_interaction?.transaction_data?.ticket_url,
    expiresAt: p.date_of_expiration,
  };
}

/**
 * Criar pagamento Boleto via Mercado Pago
 */
export async function createBoletoPayment(params: CreateBoletoPaymentParams) {
  const { transactionAmount, description, externalReference, email, expiresIn = 3 } = params;

  const expirationDate = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000);

  const payment = await paymentClient.create({
    body: {
      transaction_amount: transactionAmount,
      description,
      payment_method_id: 'bolbradesco',
      date_of_expiration: expirationDate.toISOString(),
      external_reference: externalReference,
      notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL,
      ...(email && {
        payer: { email },
      }),
    },
  });

  const p = payment as any;
  return {
    mpPaymentId: p.id,
    status: p.status,
    boletoUrl: p.transaction_details?.external_resource_url,
    barcode: p.barcode?.content,
    expiresAt: p.date_of_expiration,
  };
}

/**
 * Criar pagamento Cartão via Mercado Pago
 */
export async function createCardPayment(params: CreateCardPaymentParams) {
  const {
    transactionAmount,
    description,
    externalReference,
    token,
    paymentMethodId,
    installments = 1,
    payerEmail,
  } = params;

  const payment = await paymentClient.create({
    body: {
      transaction_amount: transactionAmount,
      description,
      payment_method_id: paymentMethodId,
      token,
      installments,
      external_reference: externalReference,
      notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL,
      ...(payerEmail && {
        payer: { email: payerEmail },
      }),
    },
  });

  const p = payment as any;
  return {
    mpPaymentId: p.id,
    status: p.status,
    statusDetail: p.status_detail,
  };
}

/**
 * Buscar pagamento por ID no Mercado Pago
 */
export async function getPaymentById(mpPaymentId: string) {
  const payment = await paymentClient.get({ id: mpPaymentId });
  return payment;
}

/**
 * Buscar pagamento por external_reference
 */
export async function getPaymentByExternalReference(externalReference: string) {
  const payments = await paymentClient.search({
    options: {
      external_reference: externalReference,
    },
  });

  return payments.results?.[0] || null;
}

/**
 * Converter status MP para status interno
 */
export function mapMpStatusToInternal(mpStatus: string): string {
  const statusMap: Record<string, string> = {
    approved: 'confirmado',
    pending: 'pendente',
    authorized: 'pendente',
    in_process: 'pendente',
    in_review: 'pendente',
    rejected: 'cancelado',
    cancelled: 'cancelado',
    refunded: 'devolvido',
    charged_back: 'devolvido',
  };

  return statusMap[mpStatus] || 'pendente';
}

/**
 * Verificar se pagamento foi aprovado
 */
export function isPaymentApproved(mpStatus: string): boolean {
  return mpStatus === 'approved';
}

/**
 * Formatar valor para exibição
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
