# Checklist de Validação - Módulo de Serviços e Produtos

## ✅ Pré-Implementação

- [ ] Backup do banco de dados realizado
- [ ] Git branch criado: `feature/modulo-servicos`
- [ ] Arquivo `.env` com `DATABASE_URL` configurado
- [ ] Node.js 18+ instalado
- [ ] Dependências npm atualizadas

## ✅ Arquivos Criados/Copiados

### Backend - APIs
- [ ] `frontend/app/api/products/[id]/route.ts` — existe e contém PUT/DELETE
- [ ] `frontend/app/api/products/available/route.ts` — NOVO arquivo
- [ ] `frontend/app/api/quotation-items/route.ts` — NOVO arquivo
- [ ] `frontend/app/api/quotation-items/[id]/route.ts` — NOVO arquivo

### Frontend - Componentes
- [ ] `frontend/components/quotations/ProductPicker.tsx` — NOVO arquivo
- [ ] `frontend/components/quotations/QuotationItemsTable.tsx` — NOVO arquivo
- [ ] `frontend/components/products/ProductForm.tsx` — deve existir (sem mudanças)

### Frontend - Hooks
- [ ] `frontend/hooks/useQuotationItems.ts` — NOVO arquivo
- [ ] `frontend/hooks/useProducts.ts` — deve existir

### Database - Schema
- [ ] `frontend/prisma/schema.prisma` — verificar se tem `QuotationItem` model

## ✅ Prisma & Banco de Dados

- [ ] Schema atualizado com modelo `QuotationItem`
- [ ] Migração executada: `npx prisma migrate dev --name add_quotation_items_table`
- [ ] Tabela `quotation_items` criada no banco
- [ ] Índices criados:
  - [ ] `quotation_items.quotationId`
  - [ ] `quotation_items.productId`
- [ ] Foreign keys validadas no Neon dashboard

## ✅ TypeScript & Build

- [ ] `npm run build` executa sem erros
- [ ] `npm run build` não gera warnings críticos
- [ ] Types gerados pelo Prisma estão atualizados
- [ ] Sem erros de "cannot find module" em componentes

## ✅ Testes Unitários da API

### GET /api/products/available
- [ ] Retorna array de produtos ativos
- [ ] Filtro por `search` funciona (name, sku, description)
- [ ] Filtro por `type` funciona (SERVICO/PECA)
- [ ] Sem autenticação retorna 401
- [ ] Com limit=10 retorna máximo 10 items

**Test curl:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/products/available?search=chuv&type=SERVICO"
```

### POST /api/quotation-items
- [ ] Cria novo item com produto válido
- [ ] Calcula subtotal corretamente (quantity * unitPrice)
- [ ] Atualiza total do orçamento
- [ ] Retorna erro se quotationId inválido
- [ ] Retorna erro se productId inválido
- [ ] Sem autenticação retorna 401

**Test curl:**
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quotationId": "clp...",
    "productId": "clp...",
    "quantity": 2,
    "notes": "teste"
  }' \
  http://localhost:3000/api/quotation-items
```

### PUT /api/quotation-items/[id]
- [ ] Atualiza quantidade de item
- [ ] Atualiza unitPrice de item
- [ ] Recalcula subtotal
- [ ] Atualiza total do orçamento
- [ ] Retorna erro se item não existe (404)

### DELETE /api/quotation-items/[id]
- [ ] Remove item do orçamento
- [ ] Recalcula total do orçamento para 0 se último item
- [ ] Retorna sucesso (200)
- [ ] Retorna erro se item não existe (404)

## ✅ Testes Unitários dos Componentes

### ProductPicker.tsx
- [ ] Modal abre ao clicar botão "Adicionar Item"
- [ ] Busca por nome funciona em tempo real
- [ ] Filtro por tipo funciona
- [ ] Selecionar produto destaca com cor
- [ ] Campo de quantidade permite números decimais
- [ ] Subtotal calcula corretamente
- [ ] Botão "Adicionar Item" chamada callback com dados corretos
- [ ] Botão "Cancelar" fecha modal
- [ ] Tecla ESC fecha modal
- [ ] Tecla ENTER dispara adição

**Fluxo teste:**
1. Abrir página novo orçamento
2. Selecionar cliente
3. Clicar "+ Adicionar Item"
4. Digitar "chuv" no campo busca
5. Selecionar primeiro produto
6. Alterar quantidade para 2
7. Verificar subtotal
8. Clicar "Adicionar Item"
9. Verificar se apareceu na tabela

### QuotationItemsTable.tsx
- [ ] Exibe lista de items em tabela
- [ ] Colunas corretas: Nome, Qtd, Valor Unit., Subtotal, Ações
- [ ] Botão "Editar" abre modo edição inline
- [ ] Campo quantidade permite edição
- [ ] Campo unitPrice permite edição
- [ ] Botão "Salvar" chamada API PUT e atualiza
- [ ] Botão "Cancelar" fecha edição
- [ ] Botão "Remover" pede confirmação
- [ ] Após remover, item desaparece e total atualiza
- [ ] Mensagem vazia quando nenhum item

## ✅ Testes de Integração

### Fluxo Completo: Criar Orçamento com Itens
1. [ ] Ir para `/quotations/new`
2. [ ] Selecionar cliente
3. [ ] Adicionar 3 produtos diferentes via ProductPicker
4. [ ] Verificar que items aparecem na tabela
5. [ ] Editar quantidade do segundo item
6. [ ] Verificar total atualiza
7. [ ] Clicar "Salvar Orçamento"
8. [ ] Verificar se redirecionou para `[id]` page
9. [ ] Visualizar orçamento mostra todos os items
10. [ ] Total está correto

### Fluxo: Editar Item em Orçamento Existente
1. [ ] Abrir orçamento existente
2. [ ] Clicar "Editar" em um item
3. [ ] Alterar quantidade
4. [ ] Clicar "Salvar"
5. [ ] Verificar subtotal e total atualizaram

### Fluxo: Remover Item
1. [ ] Abrir orçamento com items
2. [ ] Clicar "Remover" em um item
3. [ ] Confirmar remoção
4. [ ] Verificar item desapareceu
5. [ ] Verificar total recalculou

## ✅ Testes de Performance

- [ ] ProductPicker com 1000 produtos carrega em < 200ms
- [ ] Adicionar item completa em < 500ms
- [ ] Editar quantidade completa em < 500ms
- [ ] Remover item completa em < 500ms
- [ ] Abrir orçamento com 50 items em < 1s

## ✅ Testes de Segurança

- [ ] Requisição sem token retorna 401
- [ ] Requisição com token inválido retorna 401
- [ ] Não conseguir acessar item de orçamento de outro usuário
- [ ] Não conseguir deletar produto em uso (409)
- [ ] Validação Zod bloqueia dados inválidos

## ✅ Testes de Erro Handling

### ProductPicker
- [ ] Busca que retorna 0 resultados mostra mensagem
- [ ] Erro de rede mostra mensagem
- [ ] Loading indicator aparece enquanto carrega

### QuotationItemsTable
- [ ] Erro ao salvar item exibe toast/alert
- [ ] Erro ao deletar item exibe mensagem de confirmação

### New Quotation Page
- [ ] Salvar sem cliente selecionado mostra alert
- [ ] Salvar sem items mostra alert
- [ ] Erro ao criar orçamento mostra mensagem

## ✅ Testes de Compatibilidade

- [ ] Orçamentos existentes (com JSON items) não quebram
- [ ] Dashboard continua funcionando
- [ ] Módulo de Garantias não foi afetado
- [ ] Módulo de Ordens de Serviço não foi afetado
- [ ] Módulo de Pagamentos não foi afetado

## ✅ Deploy & Produção

- [ ] Commits feitos e pushed
- [ ] CI/CD no GitHub passando
- [ ] Vercel detectou changes e rebuilding
- [ ] Variável `DATABASE_URL` configurada no Vercel
- [ ] Migração Prisma aplicada no banco de produção
- [ ] Health check: GET /api/health retorna 200
- [ ] Verificar logs de erro no Vercel (None esperado)

## ✅ Validação Final

- [ ] Listas de serviços com 50+ items
- [ ] Produtos com todos os tipos (SERVICO, PECA)
- [ ] Orçamentos com 1 a 100 items
- [ ] Total correto em orçamentos com múltiplos items
- [ ] Histórico de preços preservado

## 📝 Sign-off

- [ ] Desenvolvedor testou fluxo completo
- [ ] Usuário (Jose) validou funcionalidade
- [ ] Documentação atualizada
- [ ] Commit com tag version (v1.0.0) criado

---

## 🐛 Problemas Encontrados & Resoluções

| Problema | Solução | Status |
|----------|---------|--------|
| | | |

---

## 📞 Notas

```
Data da implementação: _______________
Testado por: _______________
Observações: 
```

---