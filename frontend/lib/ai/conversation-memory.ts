import { prisma } from '../prisma';

// ==========================================
// MEMÓRIA DE CONVERSA
// Mantém contexto curto da conversa por sessão
// ==========================================

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const MAX_MESSAGES_PER_SESSION = 20;
const SESSION_EXPIRY_HOURS = 24;

// Gerar ID de sessão
export function generateSessionId(): string {
  return `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Salvar mensagem na conversa
export async function saveMessage(
  sessionId: string,
  userId: string | undefined,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  try {
    // Buscar conversa existente
    const existing = await prisma.aiConversation.findUnique({
      where: { sessionId },
    });

    const messages: ConversationMessage[] = existing
      ? (existing.messages as unknown as ConversationMessage[])
      : [];

    // Adicionar nova mensagem
    messages.push({
      role,
      content: content.substring(0, 2000),
      timestamp: new Date().toISOString(),
    });

    // Manter apenas as últimas N mensagens
    const trimmedMessages = messages.slice(-MAX_MESSAGES_PER_SESSION);

    if (existing) {
      // Atualizar conversa existente
      await prisma.aiConversation.update({
        where: { sessionId },
        data: { messages: trimmedMessages as unknown as any },
      });
    } else {
      // Criar nova conversa
      await prisma.aiConversation.create({
        data: {
          sessionId,
          userId: userId || null,
          messages: trimmedMessages as unknown as any,
        },
      });
    }
  } catch (error) {
    console.error('[CONVERSATION_SAVE_ERROR]', error);
  }
}

// Carregar histórico da conversa
export async function loadConversation(
  sessionId: string
): Promise<ConversationMessage[]> {
  try {
    const conversation = await prisma.aiConversation.findUnique({
      where: { sessionId },
    });

    if (!conversation) return [];

    // Verificar se a conversa não expirou
    const updatedAt = new Date(conversation.updatedAt);
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() - SESSION_EXPIRY_HOURS);

    if (updatedAt < expiryTime) {
      // Conversa expirou — deletar
      await prisma.aiConversation.delete({
        where: { sessionId },
      });
      return [];
    }

    return (conversation.messages as unknown as ConversationMessage[]) || [];
  } catch (error) {
    console.error('[CONVERSATION_LOAD_ERROR]', error);
    return [];
  }
}

// Limpar conversas antigas
export async function cleanOldConversations(): Promise<number> {
  try {
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() - SESSION_EXPIRY_HOURS);

    const result = await prisma.aiConversation.deleteMany({
      where: {
        updatedAt: { lt: expiryTime },
      },
    });

    console.log(`[CONVERSATION_CLEANUP] Removidas ${result.count} conversas expiradas`);
    return result.count;
  } catch (error) {
    console.error('[CONVERSATION_CLEANUP_ERROR]', error);
    return 0;
  }
}

// Formatar histórico para o LLM
export function formatHistoryForLLM(
  messages: ConversationMessage[],
  maxMessages: number = 10
): Array<{ role: 'user' | 'assistant'; content: string }> {
  // Pegar as últimas N mensagens
  const recent = messages.slice(-maxMessages);
  
  return recent.map(m => ({
    role: m.role,
    content: m.content,
  }));
}
