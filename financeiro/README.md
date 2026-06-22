# Módulo Financeiro - Click Marido CRM

## Visão Geral

Sistema financeiro integrado com **Mercado Pago** para pagamentos (PIX, Boleto, Cartão).

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `PLANEJAMENTO_IMPLANTACAO_MODULO_FINANCEIRO.md` | **PLANO PRINCIPAL** - Leia primeiro |
| `DESENHO_MODULO_FINANCEIRO.md` | Especificação técnica completa |
| `CONCLUSAO_ROADMAP_IMPLEMENTACAO.md` | Roadmap 8 semanas |
| `00_LEIA_ISSO_PRIMEIRO.md` | Resumo executivo |
| `.env.example` | Exemplo de variáveis de ambiente |

## Início Rápido

```bash
# 1. Copiar variáveis de ambiente
cp .env.example ../frontend/.env.local

# 2. Editar .env.local com suas credenciais Mercado Pago
# NUNCA committar este arquivo

# 3. Seguir o PLANEJAMENTO_IMPLANTACAO_MODULO_FINANCEIRO.md
```

## Credenciais Mercado Pago

**⚠️ SEGURANÇA:** As credenciais devem estar apenas em `.env.local` (nunca em repositório público).

## Documentação

- **Fase 0:** Preparação + Setup
- **Fase 1:** Schema Prisma + Migrações
- **Fase 2:** API Invoices
- **Fase 3:** API Payments + Mercado Pago
- **Fase 4:** API Expenses & Vendors
- **Fase 5:** Dashboard & Relatórios
- **Fase 6:** Integrações (WhatsApp, Email)
- **Fase 7:** Frontend
- **Fase 8:** Testes
- **Fase 9:** Segurança
- **Fase 10:** Deploy

---

**Status:** 🟢 Pronto para Build  
**Gateway de Pagamento:** Mercado Pago  
**Versão:** 2.0
