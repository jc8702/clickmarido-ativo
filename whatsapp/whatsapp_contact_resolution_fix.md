# Relatório de Análise: Resolução de Nomes de Contatos WhatsApp
## Click Marido CRM - Módulo Chat/Conversas

**Data:** 24 de junho de 2026  
**Status do Problema:** Números de telefone aparecem no Chat Hub do WhatsApp sem nomes de contatos associados  
**Urgência:** Alta — afeta experiência do usuário e rastreabilidade de clientes

---

## 1. DIAGNÓSTICO DO PROBLEMA

### 1.1 Observação Visual da Imagem
Na screenshot fornecida, o **Chat Hub (WhatsApp Web)** exibe:
- Lista de 7 conversas ativas
- **Todos os contatos aparecem como números de telefone** (ex: +43 04 45481-61768, +55 85 82319-772, +18 96 23007-449208)
- **Nenhum nome é exibido**, nem mesmo "Sem mensagem"
- O campo `contactName` deveria mostrar o nome do cliente, mas está vazio ou nulo

### 1.2 Raiz Técnica do Problema

O código do **frontend** (`/src/app/(dashboard)/conversas/page.tsx`, linha 127) segue esta lógica de fallback:

```typescript
{chat.client?.name || chat.contactName || chat.contactNumber}
```

**Ordem de prioridade:**
1. `chat.client?.name` — Nome do cliente cadastrado no CRM
2. `chat.contactName` — Nome do contato salvo na conversa
3. `chat.contactNumber` — Número do telefone (fallback)

**O problema:** Tanto `chat.client` quanto `chat.contactName` estão **undefined/null**, então o sistema cai para o número de telefone.

### 1.3 Por Que os Nomes Não Estão Sendo Carregados?

#### **Causa 1: Backend WhatsApp está comentado (CRÍTICA)**
No arquivo `backend/src/app.module.ts`, linha 26:
```typescript
// import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
```
E linha 81:
```typescript
// WhatsappModule,
```

**CONSEQUÊNCIA:** O módulo WhatsApp **não está registrado no NestJS**, portanto:
- Nenhum endpoint do WhatsApp está disponível
- A API retorna erro 404 ou sucesso vazio
- `getConversations()` retorna array vazio ou dados incompletos
- O relacionamento `chat.client` não é carregado do banco de dados

#### **Causa 2: Falta de população de dados relacionados (JOIN)**
A interface `Conversation` (linha 11–18 em `whatsapp.ts`) define:
```typescript
export interface Conversation {
  id: string;
  contactNumber: string;
  contactName?: string;  // ← OPCIONAL
  unreadCount: number;
  lastMessageAt: string;
  client?: { name: string };  // ← Relação com Cliente
}
```

Se o **backend não está implementado**, não há query SELECT que faça JOIN com a tabela `clients` para preencher `client.name`.

#### **Causa 3: Contatos salvos no celular, não sincronizados com CRM**
Os números existem no **WhatsApp local do celular** (com nomes salvos), mas:
- Nunca foram **importados para o banco de dados** do Click Marido
- Nunca foram **vinculados a clientes existentes** no CRM
- Nunca foram **criados como contatos novos** na tabela de clientes

---

## 2. MAPA DE IMPLEMENTAÇÃO ATUAL

### 2.1 Frontend (React 19 + Next.js 15)
✅ **Implementado:**
- Página `/src/app/(dashboard)/conversas/page.tsx` — UI do Chat Hub
- API client `/src/lib/api/modules/whatsapp.ts` — Calls para endpoints

❌ **Faltando:**
- Backend não responde; endpoints 404
- Integração com tabela de `clients` para resolver nomes

### 2.2 Backend (NestJS 11 + Prisma)
❌ **Completamente comentado:**
- `WhatsappModule` não está registrado
- Esquema Prisma pode existir, mas sem controller/service ativo
- Nenhum endpoint de `/whatsapp/conversations` ou `/whatsapp/conversations/:id/messages`

### 2.3 Banco de Dados (PostgreSQL + Prisma)
❓ **Status desconhecido:**
- Tabela `whatsapp_conversations` pode existir
- Tabela `whatsapp_messages` pode existir
- Relação `clientId` → `clients` pode ou não estar implementada

---

## 3. RAÍZES DO FRACASSO ANTERIOR DO AGENTE IA

Seu agente IA provavelmente falhou porque tentou:

1. **Ativar o WhatsappModule sem depuração de dependências**
   - O módulo depende de serviços não implementados (Evolution API, Webhook handlers, etc.)
   - Cause build errors no NestJS que não foram resolvidos

2. **Editar queries sem conhecer o Prisma schema**
   - Não verificou se as tabelas e relações existem
   - Pode ter criado código que causa erro em runtime

3. **Ignorar a falta de integração client.name**
   - Foco exclusivo em ativar o módulo, não em completar a implementação

4. **Não testar end-to-end**
   - Ativou frontend sem backend funcional
   - Não validou que `getConversations()` retorna dados com nomes

---

## 4. SOLUÇÃO: 3 FASES

### ⚠️ AVISO CRÍTICO
**Seu agente IA precisa ser instruído com precisão cirúrgica.** Cada passo deve incluir:
- Validação de dependências antes de ativar módulos
- Testes de query no Prisma antes de usar em controller
- Verificação de tipos TypeScript
- Teste end-to-end com dados reais

---

## FASE 1: DIAGNÓSTICO E PREPARAÇÃO
**Responsabilidade:** Seu agente IA + você

### Tarefa 1.1: Verificar esquema Prisma
```bash
# Abra o arquivo Prisma schema
cat backend/prisma/schema.prisma | grep -A 20 "model WhatsApp\|model Conversation\|model Client"
```

**O que procurar:**
- Existem tabelas `WhatsAppConversation` ou `Conversation`?
- Existe relação `client` apontando para `Client`?
- Se **não existem**, você precisa criá-las com migration

### Tarefa 1.2: Verificar dependências do WhatsappModule
```bash
# Procure o arquivo do módulo comentado
find backend/src -name "*whatsapp*" -type f
```

**Expected:** Arquivos como:
- `modules/whatsapp/whatsapp.module.ts`
- `modules/whatsapp/whatsapp.service.ts`
- `modules/whatsapp/whatsapp.controller.ts`
- `modules/whatsapp/dto/` (Data Transfer Objects)

**Se existem:** Veja o que é necessário (Evolution API client, webhook URL, etc.)  
**Se NÃO existem:** Você precisa criar do zero (mais complexo).

### Tarefa 1.3: Listar números de contatos no banco
```sql
-- Execute no banco de dados PostgreSQL
SELECT DISTINCT contact_number FROM whatsapp_conversations ORDER BY contact_number;
```

**Resultado esperado:** Lista dos 7 números que veem na imagem.

---

## FASE 2: IMPLEMENTAÇÃO DO BACKEND
**Responsabilidade:** Seu agente IA (com supervisão)

### CENÁRIO A: Arquivo WhatsappModule existe

**2A.1 Ativar o módulo no `app.module.ts`**
```typescript
// Descomente apenas a importação
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';

// E adicione ao array @Module({ imports: [...] })
WhatsappModule,
```

**2A.2 Validar que o módulo compila**
```bash
cd backend
npm run build 2>&1 | grep -i "error\|whatsapp"
```

Se houver erros:
- Depure um a um (não ative e ignore erros)
- Procure arquivos de dependência não importados

**2A.3 Adicionar JOIN com Client no Service**

No arquivo `modules/whatsapp/whatsapp.service.ts`, método `getConversations()`:
```typescript
async getConversations(companyId: string): Promise<Conversation[]> {
  const conversations = await this.prisma.whatsappConversation.findMany({
    where: { companyId },
    include: {
      client: {  // ← IMPORTANTE: Fazer JOIN com cliente
        select: { name: true }
      }
    },
    orderBy: { lastMessageAt: 'desc' }
  });
  
  return conversations.map(conv => ({
    id: conv.id,
    contactNumber: conv.contactNumber,
    contactName: conv.contactName,  // Nome salvo na conversa
    unreadCount: conv.unreadCount,
    lastMessageAt: conv.lastMessageAt,
    client: conv.client ? { name: conv.client.name } : undefined
  }));
}
```

---

### CENÁRIO B: Arquivo WhatsappModule NÃO existe

**ISSO É UM PROBLEMA GRAVE.** Você precisará:

1. **Criar estrutura completa:**
   ```
   backend/src/modules/whatsapp/
   ├── whatsapp.module.ts
   ├── whatsapp.controller.ts
   ├── whatsapp.service.ts
   ├── dto/
   │   ├── conversation.dto.ts
   │   └── message.dto.ts
   └── interfaces/
       └── whatsapp.interface.ts
   ```

2. **Controller com endpoint:**
   ```typescript
   @Get('conversations')
   async getConversations(@Query('companyId') companyId: string) {
     return this.whatsappService.getConversations(companyId);
   }
   ```

3. **Service que faz JOIN com Client:**
   ```typescript
   async getConversations(companyId: string) {
     return this.prisma.whatsappConversation.findMany({
       where: { companyId },
       include: { client: { select: { name: true } } },
       orderBy: { lastMessageAt: 'desc' }
     });
   }
   ```

**⚠️ AVISO:** Isso é trabalho de 4–6 horas se feito corretamente. Seu agente IA pode falhar se tentar apressar.

---

## FASE 3: TESTE E VALIDAÇÃO
**Responsabilidade:** Você + agente IA

### Tarefa 3.1: Teste de API (Manual)
```bash
# Assumindo backend rodando em http://localhost:3001
curl -X GET "http://localhost:3001/whatsapp/conversations?companyId=6fb48ab0-08ab-49bd-9eab-57dd4f923ff1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Esperado:**
```json
[
  {
    "id": "conv-123",
    "contactNumber": "+55 85 82319-772",
    "contactName": null,
    "unreadCount": 0,
    "lastMessageAt": "2026-06-24T20:32:00Z",
    "client": {
      "name": "João da Silva"  // ← DEVE APARECER AQUI
    }
  }
]
```

**Se `client` é `null`:** O número **não está vinculado a nenhum cliente** no banco.

### Tarefa 3.2: Vincular Contatos Desconhecidos ao CRM
Para os números que **não têm cliente** vinculado:

**Opção A: Manual (UI)**
1. Vá para **Clientes** no CRM
2. Crie novo cliente com o número de telefone
3. Volte para **Chat** — deve aparecer o nome

**Opção B: Script de Importação (Agente IA)**
```typescript
// Script para rodar uma vez
const numbersToLink = [
  { number: '+43 04 45481-61768', name: 'Cliente X' },
  { number: '+18 96 23007-449208', name: 'Cliente Y' },
  // ... etc
];

for (const contact of numbersToLink) {
  // Verificar se cliente com este número existe
  let client = await prisma.client.findUnique({
    where: { phone: contact.number }
  });
  
  // Se não existe, criar
  if (!client) {
    client = await prisma.client.create({
      data: {
        phone: contact.number,
        name: contact.name,
        companyId: 'SEU_COMPANY_ID'
      }
    });
  }
  
  // Vincular conversa ao cliente
  await prisma.whatsappConversation.update({
    where: { contactNumber: contact.number },
    data: { clientId: client.id }
  });
}
```

### Tarefa 3.3: Teste no Frontend
1. Limpe cache do navegador: `Ctrl+Shift+Delete`
2. Recarregue `/conversas` no CRM
3. Verifique se os nomes agora aparecem em vez dos números

---

## 5. INSTRUÇÕES PARA AGENTE IA (ANTIGRAVITY)

### Prompt Estruturado para Ativar o WhatsappModule

```
TAREFA: Ativar e corrigir o módulo WhatsApp do Click Marido CRM

CONTEXTO:
- Repositório: github.com/jc8702/clickmarido.git
- Problema: Nomes de contatos não aparecem no Chat Hub (apenas números de telefone)
- Causa raiz: WhatsappModule está comentado e não faz JOIN com tabela de Clientes

FASES (EXECUTAR NESTA ORDEM):

FASE 1 — DIAGNÓSTICO (não fazer commits ainda)
1. Verificar existência do diretório: backend/src/modules/whatsapp/
2. Listar arquivos dentro dele
3. Abrir backend/src/app.module.ts e confirmar que WhatsappModule está comentado
4. Abrir Prisma schema e procurar por "WhatsAppConversation" ou "Conversation"
5. Relatar: Qual é a situação real (módulo existe? Schema existe?)

FASE 2 — ATIVAR (pequenos passos)
1. Descomente APENAS estas 2 linhas no app.module.ts:
   - import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
   - WhatsappModule, (dentro do imports array)
2. NÃO mude mais nada ainda
3. Tente compilar: npm run build
4. Se houver erros, PARE e reporte qual é (não tente corrigir automaticamente)
5. Se compilar, prossiga para FASE 3

FASE 3 — IMPLEMENTAR JOIN COM CLIENT
1. Abrir: backend/src/modules/whatsapp/whatsapp.service.ts
2. Encontrar o método: getConversations(companyId)
3. Adicionar `include: { client: { select: { name: true } } }` na query Prisma
4. Testar compilação novamente

FASE 4 — VALIDAÇÃO
1. Fazer commit: "feat: reactivate WhatsApp module and add client JOIN"
2. Relatar sucesso/falha com logs específicos

REGRAS:
- Não ative outros módulos comentados
- Não modifique esquema Prisma sem migration
- Não remova comentários de código "MOCK" ou "TODO"
- Se encontrar arquivo não existe → PAUSE e reporte, não crie do zero
- Se encontrar erro TypeScript → PAUSE, não ignore

QUANDO PRONTO:
Gere um relatório JSON com:
{
  "fasesDeConcluidas": 1-4,
  "erros": [],
  "proxiasAcoes": [],
  "testeURL": "curl http://localhost:3001/whatsapp/conversations?companyId=..."
}
```

---

## 6. CHECKLIST PARA VOCÊ (Proprietário)

- [ ] **Semana 1 — Diagnóstico**
  - [ ] Compartilhe este documento com seu agente IA
  - [ ] Execute o Diagnóstico (FASE 1) manualmente ou com agente
  - [ ] Confirme: Módulo existe? Schema existe? Quais são os erros?

- [ ] **Semana 1–2 — Ativação**
  - [ ] Agente ativa o WhatsappModule
  - [ ] Testa compilação
  - [ ] Implementa JOIN com Client
  - [ ] Faz commit

- [ ] **Semana 2 — Teste & Validação**
  - [ ] Deploy em staging (não produção ainda)
  - [ ] Teste curl do endpoint
  - [ ] Verifique se nomes aparecem no frontend
  - [ ] Se falhar: debug com logs do backend

- [ ] **Semana 2–3 — Vincular Contatos**
  - [ ] Decida: manual ou script?
  - [ ] Crie/vincule clientes aos números
  - [ ] Recarregue Chat Hub no frontend

- [ ] **Semana 3 — Deploy de Produção**
  - [ ] Backup de banco de dados
  - [ ] Deploy backend (Vercel ou servidor)
  - [ ] Teste com dados reais

---

## 7. RISCOS E PONTOS DE FALHA DOCUMENTADOS

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|--------|-----------|
| WhatsappModule depende de Evolution API (não implementada) | Alta | Alto | Pode ativar module mas endpoints retornam erro 500 se Evolution API não estiver configurada |
| Tabela WhatsAppConversation não existe no schema | Média | Alto | Executar migration Prisma antes de ativar módulo |
| clientId na tabela Conversation é NULL para todos os números | Alta | Médio | Vincular contatos manualmente via script ou UI |
| Agente IA tenta ativar módulo inteiro sem testar compilação | Muito Alta | Alto | Instruir agente a testar `npm run build` após cada mudança |
| Webhook de Evolution API não está configurado | Média | Médio | Verificar .env: WHATSAPP_WEBHOOK_URL, EVOLUTION_API_KEY |

---

## 8. PRÓXIMAS AÇÕES (Recomendações)

1. **Curto prazo (esta semana):**
   - Executar Diagnóstico (FASE 1)
   - Determinar se módulo pode ser ativado ou precisa ser criado do zero
   - Documentar dependências externas (Evolution API)

2. **Médio prazo (próximas 2 semanas):**
   - Ativar WhatsappModule (ou criar se não existe)
   - Implementar JOIN com clients
   - Vincular números existentes a clientes no banco

3. **Longo prazo (após tudo funcionar):**
   - Implementar sincronização automática de contatos (Evolution API webhook)
   - Adicionar validação de contatos novos
   - Criar funcionalidade de "vincular contato" dentro do Chat Hub

---

## 9. REFERÊNCIAS DE CÓDIGO

### Estrutura esperada do WhatsappModule

```
backend/src/modules/whatsapp/
├── whatsapp.module.ts          # Registra controller e service
├── whatsapp.controller.ts       # HTTP endpoints
├── whatsapp.service.ts          # Lógica de negócio
├── dto/
│   ├── get-conversations.dto.ts
│   ├── get-messages.dto.ts
│   └── send-message.dto.ts
└── interfaces/
    ├── whatsapp-conversation.interface.ts
    └── whatsapp-message.interface.ts
```

### Query Prisma corrigida (pseudocódigo)

```typescript
// INCORRETA (atual):
const conversations = await prisma.whatsappConversation.findMany({
  where: { companyId }
});
// Retorna: { id, contactNumber, contactName, ... } — SEM client.name

// CORRIGIDA:
const conversations = await prisma.whatsappConversation.findMany({
  where: { companyId },
  include: {
    client: { select: { name: true, id: true } }  // ← ADICIONAR ISTO
  }
});
// Retorna: { id, contactNumber, contactName, client: { name, id }, ... } — COM client.name
```

---

**Documento finalizado. Compartilhe com seu agente IA com o Prompt da Seção 5.**
