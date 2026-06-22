diff --git a/compras/PLANO_IMPLEMENTACAO_MODULO_COMPRAS.md b/compras/PLANO_IMPLEMENTACAO_MODULO_COMPRAS.md
new file mode 100644
index 0000000000000000000000000000000000000000..af8a1e73f9596433e5296835c2ab527b11b63ffd
--- /dev/null
+++ b/compras/PLANO_IMPLEMENTACAO_MODULO_COMPRAS.md
@@ -0,0 +1,746 @@
+# Plano de Implementação - Módulo de Compras e Ordens de Compra
+
+**Projeto:** Click Marido CRM  
+**Data:** 22/06/2026  
+**Objetivo:** orientar um agente de IA, como Gemini, OpenCode ou OpenRouter, a ler o sistema existente e implementar o módulo de compras integrado com Orçamentos, Serviços/Peças e Financeiro.
+
+---
+
+## 1. Contexto do sistema atual
+
+O sistema já possui uma base relevante para o módulo de compras:
+
+- **Orçamentos:** `Quotation` e `QuotationItem` representam propostas comerciais e seus itens.
+- **Serviços e peças:** `Product` representa serviços e peças, com `type` definido como `SERVICO` ou `PECA`.
+- **Ordens de serviço:** `ServiceOrder` é criada a partir de orçamento aprovado e concentra execução, técnico, status e total final.
+- **Financeiro:** `Expense`, `Vendor`, `FinancialTransaction`, `Payment`, `Invoice` e `AccountBalance` já existem no schema.
+- **Fornecedores:** existe cadastro inicial de `Vendor`, porém ele precisa ser enriquecido para classificação, avaliação e histórico de compras.
+
+### Arquivos que o agente deve ler primeiro
+
+1. `AGENTS.md`
+2. `README.md`
+3. `RESUMO_PROJETO.md`
+4. `frontend/prisma/schema.prisma`
+5. `frontend/app/api/vendors/route.ts`
+6. `frontend/app/api/vendors/[id]/route.ts`
+7. `frontend/app/api/quotations/route.ts`
+8. `frontend/app/api/quotations/[id]/route.ts`
+9. `frontend/app/api/service-orders/route.ts`
+10. `frontend/app/api/service-orders/[id]/route.ts`
+11. `frontend/app/api/financial/dashboard/route.ts`
+12. `frontend/app/api/expenses/route.ts`, caso exista no ambiente de implementação
+13. `frontend/components/Sidebar.tsx`
+14. `frontend/app/(dashboard)/layout.tsx`
+15. `financeiro/PLANEJAMENTO_IMPLANTACAO_MODULO_FINANCEIRO.md`
+16. `serviços_peças/INDEX.md`
+17. `serviços_peças/EXEMPLOS_INTEGRACAO.md`
+
+---
+
+## 2. Escopo funcional
+
+### 2.1 Cadastros
+
+#### Fornecedores
+Expandir o cadastro atual de fornecedores para conter:
+
+- Razão social / nome.
+- Nome fantasia.
+- CNPJ/CPF.
+- Inscrição estadual / municipal.
+- E-mail principal.
+- Telefone / WhatsApp.
+- Endereço estruturado ou endereço textual, mantendo compatibilidade com o campo atual.
+- Pessoa de contato.
+- Categoria principal: `MATERIAL`, `SERVICO`, `TRANSPORTE`, `EQUIPAMENTO`, `TERCEIRIZADO`, `OUTROS`.
+- Classificação: `A`, `B`, `C`, `D`.
+- Status: ativo/inativo/bloqueado.
+- Prazo médio de entrega.
+- Condição padrão de pagamento.
+- Observações.
+
+#### Classificação de fornecedores
+Criar mecanismo simples e auditável de classificação:
+
+| Classificação | Regra sugerida | Uso no sistema |
+|---|---|---|
+| A | entrega no prazo, bom preço, baixa incidência de problemas | fornecedor preferencial |
+| B | desempenho regular e confiável | fornecedor aprovado |
+| C | atrasos ocasionais ou divergências de preço/qualidade | fornecedor com atenção |
+| D | reincidência de problemas | fornecedor bloqueável ou não recomendado |
+
+A classificação pode começar manual e, em fase posterior, ser sugerida automaticamente por histórico.
+
+### 2.2 Ordens de compra
+
+Campos padrão esperados em uma ordem de compra:
+
+- Número único da ordem de compra.
+- Fornecedor.
+- Status.
+- Data de emissão.
+- Data prevista de entrega.
+- Data real de entrega.
+- Condição de pagamento.
+- Forma de pagamento.
+- Centro de custo ou vínculo operacional.
+- Vínculo opcional com orçamento.
+- Vínculo opcional com ordem de serviço.
+- Solicitante / comprador.
+- Endereço de entrega.
+- Itens comprados.
+- Subtotal.
+- Desconto.
+- Frete.
+- Impostos.
+- Valor total.
+- Observações internas.
+- Termos e condições para o fornecedor.
+- Anexos/documentos.
+- Histórico de eventos.
+
+### 2.3 Itens da ordem de compra
+
+Cada item deve conter:
+
+- Produto/peça/serviço vinculado ao `Product`, quando existir.
+- Descrição livre, para compras eventuais ainda não cadastradas.
+- Quantidade.
+- Unidade.
+- Valor unitário.
+- Desconto.
+- Impostos.
+- Subtotal.
+- Status do item: pendente, recebido parcial, recebido total, cancelado.
+- Quantidade recebida.
+- Observações.
+
+### 2.4 Histórico de compras
+
+O histórico deve responder:
+
+- O que foi comprado?
+- De quem foi comprado?
+- Para qual orçamento ou ordem de serviço?
+- Qual foi o valor negociado?
+- Quando foi pedido?
+- Quando foi entregue?
+- Houve atraso?
+- Gerou despesa no financeiro?
+- Qual foi a evolução de status?
+
+### 2.5 Integrações obrigatórias
+
+#### Integração com Orçamentos
+
+- Permitir criar ordem de compra a partir de um orçamento aprovado ou em execução.
+- Sugerir itens de compra com base nos `QuotationItem` cujo produto seja `PECA` ou cujo serviço exija insumo externo.
+- Guardar `quotationId` na ordem de compra.
+- Exibir no detalhe do orçamento uma aba ou seção “Compras vinculadas”.
+
+#### Integração com Serviços e Peças
+
+- Reutilizar `Product` para selecionar peças/serviços comprados.
+- Permitir compra de item não cadastrado, mas sugerir cadastro posterior.
+- Exibir custo de compra/histórico por produto, quando aplicável.
+- Em fase futura, atualizar custo médio ou último custo de compra do produto.
+
+#### Integração com Ordens de Serviço
+
+- Permitir criar ordem de compra a partir de uma OS.
+- Guardar `serviceOrderId` na ordem de compra.
+- Exibir compras vinculadas dentro do detalhe da OS.
+- Permitir marcar recebimento da compra para liberar execução da OS.
+
+#### Integração com Financeiro
+
+- Ao aprovar/enviar a ordem de compra, permitir gerar uma `Expense` prevista ou pendente.
+- Ao receber/finalizar a ordem de compra, atualizar ou confirmar a `Expense`.
+- Criar `FinancialTransaction` quando a despesa for registrada/paga, seguindo o padrão do módulo financeiro.
+- O `vendorId` da despesa deve apontar para o fornecedor da ordem de compra.
+
+---
+
+## 3. Modelo de dados proposto
+
+### 3.1 Atualização de `Vendor`
+
+Adicionar campos sugeridos ao modelo existente:
+
+```prisma
+model Vendor {
+  id                String    @id @default(cuid())
+  name              String    @db.VarChar(255)
+  tradeName         String?   @default("")
+  email             String?   @db.VarChar(255)
+  phone             String?   @db.VarChar(20)
+  whatsapp          String?   @db.VarChar(20)
+  cnpjCpf           String?   @unique
+  stateRegistration String?   @default("")
+  municipalRegistration String? @default("")
+  address           String?   @default("")
+  contactName       String?   @default("")
+  category          String    @default("OUTROS")
+  classification    String    @default("B")
+  paymentTerms      String?   @default("")
+  averageDeliveryDays Int?    @default(0)
+  isActive          Boolean   @default(true)
+  isBlocked         Boolean   @default(false)
+  notes             String?   @default("")
+  createdAt         DateTime  @default(now())
+  updatedAt         DateTime  @updatedAt
+
+  expenses          Expense[]
+  purchaseOrders    PurchaseOrder[]
+
+  @@index([cnpjCpf])
+  @@index([isActive])
+  @@index([classification])
+  @@index([category])
+  @@map("vendors")
+}
+```
+
+### 3.2 Novo modelo `PurchaseOrder`
+
+```prisma
+model PurchaseOrder {
+  id                String    @id @default(cuid())
+  number            String    @unique @db.VarChar(30)
+
+  vendorId          String
+  quotationId       String?
+  serviceOrderId    String?
+  expenseId         String?
+
+  status            String    @default("rascunho")
+  issueDate         DateTime  @default(now())
+  expectedDeliveryDate DateTime?
+  deliveredAt       DateTime?
+
+  paymentTerms      String?   @default("")
+  paymentMethod     String?   @default("")
+  costCenter        String?   @default("")
+  requestedBy       String?   @default("")
+  deliveryAddress   String?   @default("")
+
+  subtotal          Float     @default(0)
+  discountAmount    Float     @default(0)
+  freightAmount     Float     @default(0)
+  taxAmount         Float     @default(0)
+  totalAmount       Float     @default(0)
+
+  internalNotes     String?   @default("")
+  supplierTerms     String?   @default("")
+  attachments       Json?
+  metadata          Json?
+
+  createdAt         DateTime  @default(now())
+  updatedAt         DateTime  @updatedAt
+
+  vendor            Vendor    @relation(fields: [vendorId], references: [id], onDelete: Restrict)
+  quotation         Quotation? @relation(fields: [quotationId], references: [id], onDelete: SetNull)
+  serviceOrder      ServiceOrder? @relation(fields: [serviceOrderId], references: [id], onDelete: SetNull)
+  expense           Expense?  @relation(fields: [expenseId], references: [id], onDelete: SetNull)
+  items             PurchaseOrderItem[]
+  events            PurchaseOrderEvent[]
+
+  @@index([vendorId])
+  @@index([quotationId])
+  @@index([serviceOrderId])
+  @@index([expenseId])
+  @@index([status])
+  @@index([issueDate])
+  @@map("purchase_orders")
+}
+```
+
+### 3.3 Novo modelo `PurchaseOrderItem`
+
+```prisma
+model PurchaseOrderItem {
+  id                String    @id @default(cuid())
+  purchaseOrderId   String
+  productId         String?
+
+  description       String    @db.VarChar(500)
+  quantity          Float     @default(1)
+  unit              String    @default("un") @db.VarChar(20)
+  unitPrice         Float     @default(0)
+  discountAmount    Float     @default(0)
+  taxAmount         Float     @default(0)
+  subtotal          Float     @default(0)
+
+  receivedQuantity  Float     @default(0)
+  status            String    @default("pendente")
+  notes             String?   @default("")
+
+  createdAt         DateTime  @default(now())
+  updatedAt         DateTime  @updatedAt
+
+  purchaseOrder     PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
+  product           Product?  @relation(fields: [productId], references: [id], onDelete: SetNull)
+
+  @@index([purchaseOrderId])
+  @@index([productId])
+  @@index([status])
+  @@map("purchase_order_items")
+}
+```
+
+### 3.4 Novo modelo `PurchaseOrderEvent`
+
+```prisma
+model PurchaseOrderEvent {
+  id                String    @id @default(cuid())
+  purchaseOrderId   String
+  type              String    @db.VarChar(50)
+  description       String    @db.VarChar(500)
+  oldValue          Json?
+  newValue          Json?
+  createdBy         String?   @db.VarChar(100)
+  createdAt         DateTime  @default(now())
+
+  purchaseOrder     PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
+
+  @@index([purchaseOrderId])
+  @@index([type])
+  @@index([createdAt])
+  @@map("purchase_order_events")
+}
+```
+
+### 3.5 Relacionamentos necessários em modelos existentes
+
+Adicionar em `Quotation`:
+
+```prisma
+purchaseOrders PurchaseOrder[]
+```
+
+Adicionar em `ServiceOrder`:
+
+```prisma
+purchaseOrders PurchaseOrder[]
+```
+
+Adicionar em `Product`:
+
+```prisma
+purchaseOrderItems PurchaseOrderItem[]
+```
+
+Adicionar em `Expense`:
+
+```prisma
+purchaseOrders PurchaseOrder[]
+```
+
+---
+
+## 4. Status e regras de negócio
+
+### 4.1 Status de ordem de compra
+
+Usar strings inicialmente para seguir o padrão atual do projeto:
+
+- `rascunho`: ordem em edição, sem impacto financeiro.
+- `emitida`: enviada ou confirmada com fornecedor.
+- `aprovada`: autorizada internamente, pronta para gerar despesa.
+- `parcialmente_recebida`: um ou mais itens recebidos parcialmente.
+- `recebida`: todos os itens recebidos.
+- `cancelada`: compra cancelada.
+
+### 4.2 Transições permitidas
+
+| De | Para | Regra |
+|---|---|---|
+| rascunho | emitida | deve ter fornecedor e pelo menos um item |
+| emitida | aprovada | total maior que zero e fornecedor ativo/não bloqueado |
+| aprovada | parcialmente_recebida | ao receber parte dos itens |
+| aprovada | recebida | ao receber todos os itens |
+| parcialmente_recebida | recebida | quando quantidade recebida totalizar todos os itens |
+| qualquer, exceto recebida | cancelada | registrar motivo no histórico |
+
+### 4.3 Cálculo de totais
+
+- `item.subtotal = quantity * unitPrice - discountAmount + taxAmount`.
+- `purchaseOrder.subtotal = soma(item.subtotal)`.
+- `purchaseOrder.totalAmount = subtotal - discountAmount + freightAmount + taxAmount`.
+- Nunca confiar apenas no total enviado pelo frontend; recalcular no backend.
+
+### 4.4 Geração de número
+
+Formato sugerido: `OC-YYYY-000001`.
+
+A API deve buscar a última OC do ano e gerar o próximo sequencial. O agente deve considerar concorrência simples; se houver conflito de unique, tentar novamente uma vez.
+
+### 4.5 Fornecedor bloqueado
+
+- Fornecedor bloqueado não pode receber nova ordem de compra aprovada ou emitida.
+- Fornecedor inativo pode aparecer no histórico, mas não deve aparecer como opção padrão para novas compras.
+
+### 4.6 Financeiro
+
+- `rascunho`: não cria despesa.
+- `emitida`: pode criar despesa `pendente`, caso a regra de negócio deseje previsibilidade de caixa.
+- `aprovada`: deve criar ou vincular uma `Expense` com categoria `MATERIAL`, `SERVICO` ou `OUTROS`.
+- `cancelada`: se houver despesa não paga, cancelar ou marcar como cancelada conforme padrão do financeiro.
+- `recebida`: manter despesa pendente ou paga conforme fluxo financeiro; não marcar pagamento automaticamente sem ação explícita.
+
+---
+
+## 5. APIs necessárias
+
+### 5.1 Ordens de compra
+
+Criar os endpoints:
+
+```text
+GET    /api/purchase-orders
+POST   /api/purchase-orders
+GET    /api/purchase-orders/[id]
+PUT    /api/purchase-orders/[id]
+DELETE /api/purchase-orders/[id]
+POST   /api/purchase-orders/[id]/emit
+POST   /api/purchase-orders/[id]/approve
+POST   /api/purchase-orders/[id]/receive
+POST   /api/purchase-orders/[id]/cancel
+POST   /api/purchase-orders/from-quotation/[quotationId]
+POST   /api/purchase-orders/from-service-order/[serviceOrderId]
+GET    /api/purchase-orders/history
+```
+
+### 5.2 Fornecedores
+
+Atualizar endpoints existentes:
+
+```text
+GET    /api/vendors
+POST   /api/vendors
+GET    /api/vendors/[id]
+PUT    /api/vendors/[id]
+GET    /api/vendors/[id]/purchase-history
+GET    /api/vendors/classification-summary
+```
+
+### 5.3 Parâmetros de filtro
+
+`GET /api/purchase-orders` deve aceitar:
+
+- `page`
+- `limit`
+- `search`
+- `status`
+- `vendorId`
+- `quotationId`
+- `serviceOrderId`
+- `dateFrom`
+- `dateTo`
+- `minTotal`
+- `maxTotal`
+
+---
+
+## 6. Frontend necessário
+
+### 6.1 Menu
+
+Adicionar item “Compras” no menu lateral do dashboard.
+
+### 6.2 Telas
+
+Criar:
+
+```text
+frontend/app/(dashboard)/purchases/page.tsx
+frontend/app/(dashboard)/purchases/new/page.tsx
+frontend/app/(dashboard)/purchases/[id]/page.tsx
+frontend/app/(dashboard)/purchases/[id]/edit/page.tsx
+frontend/app/(dashboard)/vendors/page.tsx
+frontend/app/(dashboard)/vendors/new/page.tsx
+frontend/app/(dashboard)/vendors/[id]/page.tsx
+```
+
+Se já existir alguma tela de fornecedores no ambiente final, apenas expandir.
+
+### 6.3 Componentes
+
+Criar:
+
+```text
+frontend/components/purchases/PurchaseOrderForm.tsx
+frontend/components/purchases/PurchaseOrderItemsTable.tsx
+frontend/components/purchases/PurchaseOrderStatusBadge.tsx
+frontend/components/purchases/PurchaseOrderHistory.tsx
+frontend/components/purchases/PurchaseOrderFinancialPanel.tsx
+frontend/components/vendors/VendorForm.tsx
+frontend/components/vendors/VendorClassificationBadge.tsx
+frontend/components/vendors/VendorPurchaseHistory.tsx
+```
+
+### 6.4 Hooks
+
+Criar:
+
+```text
+frontend/hooks/usePurchaseOrders.ts
+frontend/hooks/useVendors.ts
+```
+
+### 6.5 UX mínima
+
+- Listagem com busca, filtros e status.
+- Formulário com fornecedor, datas, vínculos e itens.
+- Ações visíveis conforme status.
+- Painel de totais calculados.
+- Histórico de eventos no detalhe.
+- Sinalização de fornecedor bloqueado/inativo.
+
+---
+
+## 7. Prompt mestre para o agente de IA
+
+Copie e cole este prompt como primeira mensagem para o agente implementador:
+
+```text
+Você está trabalhando no repositório Click Marido CRM. Responda e documente tudo em português brasileiro.
+
+Objetivo: implementar um módulo de Compras para emissão de Ordens de Compra, integrado com Orçamentos, Serviços/Peças, Ordens de Serviço, Financeiro e Fornecedores.
+
+Antes de alterar qualquer arquivo, leia obrigatoriamente:
+- AGENTS.md
+- README.md
+- RESUMO_PROJETO.md
+- frontend/prisma/schema.prisma
+- frontend/app/api/vendors/route.ts
+- frontend/app/api/vendors/[id]/route.ts
+- frontend/app/api/quotations/route.ts
+- frontend/app/api/quotations/[id]/route.ts
+- frontend/app/api/service-orders/route.ts
+- frontend/app/api/service-orders/[id]/route.ts
+- frontend/app/api/financial/dashboard/route.ts
+- financeiro/PLANEJAMENTO_IMPLANTACAO_MODULO_FINANCEIRO.md
+- serviços_peças/INDEX.md
+- serviços_peças/EXEMPLOS_INTEGRACAO.md
+
+Implemente em fases pequenas e com commits coerentes. Não remova funcionalidades existentes. Preserve compatibilidade com os modelos atuais. Não coloque try/catch em torno de imports.
+
+Regras de negócio principais:
+1. Criar PurchaseOrder, PurchaseOrderItem e PurchaseOrderEvent no Prisma.
+2. Expandir Vendor para classificação, categoria, bloqueio, contato e prazo médio.
+3. Integrar PurchaseOrder com Vendor, Quotation, ServiceOrder, Product e Expense.
+4. Criar API CRUD de ordens de compra e ações de status: emitir, aprovar, receber e cancelar.
+5. Recalcular totais sempre no backend.
+6. Criar histórico de eventos para toda mudança importante.
+7. Ao aprovar ordem de compra, criar ou vincular uma Expense pendente no financeiro.
+8. Fornecedor bloqueado não pode receber OC emitida/aprovada.
+9. Criar telas de listagem, criação, detalhe e edição em /purchases.
+10. Atualizar menu lateral com “Compras”.
+11. Expandir telas/APIs de fornecedores para histórico e classificação.
+
+Após cada fase, rode:
+- npm run prisma:generate, se schema mudar
+- npm run build
+- testes manuais ou validações via API quando possível
+
+Entregue um resumo dos arquivos alterados, regras implementadas e pendências conhecidas.
+```
+
+---
+
+## 8. Prompts por fase
+
+### Fase 1 - Leitura e diagnóstico
+
+```text
+Leia o repositório e produza um diagnóstico técnico antes de implementar o módulo de Compras. Foque em:
+- estrutura Next.js e rotas existentes;
+- modelos Prisma relacionados a Quotation, QuotationItem, Product, ServiceOrder, Vendor, Expense e FinancialTransaction;
+- padrões de autenticação nas APIs;
+- padrões de componentes, hooks e páginas;
+- riscos de migração.
+
+Não altere arquivos nesta fase. Entregue um plano de arquivos que serão criados/alterados.
+```
+
+### Fase 2 - Banco de dados
+
+```text
+Implemente apenas a camada de banco do módulo de Compras.
+
+Tarefas:
+1. Atualizar frontend/prisma/schema.prisma com PurchaseOrder, PurchaseOrderItem, PurchaseOrderEvent.
+2. Expandir Vendor com campos de classificação/categoria/bloqueio/contato/prazo médio.
+3. Adicionar relacionamentos em Quotation, ServiceOrder, Product e Expense.
+4. Criar migration Prisma.
+5. Rodar prisma generate.
+
+Critérios:
+- Não destruir dados existentes.
+- Manter campos opcionais quando houver risco de dados legados.
+- Usar strings para status, seguindo padrão atual.
+- Criar índices para filtros importantes.
+```
+
+### Fase 3 - APIs de fornecedores
+
+```text
+Expanda o módulo de fornecedores.
+
+Tarefas:
+1. Atualizar GET/POST/PUT de /api/vendors para suportar novos campos.
+2. Adicionar filtros por categoria, classificação, ativo e bloqueado.
+3. Criar GET /api/vendors/[id]/purchase-history.
+4. Criar GET /api/vendors/classification-summary.
+5. Incluir contadores de compras e totais quando fizer sentido.
+
+Critérios:
+- Validar nome obrigatório.
+- Impedir duplicidade de CNPJ/CPF.
+- Preservar compatibilidade com consumidores atuais.
+```
+
+### Fase 4 - APIs de ordens de compra
+
+```text
+Crie as APIs do módulo de Ordens de Compra.
+
+Tarefas:
+1. Criar GET/POST /api/purchase-orders.
+2. Criar GET/PUT/DELETE /api/purchase-orders/[id].
+3. Criar ações /emit, /approve, /receive e /cancel.
+4. Criar endpoints from-quotation e from-service-order.
+5. Criar GET /api/purchase-orders/history.
+6. Criar utilitários para gerar número OC-YYYY-000001 e recalcular totais.
+
+Regras:
+- Backend sempre recalcula totais.
+- Não aprovar/emitir OC sem fornecedor ativo e não bloqueado.
+- Não aprovar/emitir OC sem itens.
+- Registrar PurchaseOrderEvent em criação, edição e mudança de status.
+- Ao aprovar, criar Expense pendente vinculada à OC.
+```
+
+### Fase 5 - Hooks e componentes frontend
+
+```text
+Implemente hooks e componentes reutilizáveis para Compras.
+
+Tarefas:
+1. Criar frontend/hooks/usePurchaseOrders.ts.
+2. Criar/expandir frontend/hooks/useVendors.ts.
+3. Criar PurchaseOrderForm, PurchaseOrderItemsTable, PurchaseOrderStatusBadge, PurchaseOrderHistory e PurchaseOrderFinancialPanel.
+4. Criar VendorForm, VendorClassificationBadge e VendorPurchaseHistory.
+
+Critérios:
+- Usar o padrão visual existente do projeto.
+- Evitar duplicação de lógica de cálculo no frontend; o backend é a fonte da verdade.
+- Exibir totais estimados no frontend apenas para UX.
+```
+
+### Fase 6 - Páginas do dashboard
+
+```text
+Crie as páginas do módulo de Compras no dashboard.
+
+Tarefas:
+1. Criar /purchases com listagem, filtros e ações.
+2. Criar /purchases/new para nova OC.
+3. Criar /purchases/[id] com detalhe, histórico, itens e painel financeiro.
+4. Criar /purchases/[id]/edit para edição quando status permitir.
+5. Criar ou expandir páginas de fornecedores.
+6. Adicionar item “Compras” no Sidebar/layout do dashboard.
+
+Critérios:
+- Ações devem respeitar status.
+- Mostrar fornecedor bloqueado com destaque.
+- Mostrar vínculos com orçamento, OS e despesa financeira.
+```
+
+### Fase 7 - Integrações com orçamento e OS
+
+```text
+Implemente integrações de Compras com Orçamentos e Ordens de Serviço.
+
+Tarefas:
+1. No detalhe do orçamento, mostrar compras vinculadas.
+2. Permitir criar OC a partir de orçamento usando itens do orçamento.
+3. No detalhe da OS, mostrar compras vinculadas.
+4. Permitir criar OC a partir de OS.
+5. Bloquear ou alertar execução quando uma compra obrigatória ainda não foi recebida, se houver regra aplicável.
+
+Critérios:
+- Não quebrar criação/edição atual de orçamentos.
+- Não quebrar fluxo atual de OS.
+```
+
+### Fase 8 - Integração financeira
+
+```text
+Finalize a integração financeira do módulo de Compras.
+
+Tarefas:
+1. Ao aprovar OC, criar Expense pendente com vendorId, amount e descrição.
+2. Vincular expenseId na PurchaseOrder.
+3. Se OC for cancelada, atualizar Expense quando ainda não paga.
+4. Exibir vínculo financeiro no detalhe da OC.
+5. Atualizar dashboard financeiro para considerar despesas geradas por compras, se necessário.
+
+Critérios:
+- Não marcar despesa como paga automaticamente.
+- Não duplicar Expense se a OC já tiver expenseId.
+- Registrar eventos e transações seguindo o padrão financeiro existente.
+```
+
+### Fase 9 - Testes e validação
+
+```text
+Crie e execute um checklist de validação do módulo de Compras.
+
+Cenários mínimos:
+1. Criar fornecedor completo.
+2. Bloquear fornecedor e tentar emitir OC.
+3. Criar OC manual com itens.
+4. Criar OC a partir de orçamento.
+5. Criar OC a partir de OS.
+6. Emitir OC.
+7. Aprovar OC e verificar Expense gerada.
+8. Receber parcialmente.
+9. Receber totalmente.
+10. Cancelar OC antes do recebimento.
+11. Conferir histórico de eventos.
+12. Conferir filtros de listagem.
+13. Conferir build do projeto.
+
+Corrija falhas encontradas e documente pendências.
+```
+
+---
+
+## 9. Checklist de aceite
+
+- [ ] Fornecedores possuem categoria, classificação, bloqueio e histórico.
+- [ ] Ordens de compra possuem número único e status controlado.
+- [ ] Itens da ordem de compra aceitam vínculo com `Product` e descrição livre.
+- [ ] Totais são recalculados no backend.
+- [ ] Histórico de eventos é registrado.
+- [ ] OC pode ser vinculada a orçamento.
+- [ ] OC pode ser vinculada a ordem de serviço.
+- [ ] OC aprovada gera `Expense` pendente.
+- [ ] Fornecedor bloqueado não pode receber OC emitida/aprovada.
+- [ ] Listagem possui filtros úteis.
+- [ ] Dashboard possui navegação para Compras.
+- [ ] Build passa sem erros.
+
+---
+
+## 10. Observações para implementação segura
+
+- Implementar em PRs pequenos se possível: banco, APIs, frontend, integrações.
+- Não migrar todos os fornecedores antigos de uma vez para campos obrigatórios novos; usar defaults e campos opcionais.
+- Evitar enums Prisma inicialmente para manter compatibilidade com o padrão atual de strings.
+- Centralizar regras de cálculo em funções utilitárias no backend.
+- Registrar eventos em todas as mudanças críticas para auditoria.
+- Não automatizar pagamento financeiro; compras geram obrigação/despesa, pagamento continua sendo uma ação financeira separada.
