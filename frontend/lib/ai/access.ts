import { prisma } from '../prisma';

// ==========================================
// CONTROLE DE ACESSO AO ASSISTENTE IA
// Verifica se o usuário tem permissão ai_access
// ==========================================

export async function checkAiAccess(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiAccess: true, active: true },
    });

    if (!user) return false;
    if (!user.active) return false;
    return user.aiAccess;
  } catch (error) {
    console.error('[AI_ACCESS_CHECK_ERROR]', error);
    return false;
  }
}

export async function setAiAccess(userId: string, enabled: boolean): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { aiAccess: enabled },
    });
    return true;
  } catch (error) {
    console.error('[AI_ACCESS_SET_ERROR]', error);
    return false;
  }
}

export async function getAiAccessUsers(): Promise<Array<{ id: string; name: string; email: string; aiAccess: boolean }>> {
  try {
    return await prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true, aiAccess: true },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('[AI_ACCESS_LIST_ERROR]', error);
    return [];
  }
}
