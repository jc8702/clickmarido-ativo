# Agente de IA ClickMarido

## Visão Geral

O agente de IA do ClickMarido é um assistente virtual integrado ao sistema, capaz de responder dúvidas sobre serviços e auxiliar no uso do CRM.

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    ENTRADA                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  ChatBox UI │  │   API REST  │  │  WhatsApp   │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
└─────────┼────────────────┼────────────────┼────────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼──────┐
                    │  API Router │
                    │ /api/ai/chat│
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
   │  Intent     │  │  RAG Engine │  │  AI Provider│
   │  Router     │  │  (Busca KB) │  │  Orchestr.  │
   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Resposta  │
                    └─────────────┘
```

## Componentes

### 1. Intent Router (`intent-router.ts`)
- Classifica mensagens em intenções
- Detecta necessidade de escalação
- Solicita esclarecimento quando ambíguo

**Intenções suportadas:**
- `servico_eletrica`
- `servico_hidraulica`
- `servico_automacao_residencial`
- `servico_montagem_moveis`
- `sistema_uso_geral`
- `sistema_modulos`
- `suporte_tecnico`
- `abertura_chamado`
- `status_solicitacao`
- `humano`
- `desconhecido`

### 2. RAG Engine (`rag-engine.ts`)
- Busca contexto na base de conhecimento
- Retorna documentos relevantes
- Constrói contexto para o LLM

### 3. AI Providers (`providers/`)
- **OpenRouter** (principal): Modelos gratuitos via `openrouter/free`
- **Kilo** (fallback): Modelos gratuitos via `kilo-auto/free`
- Orquestrador com fallback automático

### 4. Agent (`agent.ts`)
- Orquestra todos os componentes
- Gera respostas finais
- Implementa fallback para regras

### 5. ChatBox (`components/ai/ChatBox.tsx`)
- Interface de chat no frontend
- Histórico de mensagens
- Indicador de digitação

## Base de Conhecimento

### Estrutura
```
knowledge-base/
├── services/
│   ├── eletrica.md
│   ├── hidraulica.md
│   ├── automacao-residencial.md
│   └── montagem-moveis.md
├── system/
│   ├── uso-geral.md
│   ├── modulos.md
│   ├── fluxos.md
│   └── erros-comuns.md
├── operations/
│   ├── horarios-sla.md
│   ├── regras-atendimento.md
│   └── escalonamento.md
├── governance/
│   ├── politicas-resposta.md
│   └── glossario.md
└── faq/
    ├── servicos-faq.md
    └── sistema-faq.md
```

## Configuração

### Variáveis de Ambiente

```env
# OpenRouter (Principal)
OPENROUTER_API_KEY=sua-chave

# Kilo (Fallback - opcional)
KILO_API_KEY=sua-chave
```

### Obter Chaves

1. **OpenRouter**: https://openrouter.ai/keys
   - Modelos gratuitos: `openrouter/free` ou `meta-llama/llama-3.2-3b-instruct:free`

2. **Kilo**: https://kilo.ai (funciona sem chave com rate limit)

## Uso

### No Frontend

```tsx
import { ChatBox, ChatButton } from '@/components/ai';
import { useChat } from '@/hooks/useChat';

function MyPage() {
  const { isOpen, open, close } = useChat();

  return (
    <>
      <ChatButton onClick={open} />
      <ChatBox isOpen={isOpen} onClose={close} />
    </>
  );
}
```

### Via API

```typescript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Como criar um orçamento?',
    conversationHistory: [],
  }),
});

const data = await response.json();
console.log(data.content); // Resposta do assistente
```

## Escalonamento

O agente escala para humano quando:
- Detecta risco técnico
- Encontra dúvida fora da base
- Identifica cobrança ou garantia
- Usuário solicita atendente humano

## Logs e Observabilidade

### Endpoint de Logs
```
GET /api/ai/logs?action=stats
GET /api/ai/logs?action=list&limit=100
GET /api/ai/logs?action=export&format=csv
```

### Métricas
- Total de mensagens
- Taxa de sucesso
- Tempo médio de resposta
- Intenções mais frequentes
- Providers utilizados

## Limitações

- Não altera dados do sistema
- Não processa pagamentos
- Não tem acesso a dados sensíveis
- Escala para humano quando necessário

## Próximos Passos

1. Configurar chave OpenRouter
2. Testar cenários principais
3. Expandir base de conhecimento
4. Adicionar mais intenções
5. Integrar com WhatsApp
