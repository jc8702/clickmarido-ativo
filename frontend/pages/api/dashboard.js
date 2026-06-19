import db from '../../lib/db';
import { withAuth } from '../../lib/auth';
import logger from '../../utils/logger';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Queries simples e separadas para o Dashboard
    
    // 1. Total Recebido no Mês
    const receivedMonthRes = await db.getOne(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM payments 
      WHERE status = 'aprovado' 
      AND date_trunc('month', received_at) = date_trunc('month', CURRENT_DATE)
    `);

    // 2. Faturamento Pendente
    const pendingAmountRes = await db.getOne(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM payments 
      WHERE status = 'pendente'
    `);
    
    // 3. Ordens Concluídas no Mês
    const ordersMonthRes = await db.getOne(`
      SELECT COUNT(*) as total 
      FROM service_orders 
      WHERE status = 'concluida'
      AND date_trunc('month', completed_at) = date_trunc('month', CURRENT_DATE)
    `);

    // 4. Ordens Em Progresso
    const ordersInProgressRes = await db.getOne(`
      SELECT COUNT(*) as total 
      FROM service_orders 
      WHERE status IN ('agendada', 'em_progresso')
    `);

    // 5. Total de Clientes
    const customersRes = await db.getOne(`
      SELECT COUNT(*) as total 
      FROM customers
    `);

    // 6. Taxa de Conversão
    const quotesTotalRes = await db.getOne(`SELECT COUNT(*) as total FROM quotations`);
    const quotesApprovedRes = await db.getOne(`SELECT COUNT(*) as total FROM quotations WHERE status = 'approved'`);
    const totalQuotes = parseInt(quotesTotalRes.total) || 1; // evita div por zero
    const conversionRate = (parseInt(quotesApprovedRes.total) / totalQuotes) * 100;

    // 7. Last Orders
    const lastOrders = await db.getAll(`
      SELECT so.id, c.name as customer_name, p.amount, so.status
      FROM service_orders so
      JOIN customers c ON so.customer_id = c.id
      LEFT JOIN payments p ON p.service_order_id = so.id
      ORDER BY so.created_at DESC
      LIMIT 5
    `);

    // 8. Top Services (Mock ou agregado via quotations se tivessemos os nomes na SO, pegando do db se tivessemos itens estruturados)
    // Para simplificar no MVP, vamos mandar fixo ou agregado simples se houver
    const topServices = [
      { name: 'Manutenção Elétrica', count: 12 },
      { name: 'Instalação de Ar Cond.', count: 8 },
      { name: 'Reparo Hidráulico', count: 5 }
    ];

    return res.status(200).json({
      data: {
        receivedThisMonth: parseFloat(receivedMonthRes.total),
        pendingAmount: parseFloat(pendingAmountRes.total),
        ordersThisMonth: parseInt(ordersMonthRes.total),
        ordersInProgress: parseInt(ordersInProgressRes.total),
        customersTotal: parseInt(customersRes.total),
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        lastOrders,
        topServices
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar dados do dashboard', { error: error.message });
    return res.status(500).json({ error: 'Erro ao carregar dashboard.' });
  }
}

export default withAuth(handler);
