# 🔧 Mapeamento de Módulos - Click Marido CRM/ERP

**Data:** 23/06/2026  
**Status de Implementação:** 66% (conforme audit anterior)  
**Negócio:** Reparos residenciais e serviços de "marido de aluguel"  
**Localização:** Blumenau e região, Santa Catarina

---

## 📊 Resumo Executivo

### Números do Sistema
- **Modelos de Banco:** 15 entidades Prisma
- **Módulos de Dashboard:** 16 áreas implementadas no frontend
- **Componentes UI:** 29 componentes React
- **Status Backend:** 20 módulos comentados (não integrados)

### Diagnóstico Crítico
O sistema tem **estrutura sólida mas funcionalidades operacionais faltando**. O backend não está conectado a 90% do frontend. É possível colocar em produção, mas com workflows manuais.

---

## 📋 Seção 1: Módulos Implementados (Status Atual)

### 1. Ordens de Serviço (Parcial ✋)
**O que existe:**
- CRUD de ServiceOrder
- Campos: title, description, status (OPEN/IN_PROGRESS/COMPLETED/CANCELLED), priority, value, dates
- Ligação com client, technician, company, quotes, payments, warranties

**O que falta:**
- Templates de OS (economizar tempo preenchendo repetido)
- Histórico de mudanças (audit trail)
- Fotos antes/depois (proof-of-work)
- Checkpoints (inspeção inicial, material conferido, final check)

---

### 2. Clientes (Parcial ✋)
**O que existe:**
- CRUD de Client
- Campos: name, email, phone, address, companyId

**O que falta:**
- Histórico de serviços por cliente
- Preferências de comunicação (email, SMS, WhatsApp)
- Feedback/avaliações
- Histórico de pagamentos
- Tags/categorias de cliente (VIP, frequente, problemático)

---

### 3. Técnicos (Parcial ✋)
**O que existe:**
- CRUD de Technician
- Campos: name, email, phone, specialty, companyId

**O que falta:**
- Agenda disponível/ocupada
- Localização em tempo real
- Avaliação por cliente
- Certificações/qualificações
- Horários de trabalho

---

### 4. Orçamentos (Parcial ✋)
**O que existe:**
- Modelo Quote com ServiceOrder
- Serviços adicionados via QuoteService
- Status: PENDING (rudimentar)

**O que falta:**
- Múltiplas versões de orçamento
- Autoaprovação por cliente (link + QR Code)
- Templates customizáveis
- Histórico de rejeições/aceitações
- Markup/desconto automático
- Validade (alert se expirou)

---

### 5. Financeiro / Pagamentos (Parcial ✋)
**O que existe:**
- Modelo Payment
- Status: PENDING, PAID, OVERDUE, CANCELLED
- Métodos: CASH, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, PIX, OTHER

**O que falta:**
- Integração bancária real (receber notificação de PIX automaticamente)
- Geração de QR Code PIX dinâmico
- Recibos/NFs (notas fiscais) em PDF
- Parcelamento
- Lembretes automáticos de cobrança
- Extrato consolidado (diário, semanal, mensal)
- Conciliação com extrato real

---

### 6. Serviços (Parcial ✋)
**O que existe:**
- Modelo Service
- Campos: name, description, price, quantity

**O que falta:**
- Categorização (hidráulica, elétrica, carpintaria, etc.)
- Imagens/ícones
- Histórico de preços
- Tempo estimado de execução
- Variações (tamanho, complexidade, etc.)

---

### 7. Materiais (Vazio ❌)
**Frontend:** Rota `/dashboard/materiais` existe
**Backend:** Sem modelo, sem API
**Falta tudo:** CRUD, estoque, fornecedores, custo, reabastecimento

---

### 8. Agenda (Vazio ❌)
**Frontend:** Rota `/dashboard/agenda` existe
**Backend:** Sem modelo Appointment
**Falta:** Calendar widget, agendamento de visitas, alertas, conflito detection

---

### 9. Conversas (Vazio ❌)
**Frontend:** Rota `/dashboard/conversas` existe
**Backend:** Sem modelo de mensagens
**Falta:** Chat, integração WhatsApp, real-time messaging

---

### 10. Garantias (Parcial ✋)
**O que existe:**
- Modelo Warranty
- Status: ACTIVE, EXPIRED, CLAIMED, CANCELLED
- Period: startDate → endDate

**O que falta:**
- Reclamações (modelo ClaimWarranty)
- Histórico de acionamentos
- Notificação automática antes de expirar
- Documentação (fotos, comprovante)

---

### 11. Pós-Venda (Vazio ❌)
**Frontend:** Rota `/dashboard/pos-venda` existe
**Backend:** Sem modelo
**Falta:** Follow-up automático, pesquisas NPS, satisfação

---

### 12. Relatórios (Parcial ✋)
**O que existe:**
- Modelo Report
- Tipos: SERVICE_ORDERS, PAYMENTS, WARRANTIES, FINANCIAL, PERFORMANCE

**O que falta:**
- Dashboards visuais (gráficos)
- Filtros avançados (período, técnico, cliente)
- Exportação (PDF, Excel, CSV)
- Agendamento automático (enviar email de relatório)
- Comparativos (mês anterior, YoY)

---

### 13. Configurações (Parcial ✋)
**O que existe:**
- Modelo Company
- Campos: name, slug, cnpj, phone, email, address

**O que falta:**
- Customização de templates (cores, logo)
- Integração com providers (Asaas, Stripe, etc.)
- Webhooks
- Backup automático
- Limites de uso (quantidade de usuários, OS/mês)

---

### 14. Usuários (✅ Implementado)
- CRUD completo
- Autenticação JWT
- Roles (USER, ADMIN, MANAGER)
- Reset de senha

---

### 15. Empresas (✅ Implementado)
- Multi-tenancy
- CompanyContextGuard (isolamento de dados)

---

## ⚠️ Seção 2: Gaps Críticos do Sistema

### 1. Backend Desconectado do Frontend
```
Situação: ~20 módulos estão comentados em backend/src/app.module.ts
Risco: Frontend chama rotas que não existem → erro 404
Impacto: Sistema inteiro fica não-operacional em produção
```

**Ações:**
1. Uncomment os módulos em `app.module.ts`
2. Implementar os serviços NestJS (já existe esqueleto)
3. Testar end-to-end com Postman/Insomnia

---

### 2. Sem Agendamento de Visitas
**Por quê crítico:** Reparos residenciais vivem de cronograma. Sem agenda:
- Técnico não sabe onde ir
- Cliente não sabe quando técnico chega
- Não há otimização de rota
- Não há confirmação de presença

**Impacto:** Operação é 100% manual e ineficiente.

---

### 3. Sem Fotos/Evidências
**Por quê crítico:** Sem prova visual de trabalho:
- Clientes contestam pagamento ("não fizeram nada")
- Garantias ficam em disputa
- Técnico não pode justificar tempo

**Impacto:** Litígios aumentam. Receita em risco.

---

### 4. Sem Integração WhatsApp/SMS
**Por quê crítico:** No Brasil, WhatsApp é padrão de comunicação.
- Cliente não recebe notificação de agendamento
- Não há confirmação de presença
- Não há atualizações (técnico está chegando)

**Impacto:** Muitas visitas são no-show (cliente esqueceu ou achou que foi cancelado).

---

### 5. Dashboard Vazio
**Por quê crítico:** Sem visão de métricas:
- Não sabe receita do mês
- Não vê técnico mais produtivo
- Não conhece padrão de demanda

**Impacto:** Decisões cegas. Impossível otimizar.

---

### 6. Banco de Dados Antigo (Supabase)
**Problema:** Ainda apontando para Supabase antigo. Neon não configurado.
**Risco:** Credenciais expostas no git (`Millena@@2017@@`)
**Ação urgente:** Configurar Neon, rotar credenciais, limpar histórico git

---

### 7. Sem Alertas/Notificações
**Falta:** Sistema de notificações (in-app + email + SMS)
**Impacto:** Usuários não recebem informação importante (OS aberta, pagamento pendente, garantia expirando)

---

### 8. Sem Assinatura Digital
**Falta:** Cliente assinar ordem de serviço no tablet/mobile
**Impacto:** Sem prova de aceite do trabalho. Risco legal.

---

### 9. Sem Integração PIX/Bancária
**Falta:** Confirmação automática de PIX, integração com extrato
**Impacto:** Conciliação é manual. Impossível automatizar fluxo de caixa.

---

### 10. Auditoria Desativada
**Problema:** Interceptors de logging comentados em `app.module.ts`
**Impacto:** Impossível rastrear quem alterou quê e quando. Risco de compliance.

---

## 🚀 Seção 3: Sugestões de Novos Módulos (Priorizados)

### FASE 1: Fundações (Semanas 1-2) 🔴 CRÍTICO

#### 1. Agendamento de Visitas (Appointments)
**Prioridade:** 🔴 CRÍTICO

**Por quê:**
Sem agenda, operação é caótica. Técnico não sabe aonde ir. Cliente não sabe quando técnico chega.

**O que implementar:**

1. **Modelo Prisma:**
```prisma
model Appointment {
  id            String   @id @default(cuid())
  date          DateTime
  time          DateTime
  duration      Int      // minutos
  status        AppointmentStatus @default(SCHEDULED) // SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
  notes         String?
  location      String
  
  // Relations
  serviceOrderId String
  serviceOrder   ServiceOrder @relation(fields: [serviceOrderId], references: [id])
  
  technicianId   String
  technician     Technician @relation(fields: [technicianId], references: [id])
  
  companyId      String
  company        Company @relation(fields: [companyId], references: [id])
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@map("appointments")
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

2. **Frontend Components:**
   - CalendarView (semanal/mensal)
   - AppointmentCard (drag-drop para reasignar)
   - AppointmentForm (criar/editar)
   - TechnicianRoute (mapa com sequência do dia)

3. **Backend Services:**
   - appointmentsService (CRUD + business logic)
   - conflictDetection (evitar sobreposição)
   - notificationService (SMS 1h antes)

4. **Validações:**
   - Não agendar técnico em duas visitas simultâneas
   - Agendamento só em horário comercial
   - Confirmar disponibilidade com cliente antes

**Esforço:** 20-30 horas  
**Banco:** 1 modelo + 2 migrations  
**ROI:** Excelente (impossível operar sem isto)

---

#### 2. Gerenciamento de Fotos/Evidências
**Prioridade:** 🔴 CRÍTICO

**Por quê:**
Foto é prova de trabalho. Essencial para garantias, disputes e satisfação do cliente.

**O que implementar:**

1. **Modelo Prisma:**
```prisma
model Media {
  id               String   @id @default(cuid())
  serviceOrderId   String
  serviceOrder     ServiceOrder @relation(fields: [serviceOrderId], references: [id])
  
  fileUrl          String   // URL do S3/GCP
  fileName         String
  fileSize         Int      // bytes
  mimeType         String   // image/jpeg, etc
  
  type             MediaType @default(PROGRESS) // BEFORE, AFTER, PROGRESS
  caption          String?
  
  uploadedAt       DateTime @default(now())
  uploadedByUserId String
  uploadedBy       User @relation(fields: [uploadedByUserId], references: [id])
  
  companyId        String
  company          Company @relation(fields: [companyId], references: [id])
  
  @@map("media")
}

enum MediaType {
  BEFORE
  AFTER
  PROGRESS
}
```

2. **Frontend Components:**
   - ImageUpload (drag-drop, mobile camera)
   - ImageGallery (timeline com thumbnails)
   - ImageModal (fullscreen viewer)

3. **Backend Services:**
   - uploadService (validar, comprimir, armazenar)
   - storageProvider (abstração para S3/GCP/Local)
   - mediaService (CRUD + listagem)

4. **Storage:**
   - **Zero-cost option:** Google Drive API (já usa Google)
   - **Escalável:** AWS S3 (1GB free year 1, depois ~$0.02/GB)
   - **Local testing:** `/mnt/uploads/` no desenvolvimento

**Esforço:** 18-25 horas  
**Banco:** 1 modelo  
**ROI:** Muito alto (elimina disputes, prova garantia)

---

#### 3. Sistema de Alertas e Notificações
**Prioridade:** 🔴 CRÍTICO

**Por quê:**
Sem notificações, usuários não sabem que algo mudou. Tarefas caem no limbo.

**O que implementar:**

1. **Modelo Prisma:**
```prisma
model Notification {
  id            String   @id @default(cuid())
  userId        String
  user          User @relation(fields: [userId], references: [id])
  
  type          NotificationType // OS_CREATED, PAYMENT_RECEIVED, WARRANTY_EXPIRING
  title         String
  message       String
  relatedEntityId String? // ID da OS, Payment, etc
  
  isRead        Boolean @default(false)
  readAt        DateTime?
  
  createdAt     DateTime @default(now())
  
  @@map("notifications")
}

enum NotificationType {
  OS_CREATED
  OS_UPDATED
  OS_COMPLETED
  APPOINTMENT_SCHEDULED
  APPOINTMENT_REMINDER
  PAYMENT_RECEIVED
  PAYMENT_OVERDUE
  WARRANTY_EXPIRING
  WARRANTY_CLAIMED
  NEW_REVIEW
}
```

2. **Frontend Components:**
   - NotificationBell (ícone com badge)
   - NotificationDropdown (últimas 10)
   - NotificationCenter (página com histórico)
   - MarkAsRead (individual e bulk)

3. **Backend Services:**
   - notificationService (criar, marcar como lida)
   - eventEmitter (disparar em eventos)
   - emailProvider (enviar email também)

4. **Triggers (usar @nestjs/event-emitter):**
   - OS criada → notificar técnico e cliente
   - Appointment agendado → notificar ambos
   - Pagamento recebido → notificar gerente
   - Garantia expirando em 7 dias → notificar cliente

**Esforço:** 18-24 horas  
**Banco:** 2 modelos (Notification + EventLog)  
**ROI:** Muito alto (aumenta engagement)

---

### FASE 2: Visibilidade (Semanas 3-4) 🟠 ALTO IMPACTO

#### 4. Dashboard com KPIs Visuais
**Prioridade:** 🟠 ALTO

**Por quê:**
Sem visão de métricas, você não sabe se negócio está crescendo ou encolhendo.

**O que implementar:**

1. **Cards de KPI:**
   - Receita do mês (valor + variação vs mês anterior)
   - Ordens abertas (count + lista rápida)
   - Técnicos disponíveis hoje (count + status)
   - Satisfação média (rating 1-5)

2. **Gráficos:**
   - Receita por semana (linha chart - últimas 8 semanas)
   - Tipos de serviço mais vendidos (pie chart)
   - Performance por técnico (bar chart - receita/Semana)
   - Ordens por status (donut chart)

3. **Filtros:**
   - Data início/fim
   - Por técnico
   - Por tipo de serviço

4. **Biblioteca:**
   - Recharts (já está em package.json)
   - Chart.js como alternativa

5. **Dados em tempo real:**
   - Usar SWR com revalidateOnFocus
   - Refresh a cada 30s

**Exemplo de endpoint:**
```typescript
GET /api/dashboard/kpis?startDate=2026-01-01&endDate=2026-06-23
Response: {
  revenue: { current: 5000, previous: 4200, variance: 19.05 },
  openOrders: 8,
  availableTechnicians: 3,
  averageRating: 4.7,
  recentOrders: [...]
}
```

**Esforço:** 15-20 horas  
**Banco:** Nenhum modelo novo (apenas queries otimizadas)  
**ROI:** Excelente (decisões baseadas em dados)

---

#### 5. Integração WhatsApp / SMS para Notificações
**Prioridade:** 🟠 ALTO

**Por quê:**
No Brasil, 95%+ das pessoas usam WhatsApp. SMS é confiável para não-readers.

**O que implementar:**

1. **Provider abstrato:**
```typescript
interface NotificationProvider {
  send(to: string, message: string): Promise<void>
}

// Implementações:
class TwilioProvider implements NotificationProvider { }
class AWSPinpointProvider implements NotificationProvider { }
class GoogleCloudProvider implements NotificationProvider { }
```

2. **Triggers automáticos:**
   - OS criada → enviar SMS/WhatsApp ao cliente e técnico
   - Appointment 1h antes → lembrete ao técnico
   - Pagamento recebido → confirmação ao cliente
   - Garantia expirando → aviso ao cliente

3. **Templates customizáveis:**
```
OS_CREATED: "Olá {{clientName}}, sua ordem de serviço #{{osId}} foi criada. Técnico: {{technicianName}}. Agende: {{link}}"
APPOINTMENT_REMINDER: "Oi {{technicianName}}, você tem uma visita em 1h em {{address}}. Cliente: {{clientName}}"
```

4. **Log de mensagens:**
```prisma
model MessageLog {
  id          String
  to          String  // phone number
  type        String  // SMS, WHATSAPP
  content     String
  status      String  // SENT, FAILED, DELIVERED
  provider    String
  errorMsg    String?
  sentAt      DateTime
}
```

5. **Provedores zero-cost:**
   - **Twilio:** 100 SMS grátis/mês (depois 0.01/SMS)
   - **AWS SNS:** Free tier 100 SMS/mês
   - **Google Cloud:** SMS via API (pago, mas barato)

**Esforço:** 25-35 horas  
**Banco:** 2 novos modelos (NotificationTemplate, MessageLog)  
**ROI:** Alto (reduz no-show de clientes)

---

#### 6. Assinatura Digital e Aceite no Local
**Prioridade:** 🟠 ALTO

**Por quê:**
Assinatura do cliente no tablet/mobile é prova legal de aceite do trabalho. Elimina disputes.

**O que implementar:**

1. **Modelo:**
```prisma
model SignatureRequest {
  id                String @id @default(cuid())
  serviceOrderId    String
  serviceOrder      ServiceOrder @relation(fields: [serviceOrderId], references: [id])
  
  signatureDataUri  String  // Canvas drawing como data URI
  signerName        String
  signedAt          DateTime
  ipAddress         String  // geolocation proof
  userAgent         String
  
  createdAt         DateTime @default(now())
  
  @@map("signature_requests")
}
```

2. **Frontend Component:**
```tsx
// Canvas signature drawing
<SignaturePad
  onSign={(dataUri) => {
    // Upload dataUri
    // Mark ServiceOrder as completed
  }}
/>
```

3. **Workflow:**
   - Técnico clica "Finalizar Trabalho"
   - Sistema exibe tela de assinatura
   - Cliente assina no tablet/mobile
   - Gerar PDF com assinatura embedded
   - Enviar recibo por email

4. **PDF com assinatura:**
   - Usar pdfkit (npm package)
   - Embed imagem de assinatura no PDF
   - Incluir timestamp e IP address

**Esforço:** 16-20 horas  
**Banco:** 1 novo modelo  
**ROI:** Muito alto (elimina disputes legais)

---

### FASE 3: Precisão Financeira (Semanas 5-6) 🟡 CRÍTICO

#### 7. Controle de Inventário (Materiais)
**Prioridade:** 🟡 CRÍTICO

**Por quê:**
Rastreamento de gastos de materiais permite precificação correta. Sem isto, você não sabe a margem real.

**O que implementar:**

1. **Modelos:**
```prisma
model Material {
  id           String   @id @default(cuid())
  name         String   // "Tubo PVC 50mm", "Parafuso M8", etc
  category     String   // "Hidráulica", "Elétrica", "Hardware"
  costPrice    Float    // Preço que você pagou
  sellPrice    Float?   // Preço que você cobra (opcional)
  quantity     Int      // Estoque atual
  minStock     Int      // Reorder point
  unit         String   // "metro", "unidade", "kg"
  
  companyId    String
  company      Company @relation(fields: [companyId], references: [id])
  
  usages       MaterialUsage[]
  orders       PurchaseOrder[]
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@map("materials")
}

model MaterialUsage {
  id              String @id @default(cuid())
  serviceOrderId  String
  serviceOrder    ServiceOrder @relation(fields: [serviceOrderId], references: [id])
  
  materialId      String
  material        Material @relation(fields: [materialId], references: [id])
  
  quantityUsed    Int
  
  createdAt       DateTime @default(now())
  
  @@map("material_usages")
}
```

2. **Frontend Components:**
   - MaterialInventory (tabela com estoque)
   - MaterialForm (CRUD)
   - LowStockAlert (card mostrando itens em falta)
   - MaterialUsageForm (ao finalizar OS, registrar consumo)

3. **Backend Services:**
   - materialService (CRUD)
   - inventoryService (controle de estoque)
   - lowStockAlert (notificar quando < minStock)

4. **Features:**
   - Importação CSV (carga inicial)
   - Histórico de preço (rastrear inflação)
   - Integração com OS (adicionar materiais ao criar orçamento)
   - Relatório (custo de material por OS, margem real)

5. **Alertas:**
   - Se estoque < minStock, notificar gerente
   - Se não há material para OS, avisar antes de agendar

**Esforço:** 20-25 horas  
**Banco:** 2-3 novos modelos  
**ROI:** Alto (margem real fica clara)

---

#### 8. Integração PIX / Conciliação Bancária
**Prioridade:** 🟡 CRÍTICO

**Por quê:**
PIX é padrão no Brasil. Confirmação automática reduz trabalho manual e acelera fluxo de caixa.

**O que implementar:**

1. **Gerar QR Code PIX:**
   - Usar Asaas API (free até 500 transações/mês) ou Stripe
   - Para cada pagamento, gerar QR dinâmico (brcode)
   - Armazenar QR code como imagem/URL

2. **Modelo:**
```prisma
model PaymentQRCode {
  id           String @id @default(cuid())
  paymentId    String
  payment      Payment @relation(fields: [paymentId], references: [id])
  
  brcode       String  // QR code data
  imageUrl     String  // URL da imagem QR
  externalId   String  // ID do provider (Asaas, Stripe)
  
  expiresAt    DateTime
  confirmedAt  DateTime?
  
  createdAt    DateTime @default(now())
  
  @@map("payment_qr_codes")
}
```

3. **Webhook de confirmação:**
   - Provider envia POST quando PIX é pago
   - Backend atualiza Payment.status = PAID
   - Notificar usuário

4. **Frontend:**
   - Tela de pagamento mostra QR code grande
   - Copy-paste do PIX manualmente (fallback)
   - Status real-time (polling ou WebSocket)

5. **Relatório:**
   - Extrato diário de PIX recebidos
   - Comparativo: PIX esperado vs recebido
   - Alertas de pagamentos atrasados

**Esforço:** 25-35 horas  
**Banco:** 1-2 novos modelos  
**ROI:** Alto (fluxo de caixa automático)

---

### FASE 4: Qualidade e Escala (Semanas 7-9) 🟢 MÉDIO

#### 9. Avaliação e Satisfação de Cliente
**Prioridade:** 🟢 MÉDIO

**O que implementar:**

1. **Modelos:**
```prisma
model Review {
  id             String @id @default(cuid())
  serviceOrderId String
  serviceOrder   ServiceOrder @relation(fields: [serviceOrderId], references: [id])
  
  clientId       String
  client         Client @relation(fields: [clientId], references: [id])
  
  technicianId   String
  technician     Technician @relation(fields: [technicianId], references: [id])
  
  rating         Int     // 1-5
  comment        String?
  
  createdAt      DateTime @default(now())
  
  @@map("reviews")
}

model NPS {
  id       String @id @default(cuid())
  clientId String
  client   Client @relation(fields: [clientId], references: [id])
  
  score    Int    // 0-10
  feedback String?
  
  createdAt DateTime @default(now())
  
  @@map("nps_surveys")
}
```

2. **Trigger:**
   - 1 dia após OS completada, enviar email com link de avaliação
   - Link leva a formulário simples (rating + comment)

3. **Dashboard:**
   - Rating médio por técnico
   - Comentários recentes (highlights + warnings)
   - NPS trend (gráfico)
   - Alertas se rating < 3 (marcar para follow-up gerente)

4. **Ações:**
   - Baixas avaliações → notificar técnico (melhorar)
   - Altas avaliações → usar em marketing

**Esforço:** 14-18 horas  
**Banco:** 2 novos modelos  
**ROI:** Médio-Alto (identifica problemas sistemáticos)

---

#### 10. Relatórios Exportáveis (PDF, Excel, CSV)
**Prioridade:** 🟢 MÉDIO

**O que implementar:**

1. **Relatórios:**
   - Fluxo de caixa (semanal, mensal)
   - Receita por técnico
   - Serviços mais vendidos
   - Histórico de garantias
   - Clientes com maior ticket
   - Índice de satisfação

2. **Formatos:**
   - PDF (usar pdfkit)
   - Excel (usar xlsx)
   - CSV (simples)

3. **Filtros:**
   - Data início/fim
   - Por técnico
   - Por tipo de serviço
   - Por cliente

4. **Agendamento:**
   - Configurar envio automático por email (segunda-feira 8h, por exemplo)
   - CronJob no backend

5. **UI:**
   - Preview antes de download
   - Botão "Exportar" em cada relatório

**Esforço:** 16-22 horas  
**Banco:** 0 novos modelos  
**ROI:** Alto (dados para contador, gestor)

---

#### 11. Templates de OS e Documentos Customizáveis
**Prioridade:** 🟢 MÉDIO

**O que implementar:**

1. **Modelos:**
```prisma
model DocumentTemplate {
  id      String @id @default(cuid())
  name    String // "OS Padrão", "Orçamento Premium"
  type    DocumentType // OS, QUOTE, INVOICE, RECEIPT
  content String // HTML template com {{variáveis}}
  
  companyId String
  company Company @relation(fields: [companyId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("document_templates")
}

enum DocumentType {
  SERVICE_ORDER
  QUOTE
  INVOICE
  RECEIPT
}
```

2. **Editor:**
   - WYSIWYG (drag-drop de campos)
   - Preview em tempo real com dados dummy
   - Variáveis disponíveis: {{clientName}}, {{technicianName}}, {{serviceDescription}}, etc

3. **Uso:**
   - Ao criar OS, selecionar template
   - Preencher variáveis
   - Gerar PDF/Word

4. **Defaults:**
   - Incluir 3-4 templates padrão (português/Brasil)

**Esforço:** 18-25 horas  
**Banco:** 2 novos modelos  
**ROI:** Médio (economia de tempo)

---

### FASE 5: Otimização (Semana 10-11) 🟡 OPCIONAL

#### 12. Gestão de Fornecedores e Compras
**Prioridade:** 🟡 OPCIONAL

**O que implementar:**

1. **Modelos:**
```prisma
model Supplier {
  id      String @id @default(cuid())
  name    String
  phone   String?
  email   String?
  address String?
  rating  Float? // 1-5
  
  companyId String
  company Company @relation(fields: [companyId], references: [id])
  
  orders  PurchaseOrder[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("suppliers")
}

model PurchaseOrder {
  id           String @id @default(cuid())
  supplierId   String
  supplier     Supplier @relation(fields: [supplierId], references: [id])
  
  items        String // JSON com materiais
  totalValue   Float
  status       PurchaseOrderStatus
  deliveryDate DateTime?
  
  companyId    String
  company      Company @relation(fields: [companyId], references: [id])
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@map("purchase_orders")
}

enum PurchaseOrderStatus {
  PENDING
  ORDERED
  RECEIVED
  CANCELLED
}
```

2. **CRUD:**
   - Gerenciar fornecedores
   - Criar pedidos
   - Rastrear entrega

3. **Integração:**
   - Ao estoque ficar baixo, sugerir criar pedido automático
   - Histórico de preços por fornecedor

4. **Relatório:**
   - Custo por fornecedor
   - Comparativo de preços (mesmo material, fornecedores diferentes)

**Esforço:** 20-28 horas  
**Banco:** 2-3 novos modelos  
**ROI:** Médio (reduz custos)

---

### FASE 6: Canais Digitais (Semanas 12+) 🔵 AMBIÇÃO

#### 13. App Mobile Nativo (React Native / Expo)
**Prioridade:** 🔵 AMBIÇÃO (não é crítico)

**Por quê útil:**
Técnico acessa agenda e registra trabalho offline (no local, sem sinal).

**O que implementar:**

1. **Stack:**
   - React Native + Expo (multiplataforma Android/iOS)
   - WatermelonDB ou Realm para sincronização offline
   - Axios para API calls

2. **Features:**
   - Login biométrico (face/fingerprint)
   - Agenda do dia
   - Iniciar/finalizar OS
   - Capturar fotos (câmera)
   - Assinar (signature pad)
   - Offline-first (sincronizar quando online)
   - Geolocalização (mapear técnico em tempo real)

3. **Deploy:**
   - EAS Build (Expo) para gerar APK/IPA
   - Distribuir via Play Store + App Store

**Esforço:** 40-60 horas  
**Banco:** 0 novos modelos  
**ROI:** Médio (técnico mais eficiente)

---

#### 14. IA para Estimativa de Preço e Categorização
**Prioridade:** ⚪ AMBIÇÃO (avançado)

**Por quê útil:**
Automação de reparos similares. Sugestão de preço baseado em histórico.

**O que implementar:**

1. **API:**
   - Google Gemini Flash (free tier até 15 requisições/minuto)
   - OpenAI GPT-4 (pago, mas poderoso)

2. **Workflow:**
   - Usuário escreve descrição de problema
   - IA analisa → sugere categoria, serviços, preço
   - Usuário confirma ou ajusta

3. **Exemplo:**
   ```
   Input: "Torneira da cozinha vazando há 3 dias, água suja saindo"
   
   Output:
   {
     "category": "Hidráulica",
     "services": ["Conserto de torneira", "Limpeza de sistema"],
     "suggestedPrice": 180.00,
     "confidence": 0.92,
     "reasoning": "Vazamento de torneira com necessidade de limpeza"
   }
   ```

4. **ML Model:**
   - Treinar com histórico (descrição → categoria → preço real)
   - Ajustar modelo mensalmente com novos dados
   - Rastrear acurácia da sugestão

5. **Chatbot (bonus):**
   - Responder perguntas: "Quanto custa trocar torneira?"
   - Estimativa rápida sem preencher formulário

**Esforço:** 30-50 horas  
**Banco:** 1 novo modelo (AIInteractionLog)  
**ROI:** Baixo-Médio (nice-to-have, não crítico)

---

## 📅 Seção 4: Roadmap de Implementação Recomendado

### Timeline: 12 semanas (~3 meses)

```
SEMANA 1-2  ━━━━ FUNDAÇÕES (Crítico)
├─ Agendamento de Visitas
├─ Fotos/Evidências  
└─ Alertas/Notificações

SEMANA 3-4  ━━━━ VISIBILIDADE (Alto)
├─ Dashboard KPIs
├─ WhatsApp/SMS
└─ Assinatura Digital

SEMANA 5-6  ━━━━ FINANCEIRO (Crítico)
├─ Inventário/Materiais
└─ PIX/Bancário

SEMANA 7-9  ━━━━ QUALIDADE (Médio)
├─ Avaliação Cliente
├─ Relatórios
└─ Templates Doc

SEMANA 10-11 ━━━━ OTIMIZAÇÃO (Opcional)
└─ Fornecedores/Compras

SEMANA 12+  ━━━━ AMBIÇÃO (Avançado)
├─ App Mobile
└─ IA Estimativa
```

---

## 🎯 Seção 5: Matriz de Priorização

| Módulo | Impacto | Esforço | ROI | Prioridade |
|--------|---------|---------|-----|-----------|
| Agendamento | ⭐⭐⭐⭐⭐ | 20-30h | **Muito Alto** | 🔴 1º |
| Fotos | ⭐⭐⭐⭐⭐ | 18-25h | **Muito Alto** | 🔴 1º |
| Dashboard | ⭐⭐⭐⭐⭐ | 15-20h | **Excelente** | 🔴 2º |
| Alertas | ⭐⭐⭐⭐ | 18-24h | **Muito Alto** | 🔴 2º |
| WhatsApp | ⭐⭐⭐⭐ | 25-35h | **Alto** | 🟠 3º |
| Assinatura | ⭐⭐⭐⭐ | 16-20h | **Muito Alto** | 🟠 3º |
| Inventário | ⭐⭐⭐⭐ | 20-25h | **Alto** | 🟠 3º |
| PIX | ⭐⭐⭐⭐ | 25-35h | **Alto** | 🟠 3º |
| Avaliação | ⭐⭐⭐ | 14-18h | **Muito Alto** | 🟡 4º |
| Relatórios | ⭐⭐⭐ | 16-22h | **Alto** | 🟡 4º |
| Templates | ⭐⭐⭐ | 18-25h | **Médio** | 🟡 4º |
| Fornecedores | ⭐⭐⭐ | 20-28h | **Médio** | 🟡 5º |
| App Mobile | ⭐⭐⭐⭐ | 40-60h | **Médio** | 🔵 6º |
| IA | ⭐⭐⭐ | 30-50h | **Baixo** | ⚪ 7º |

---

## 🚨 Seção 6: Urgências Críticas (Próximas 2 Semanas)

### Checklist Obrigatório:

- [ ] **Configurar banco Neon** (criar conta, copiar DATABASE_URL + DIRECT_URL para .env)
- [ ] **Implementar modelo Appointment** + calendário visual
- [ ] **Implementar modelo Media** + upload de fotos
- [ ] **Ativar AuditLog** (uncomment interceptors no app.module.ts)
- [ ] **Criar modelo Notification** + sistema de alertas básico
- [ ] **Testar deploy end-to-end:** criar OS → agendar → foto → marcar como feito
- [ ] **Configurar GitHub Secrets** para CI/CD
- [ ] **Rotar credenciais** Supabase antigo (senha exposta no git)

---

## 🔐 Seção 7: Nota Crítica de Segurança

### ⚠️ Sua senha Supabase está no histórico git

```
Senha encontrada: Millena@@2017@@
Arquivo: Histórico de commits
Risco: Qualquer pessoa com acesso ao repo pode extrair credenciais
```

### Ações imediatas:

1. **Alterar senha da conta Supabase antigo** (se ainda ativa)
2. **Usar Neon novo sem expor credenciais**
3. **Adicionar GitHub Secrets:**
   - `DATABASE_URL` (privado)
   - `DIRECT_URL` (privado)
   - `VERCEL_TOKEN`
4. **Considerar `git filter-repo`** para limpar histórico (reescreve repo inteiro)

---

## 💡 Recomendações Finais

### ✅ Pontos Positivos
- Schema Prisma bem estruturado
- Autenticação JWT funcionando
- Deploy (Vercel + Railway) configurado
- UI components sólidos (29 componentes)

### ⚠️ Problemas Imediatos
1. **Backend desconectado:** ~20 módulos comentados. Frontend chama rotas que não existem.
2. **Banco antigo:** Supabase com credenciais expostas. Neon não configurado.
3. **Sem operação:** Sem agendamento, fotos, alertas, não é possível usar em produção real.

### 📋 Próximos Passos (Semana 1)
1. Configurar Neon + testar conexão
2. Uncomment módulos em app.module.ts
3. Implementar Appointment (modelo + API)
4. Implementar Media (modelo + upload)
5. Testar fluxo completo

---

**Documento gerado em 23/06/2026**  
**Negócio:** Click Marido (Reparos Residenciais)  
**Localização:** Blumenau, SC  
**Stack:** React 19, Next.js 15, NestJS 11, PostgreSQL, Prisma
