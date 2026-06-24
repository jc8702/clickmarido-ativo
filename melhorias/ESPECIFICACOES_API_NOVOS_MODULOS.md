# 🔌 Especificações de API REST - Novos Módulos

**Objetivo:** Servir como referência técnica para implementar endpoints no NestJS

---

## 📋 Índice
1. Appointments (Agendamentos)
2. Media (Fotos/Evidências)
3. Notifications (Alertas)
4. Materials (Inventário)
5. Suppliers (Fornecedores)
6. Reviews (Avaliações)

---

## 1️⃣ APPOINTMENTS (Agendamentos)

### Prisma Schema
```prisma
model Appointment {
  id               String   @id @default(cuid())
  
  // Campos
  date             DateTime
  time             DateTime
  duration         Int      // minutos
  status           AppointmentStatus @default(SCHEDULED)
  notes            String?
  location         String
  
  // Relations
  serviceOrderId   String
  serviceOrder     ServiceOrder @relation(fields: [serviceOrderId], references: [id])
  
  technicianId     String
  technician       Technician @relation(fields: [technicianId], references: [id])
  
  companyId        String
  company          Company @relation(fields: [companyId], references: [id])
  
  // Audit
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  @@unique([technicianId, date, time]) // Evita duplas
  @@map("appointments")
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}
```

### Endpoints

#### GET /api/appointments
**Descrição:** Listar agendamentos com filtros

**Query Parameters:**
```
GET /api/appointments?
  startDate=2026-06-01&
  endDate=2026-06-30&
  technicianId=tech_123&
  status=SCHEDULED&
  limit=50&
  offset=0
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "apt_123",
      "date": "2026-06-24",
      "time": "10:00",
      "duration": 60,
      "status": "SCHEDULED",
      "location": "Rua A, 123",
      "notes": "Cliente solicitou manhã",
      "serviceOrder": {
        "id": "os_456",
        "title": "Conserto de torneira",
        "clientName": "João Silva"
      },
      "technician": {
        "id": "tech_123",
        "name": "Carlos Técnico",
        "specialty": "Hidráulica"
      },
      "createdAt": "2026-06-23T10:30:00Z"
    }
  ],
  "total": 125,
  "page": 1,
  "pageSize": 50
}
```

**Erros:**
```json
400 Bad Request: Data inválida
401 Unauthorized: Sem autenticação
403 Forbidden: Sem permissão
```

---

#### POST /api/appointments
**Descrição:** Criar novo agendamento

**Body:**
```json
{
  "serviceOrderId": "os_456",
  "technicianId": "tech_123",
  "date": "2026-06-24",
  "time": "10:00",
  "duration": 60,
  "location": "Rua A, 123",
  "notes": "Cliente solicitou manhã"
}
```

**Response (201):**
```json
{
  "id": "apt_123",
  "status": "SCHEDULED",
  "createdAt": "2026-06-23T11:00:00Z"
}
```

**Validações:**
- `date` e `time` no futuro
- `duration` > 0
- `technicianId` não pode ter conflito (nenhuma outra apt no mesmo horário)
- `serviceOrderId` deve existir e ser de mesma company

**Efeito colateral:**
- Enviar notificação ao técnico (SMS/Email "Novo agendamento às 10:00")
- Enviar notificação ao cliente (SMS/Email "Técnico chegará às 10:00")

---

#### PATCH /api/appointments/:id
**Descrição:** Atualizar agendamento

**Body (parcial):**
```json
{
  "date": "2026-06-25",
  "time": "14:00",
  "status": "CONFIRMED",
  "notes": "Cliente confirmou horário"
}
```

**Response (200):**
```json
{
  "id": "apt_123",
  "status": "CONFIRMED"
}
```

**Regras:**
- Não pode mudar agendamento COMPLETED ou CANCELLED
- Se mudar data/hora, avisar técnico e cliente novamente

---

#### PUT /api/appointments/:id/status
**Descrição:** Atualizar status rapidamente

**Body:**
```json
{
  "status": "IN_PROGRESS"
}
```

**Response (200):**
```json
{
  "id": "apt_123",
  "status": "IN_PROGRESS",
  "startedAt": "2026-06-24T10:05:00Z"
}
```

**Transições válidas:**
```
SCHEDULED → CONFIRMED, CANCELLED
CONFIRMED → IN_PROGRESS, CANCELLED
IN_PROGRESS → COMPLETED, NO_SHOW
COMPLETED → (final)
NO_SHOW → (final)
CANCELLED → (final)
```

---

#### DELETE /api/appointments/:id
**Descrição:** Cancelar agendamento

**Response (200):**
```json
{
  "id": "apt_123",
  "status": "CANCELLED",
  "cancelledAt": "2026-06-23T11:30:00Z"
}
```

---

#### GET /api/appointments/technician/:technicianId/week
**Descrição:** Agenda da semana do técnico (para roteirização)

**Response (200):**
```json
{
  "technicianId": "tech_123",
  "technicianName": "Carlos Técnico",
  "week": {
    "startDate": "2026-06-23",
    "endDate": "2026-06-29",
    "appointments": [
      {
        "day": "2026-06-24",
        "time": "10:00",
        "duration": 60,
        "location": "Rua A, 123",
        "clientName": "João Silva",
        "serviceType": "Hidráulica"
      },
      {
        "day": "2026-06-24",
        "time": "11:30",
        "duration": 45,
        "location": "Rua B, 456",
        "clientName": "Maria Santos",
        "serviceType": "Elétrica"
      }
    ]
  }
}
```

---

#### GET /api/appointments/conflicts
**Descrição:** Detectar conflitos (para validar antes de criar)

**Query:**
```
GET /api/appointments/conflicts?
  technicianId=tech_123&
  date=2026-06-24&
  time=10:00&
  duration=60
```

**Response (200):**
```json
{
  "hasConflict": false,
  "conflictingAppointments": [],
  "availableSlots": [
    { "time": "08:00", "duration": 120 },
    { "time": "10:00", "duration": 60 },
    { "time": "12:00", "duration": 180 }
  ]
}
```

---

## 2️⃣ MEDIA (Fotos/Evidências)

### Prisma Schema
```prisma
model Media {
  id               String   @id @default(cuid())
  
  // File Info
  fileUrl          String   // URL no S3/GCP/Drive
  fileName         String
  fileSize         Int      // bytes
  mimeType         String   // image/jpeg, image/png
  
  // Relations
  serviceOrderId   String
  serviceOrder     ServiceOrder @relation(fields: [serviceOrderId], references: [id])
  
  uploadedByUserId String
  uploadedBy       User @relation(fields: [uploadedByUserId], references: [id])
  
  companyId        String
  company          Company @relation(fields: [companyId], references: [id])
  
  // Metadata
  type             MediaType @default(PROGRESS)
  caption          String?
  geoLocation      String?  // latitude,longitude
  
  // Audit
  uploadedAt       DateTime @default(now())
  deletedAt        DateTime?
  
  @@map("media")
}

enum MediaType {
  BEFORE       // Foto antes do trabalho
  AFTER        // Foto depois do trabalho
  PROGRESS     // Foto durante o trabalho
  ISSUE        // Foto de problema encontrado
  SOLUTION     // Foto da solução aplicada
}
```

### Endpoints

#### POST /api/media/upload
**Descrição:** Upload de arquivo

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer {jwt_token}
```

**Body:**
```
multipart/form-data:
  file: <binary image>
  serviceOrderId: "os_456"
  type: "BEFORE"
  caption: "Estado inicial da hidráulica"
  geoLocation: "-26.915083,-49.066040"
```

**Response (201):**
```json
{
  "id": "media_789",
  "fileUrl": "https://storage.example.com/companies/cid_123/media_789.jpg",
  "fileName": "20260624_100530.jpg",
  "fileSize": 2048576,
  "type": "BEFORE",
  "uploadedAt": "2026-06-24T10:05:30Z",
  "uploadedBy": {
    "id": "user_123",
    "name": "Carlos Técnico"
  }
}
```

**Validações:**
- Arquivo: JPEG, PNG (max 10MB)
- `serviceOrderId` deve existir e estar aberta
- User deve ser técnico ou admin da company

**Efeito colateral:**
- Notificar cliente (SMS/Email "Nova foto enviada na sua OS")
- Adicionar foto à galeria de evidências

---

#### GET /api/media/service-order/:serviceOrderId
**Descrição:** Listar fotos de uma OS

**Response (200):**
```json
{
  "serviceOrderId": "os_456",
  "media": [
    {
      "id": "media_789",
      "type": "BEFORE",
      "fileUrl": "https://...",
      "caption": "Estado inicial",
      "uploadedAt": "2026-06-24T10:05:30Z",
      "uploadedBy": {
        "name": "Carlos Técnico"
      }
    },
    {
      "id": "media_790",
      "type": "AFTER",
      "fileUrl": "https://...",
      "caption": "Trabalho finalizado",
      "uploadedAt": "2026-06-24T11:30:00Z",
      "uploadedBy": {
        "name": "Carlos Técnico"
      }
    }
  ],
  "totalSize": 5242880 // bytes
}
```

---

#### DELETE /api/media/:id
**Descrição:** Deletar foto

**Response (204) No Content**

**Permissões:**
- Admin ou uploader original
- Não pode deletar se OS está COMPLETED

---

#### POST /api/media/:id/zip-export
**Descrição:** Exportar fotos de uma OS como ZIP

**Response (200) application/zip**
```
clickmarido-os-456-fotos.zip
├── BEFORE_20260624_100530.jpg
├── PROGRESS_20260624_103000.jpg
└── AFTER_20260624_113000.jpg
```

---

## 3️⃣ NOTIFICATIONS (Alertas)

### Prisma Schema
```prisma
model Notification {
  id               String   @id @default(cuid())
  
  userId           String
  user             User @relation(fields: [userId], references: [id])
  
  type             NotificationType
  title            String
  message          String
  
  // Referência
  relatedEntityId  String?  // ID da OS, Payment, etc
  relatedEntityType String? // ServiceOrder, Payment, etc
  
  // Status
  isRead           Boolean @default(false)
  readAt           DateTime?
  
  // Canais
  sentViaEmail     Boolean @default(false)
  sentViaSMS       Boolean @default(false)
  sentViaPush      Boolean @default(false)
  
  // Audit
  createdAt        DateTime @default(now())
  
  @@index([userId, isRead])
  @@map("notifications")
}

enum NotificationType {
  OS_CREATED           // Nova ordem de serviço criada
  OS_UPDATED           // OS foi atualizada
  OS_COMPLETED         // Trabalho foi finalizado
  APPOINTMENT_SCHEDULED // Agendamento criado
  APPOINTMENT_REMINDER  // Lembrete 1h antes
  APPOINTMENT_CANCELLED // Agendamento cancelado
  PAYMENT_RECEIVED      // Pagamento confirmado
  PAYMENT_OVERDUE       // Pagamento atrasado
  WARRANTY_EXPIRING     // Garantia expirando em 7 dias
  WARRANTY_CLAIMED      // Garantia foi acionada
  NEW_REVIEW           // Cliente deixou avaliação
  MATERIAL_LOW_STOCK   // Estoque de material baixo
}
```

### Endpoints

#### GET /api/notifications
**Descrição:** Listar notificações do usuário

**Query:**
```
GET /api/notifications?
  limit=20&
  offset=0&
  isRead=false
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "notif_001",
      "type": "OS_CREATED",
      "title": "Nova ordem de serviço",
      "message": "OS #456 criada para João Silva",
      "relatedEntityId": "os_456",
      "isRead": false,
      "createdAt": "2026-06-24T10:30:00Z"
    }
  ],
  "unreadCount": 3,
  "total": 45
}
```

---

#### PATCH /api/notifications/:id/read
**Descrição:** Marcar como lida

**Response (200):**
```json
{
  "id": "notif_001",
  "isRead": true,
  "readAt": "2026-06-24T10:35:00Z"
}
```

---

#### POST /api/notifications/mark-all-read
**Descrição:** Marcar todas como lidas

**Response (200):**
```json
{
  "updatedCount": 3
}
```

---

#### GET /api/notifications/unread-count
**Descrição:** Contar notificações não lidas (para badge)

**Response (200):**
```json
{
  "unreadCount": 3
}
```

---

#### DELETE /api/notifications/:id
**Descrição:** Deletar notificação

**Response (204) No Content**

---

## 4️⃣ MATERIALS (Inventário)

### Prisma Schema
```prisma
model Material {
  id           String   @id @default(cuid())
  
  name         String
  category     String   // "Hidráulica", "Elétrica", "Hardware"
  description  String?
  
  costPrice    Float
  sellPrice    Float?
  
  quantity     Int      // Estoque atual
  minStock     Int      // Alerta quando < minStock
  unit         String   // "metro", "unidade", "kg"
  
  supplier     String?  // "Loja A", "Fornecedor B"
  lastRestockDate DateTime?
  
  companyId    String
  company      Company @relation(fields: [companyId], references: [id])
  
  usages       MaterialUsage[]
  
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

### Endpoints

#### GET /api/materials
**Descrição:** Listar materiais com filtros

**Query:**
```
GET /api/materials?
  category=Hidráulica&
  lowStockOnly=true&
  limit=50
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "mat_123",
      "name": "Tubo PVC 50mm",
      "category": "Hidráulica",
      "quantity": 5,
      "minStock": 10,
      "costPrice": 45.50,
      "unit": "metro",
      "isLowStock": true,
      "usageLastMonth": 12
    }
  ],
  "lowStockCount": 3,
  "totalValue": 15420.50
}
```

---

#### POST /api/materials
**Descrição:** Criar material

**Body:**
```json
{
  "name": "Tubo PVC 50mm",
  "category": "Hidráulica",
  "costPrice": 45.50,
  "sellPrice": 75.00,
  "quantity": 10,
  "minStock": 5,
  "unit": "metro",
  "supplier": "Loja de Hidráulica"
}
```

**Response (201):**
```json
{
  "id": "mat_123",
  "createdAt": "2026-06-24T10:00:00Z"
}
```

---

#### POST /api/materials/:id/usage
**Descrição:** Registrar consumo de material

**Body:**
```json
{
  "serviceOrderId": "os_456",
  "quantityUsed": 2
}
```

**Response (201):**
```json
{
  "id": "usage_789",
  "quantityUsed": 2,
  "newQuantity": 8,
  "costTotal": 91.00
}
```

**Validação:**
- `quantityUsed` não pode ser > estoque atual

**Efeito colateral:**
- Se novo quantity < minStock, notificar gerente (alert)
- Atualizar custo total da OS (ServiceOrder.costMaterials)

---

#### GET /api/materials/low-stock
**Descrição:** Listar itens com estoque baixo

**Response (200):**
```json
{
  "data": [
    {
      "id": "mat_123",
      "name": "Tubo PVC 50mm",
      "quantity": 3,
      "minStock": 5,
      "costPrice": 45.50,
      "needToRestock": 2
    }
  ]
}
```

---

#### POST /api/materials/import-csv
**Descrição:** Importar materiais de CSV

**Headers:**
```
Content-Type: multipart/form-data
```

**Body:**
```
CSV:
name,category,costPrice,quantity,minStock,unit
"Tubo PVC 50mm","Hidráulica",45.50,10,5,"metro"
"Parafuso M8","Hardware",2.50,100,20,"unidade"
```

**Response (201):**
```json
{
  "imported": 2,
  "failed": 0,
  "errors": []
}
```

---

## 5️⃣ SUPPLIERS (Fornecedores)

### Prisma Schema
```prisma
model Supplier {
  id      String   @id @default(cuid())
  
  name    String
  phone   String?
  email   String?
  address String?
  
  rating  Float?   // 1-5
  website String?
  
  companyId String
  company Company @relation(fields: [companyId], references: [id])
  
  orders  PurchaseOrder[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("suppliers")
}

model PurchaseOrder {
  id           String   @id @default(cuid())
  
  supplierId   String
  supplier     Supplier @relation(fields: [supplierId], references: [id])
  
  items        String   // JSON array
  totalValue   Float
  status       PurchaseOrderStatus
  
  orderedAt    DateTime?
  deliveredAt  DateTime?
  dueDate      DateTime?
  
  companyId    String
  company      Company @relation(fields: [companyId], references: [id])
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@map("purchase_orders")
}

enum PurchaseOrderStatus {
  PENDING
  ORDERED
  IN_TRANSIT
  RECEIVED
  CANCELLED
}
```

### Endpoints

#### GET /api/suppliers
**Descrição:** Listar fornecedores

**Response (200):**
```json
{
  "data": [
    {
      "id": "supp_001",
      "name": "Loja de Hidráulica ABC",
      "phone": "(47) 3333-3333",
      "email": "contato@loja.com",
      "rating": 4.8,
      "orders": [
        {
          "id": "po_001",
          "totalValue": 450.00,
          "status": "RECEIVED",
          "deliveredAt": "2026-06-20"
        }
      ]
    }
  ]
}
```

---

#### POST /api/suppliers/:id/purchase-order
**Descrição:** Criar pedido de compra

**Body:**
```json
{
  "items": [
    {
      "materialId": "mat_123",
      "name": "Tubo PVC 50mm",
      "quantity": 5,
      "unitPrice": 45.50
    }
  ],
  "dueDate": "2026-06-30",
  "notes": "Urgente"
}
```

**Response (201):**
```json
{
  "id": "po_001",
  "totalValue": 227.50,
  "status": "PENDING",
  "createdAt": "2026-06-24T10:00:00Z"
}
```

---

#### GET /api/purchase-orders
**Descrição:** Listar pedidos com filtros

**Query:**
```
GET /api/purchase-orders?
  status=PENDING&
  overdue=true
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "po_001",
      "supplier": "Loja ABC",
      "totalValue": 227.50,
      "status": "PENDING",
      "dueDate": "2026-06-25",
      "isOverdue": true
    }
  ],
  "overdueCount": 1
}
```

---

## 6️⃣ REVIEWS (Avaliações)

### Prisma Schema
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
  
  photos         String? // JSON array de URLs
  
  createdAt      DateTime @default(now())
  
  @@map("reviews")
}

model NPS {
  id       String   @id @default(cuid())
  
  clientId String
  client   Client @relation(fields: [clientId], references: [id])
  
  score    Int      // 0-10
  feedback String?
  
  createdAt DateTime @default(now())
  
  @@map("nps_surveys")
}
```

### Endpoints

#### POST /api/reviews
**Descrição:** Criar avaliação (usuário submete voluntariamente ou via email link)

**Body:**
```json
{
  "serviceOrderId": "os_456",
  "rating": 5,
  "comment": "Técnico muito profissional, trabalho de qualidade!",
  "token": "email_verification_token" // Se via email
}
```

**Response (201):**
```json
{
  "id": "review_001",
  "createdAt": "2026-06-24T14:30:00Z"
}
```

**Validações:**
- `rating` entre 1-5
- Não pode haver 2 reviews para mesma OS

**Efeito colateral:**
- Notificar técnico e gerente (SMS/Email)
- Atualizar rating médio do técnico

---

#### GET /api/reviews/technician/:technicianId
**Descrição:** Listar reviews de um técnico

**Response (200):**
```json
{
  "technicianId": "tech_123",
  "name": "Carlos Técnico",
  "averageRating": 4.7,
  "totalReviews": 12,
  "reviews": [
    {
      "id": "review_001",
      "rating": 5,
      "comment": "Muito bom!",
      "clientName": "João",
      "createdAt": "2026-06-24"
    }
  ],
  "ratingDistribution": {
    "5": 9,
    "4": 2,
    "3": 1,
    "2": 0,
    "1": 0
  }
}
```

---

#### GET /api/dashboard/reviews-summary
**Descrição:** Resumo de reviews para dashboard

**Response (200):**
```json
{
  "averageRating": 4.6,
  "totalReviews": 125,
  "recentReviews": [
    {
      "clientName": "João",
      "technicianName": "Carlos",
      "rating": 5,
      "comment": "Excelente!",
      "date": "2026-06-24"
    }
  ],
  "worstRatedTechnicians": [
    {
      "name": "Pedro",
      "rating": 3.2,
      "reviewCount": 5
    }
  ],
  "lowRatingsThisWeek": 2
}
```

---

## 🔧 Utilidades Comuns

### Request Headers Esperados
```
Authorization: Bearer {jwt_token}
X-Company-ID: company_123  (Opcional, se não no token)
Content-Type: application/json
```

### Response Wrapper (Padrão)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso"
}
```

### Error Response (Padrão)
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Recurso não encontrado",
  "statusCode": 404
}
```

### Paginação (Padrão)
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 250,
    "hasNextPage": true
  }
}
```

---

## 📌 Notas de Implementação

### 1. Authentication & Authorization
- Todos os endpoints requerem JWT (exceto públicos)
- CompanyContextGuard valida isolamento de dados
- Roles: USER, ADMIN, MANAGER

### 2. Real-time Notifications
- Usar @nestjs/event-emitter para disparar eventos
- Subscribers escutam e enviam SMS/Email via providers

### 3. File Upload
- Validar tipo (image/*)
- Comprimir antes de armazenar
- Usar signed URLs (expiram em 7 dias)

### 4. Soft Deletes
- Usar `deletedAt` (não deletar, apenas marcar)
- Queries padrão excluem `deletedAt` != null

### 5. Testing
- Usar Postman/Insomnia para validar
- Criar seeds (fixtures) para dados de teste
- Testar validações e edge cases

---

**Documento de referência técnica | Use como guia para implementação NestJS**
