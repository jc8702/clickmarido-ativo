# STATUS-MAP — ClickMarido CRM

Este documento serve como a especificação formal e fonte de verdade para todos os status utilizados nas entidades do sistema ClickMarido.

## 1. Mapeamento de Status por Entidade

### 1.1 Orçamentos (Quotation)
- **rascunho**: Orçamento criado em modo de edição, invisível para o cliente.
- **pendente**: Aguardando revisão interna antes de ser enviado.
- **enviado**: Link público gerado e enviado para o cliente.
- **aceito**: Orçamento aprovado pelo cliente (aciona a geração automática de Ordem de Serviço).
- **rejeitado**: Orçamento reprovado pelo cliente.
- **cancelado**: Expirado ou cancelado manualmente pela administração.

### 1.2 Ordens de Serviço (ServiceOrder)
- **agendada**: Ordem de serviço criada com data agendada.
- **em_execucao**: Técnico iniciou o trabalho presencialmente (via app).
- **concluida**: Trabalho finalizado e assinado pelo cliente.
- **cancelada**: Cancelamento manual do serviço.

### 1.3 Pagamentos (Payment)
- **pendente**: Link ou QR Code gerado, aguardando compensação.
- **confirmado**: Pagamento recebido e liquidado pelo banco/gateway (Asaas ou Mercado Pago).
- **cancelado**: Pagamento expirado ou cancelado administrativamente.

### 1.4 Faturas (Invoice)
- **rascunho**: Fatura em rascunho.
- **emitida**: Fatura registrada e enviada ao cliente.
- **paga**: Liquidada após a confirmação de todos os pagamentos vinculados.
- **cancelada**: Fatura anulada.

### 1.5 Ordens de Compra (PurchaseOrder)
- **rascunho**: Ordem de compra em edição.
- **emitida**: Enviada para o fornecedor.
- **aprovada**: Aprovada pela gerência/financeiro.
- **recebida**: Materiais totalmente recebidos no estoque.
- **cancelada**: Pedido cancelado.

### 1.6 Despesas (Expense)
- **pendente**: Despesa registrada, aguardando data de vencimento/pagamento.
- **paga**: Liquidada financeiramente.
- **cancelada**: Despesa cancelada ou estornada.

### 1.7 Agendamentos (Appointment)
- **agendada**: Agendamento inicial do técnico para o cliente.
- **confirmada**: Confirmado pelo técnico/administração.
- **em_andamento**: Execução presencial iniciada.
- **concluida**: Finalizado.
- **cancelada**: Cancelado.
- **nao_compareceu**: Cliente ausente no local do atendimento.

---

## 2. Padrões de Implementação no Código

### 2.1 Uso das Constantes e Helpers
Toda a lógica de transição e exibição de status deve importar os enums de `lib/status-map.ts`:

```typescript
import { 
  QuotationStatus, 
  ServiceOrderStatus, 
  PaymentStatus, 
  InvoiceStatus 
} from '@/lib/status-map';

// Exemplo de verificação de status
if (payment.status === PaymentStatus.CONFIRMADO) {
  // Lógica financeira
}
```

### 2.2 Normalização de Inputs Legados
Ao receber eventos externos de gateways (Asaas, Mercado Pago), sempre utilize a função de normalização:

```typescript
import { normalizePaymentStatus } from '@/lib/status-map';

const normalized = normalizePaymentStatus(payload.status);
```
