diff --git a/automacoes/PLANO_VARREDURA_MELHORIAS_FINANCEIRO_OPERACIONAL.md b/automacoes/PLANO_VARREDURA_MELHORIAS_FINANCEIRO_OPERACIONAL.md
new file mode 100644
index 0000000000000000000000000000000000000000..05ab8f92edc7827ba97a1e3fd103ac263774a8ff
--- /dev/null
+++ b/automacoes/PLANO_VARREDURA_MELHORIAS_FINANCEIRO_OPERACIONAL.md
@@ -0,0 +1,393 @@
+# Plano de Varredura, Melhorias, Integrações e Qualidade — Click Marido
+
+**Data:** 2026-06-22  
+**Objetivo:** orientar agentes de IA a fazerem uma varredura completa nos módulos operacionais e financeiros, corrigindo ações quebradas, padronizando janelas/cards, adicionando categorias e centros de custo, e criando testes para evitar regressões.
+
+---
+
+## 1. Problemas relatados e módulos impactados
+
+| Tema | Problema relatado | Área provável | Prioridade |
+|---|---|---|---|
+| ESC em janelas/cards | Em Serviços e Peças não sai com `ESC`; verificar todos os módulos, cards, modais, drawers e janelas | `frontend/components/Modal.tsx`, páginas em `frontend/app/(dashboard)` e componentes com drawer/modal | Alta |
+| Categoria Ferramentas | Compras de ferramentas devem ficar separadas | Produtos, fornecedores, despesas, compras, DRE | Alta |
+| Centros de custo | Separar corretamente no DRE | Despesas, compras, transações financeiras, dashboard financeiro | Alta |
+| Painel financeiro | Não atualiza ou está desatualizado | `frontend/app/(dashboard)/financial/page.tsx`, `frontend/app/api/financial/dashboard/route.ts` | Alta |
+| Faturamento | Itens adicionados manualmente não abrem para baixar como paga | Faturas, pagamentos, itens manuais, fluxo de baixa | Alta |
+| Despesas | Não marca como paga, não edita e não exclui | `frontend/app/(dashboard)/expenses/page.tsx`, `frontend/app/api/expenses/[id]/route.ts` | Alta |
+| Qualidade geral | Cada uso revela novas correções | Testes E2E, integração, contratos API, auditoria UX | Contínua |
+
+---
+
+## 2. Diagnóstico inicial do repositório
+
+### 2.1 ESC e fechamento de janelas
+
+Existe um componente global `Modal` que bloqueia o scroll e fecha ao clicar no backdrop, mas ainda não trata `Escape` internamente. Isso força páginas a implementarem `keydown` manualmente e cria comportamento inconsistente.
+
+**Ação recomendada:** implementar fechamento por `Escape` no `Modal` global, com opção futura `closeOnEscape`, e remover handlers duplicados apenas depois de confirmar que não há conflito.
+
+### 2.2 Despesas
+
+A API já expõe `PUT /api/expenses/[id]`, `POST /api/expenses/[id]/mark-paid` e `DELETE /api/expenses/[id]`/cancelamento conforme implementação da rota, mas a tela de despesas só apresenta criação e botão de marcar paga. Falta interface de editar/excluir e precisa validar se o endpoint usado para marcar paga bate exatamente com a rota existente.
+
+**Ação recomendada:** criar drawer/modal de edição de despesa, botão excluir/cancelar, confirmação, toast e recarregamento otimista ou via `fetchExpenses`.
+
+### 2.3 Categorias e DRE
+
+Categorias aparecem em vários pontos como strings soltas ou enums de validação. Hoje há categorias como `MATERIAL`, `SERVICO`, `TRANSPORTE`, `ALUGUEL`, `UTILITIES`, `EQUIPAMENTO`, `TERCEIRIZADO` e `OUTROS`, mas não há `FERRAMENTAS` padronizado em todos os fluxos.
+
+**Ação recomendada:** criar fonte única para categorias e centros de custo, reaproveitada por schema, formulários e relatórios.
+
+### 2.4 Painel financeiro
+
+O painel financeiro carrega `/api/financial/dashboard` apenas no primeiro render e ao clicar em recarregar. Se outras telas alteram despesas, pagamentos ou faturamento, o painel pode parecer defasado ao voltar para ele.
+
+**Ação recomendada:** adicionar estratégia de atualização: `router.refresh`, `visibilitychange`, refresh ao focar a aba, cache-control sem cache na API e indicador de última atualização.
+
+---
+
+## 3. Plano de execução por fases
+
+### Fase 0 — Preparação e segurança
+
+1. Rodar typecheck/lint/testes atuais para capturar baseline.
+2. Criar lista de rotas e telas com modal/drawer/card clicável.
+3. Confirmar o formato real de status financeiro: `pendente`, `paga`, `cancelada`, `approved`, `paid`, etc.
+4. Criar plano de migração Prisma para qualquer campo novo, sem destruir dados.
+5. Evitar credenciais em commits; não alterar `.env.local`.
+
+**Critérios de aceite:** baseline documentado e nenhum dado existente perdido.
+
+---
+
+### Fase 1 — Padronização de modais, drawers e ESC
+
+1. Implementar `Escape` no `frontend/components/Modal.tsx`.
+2. Garantir que o clique dentro do modal não propague para o backdrop.
+3. Criar ou padronizar um hook `useEscapeToClose` para drawers que não usam `Modal`.
+4. Varredura obrigatória em:
+   - Serviços e Peças / Produtos
+   - Clientes
+   - Orçamentos
+   - Ordens de Serviço
+   - Pagamentos
+   - Garantias
+   - Financeiro
+   - Faturamento
+   - Despesas
+   - Compras
+   - Fornecedores
+5. Testar `ESC`, clique no backdrop, botão fechar e botão cancelar.
+
+**Critérios de aceite:** qualquer janela aberta fecha com `ESC`, exceto quando houver bloqueio explícito e documentado.
+
+---
+
+### Fase 2 — Categoria `FERRAMENTAS`
+
+1. Adicionar `FERRAMENTAS` em validações, selects e filtros de:
+   - Produtos / Serviços e Peças
+   - Despesas
+   - Fornecedores
+   - Compras
+   - Relatórios financeiros
+2. Atualizar comentários e seeds que listam categorias.
+3. Garantir que compras aprovadas gerem despesas com categoria `FERRAMENTAS` quando o fornecedor ou item for desse tipo.
+4. Adicionar filtro e exibição amigável: `Ferramentas`.
+
+**Critérios de aceite:** uma compra/despesa de ferramenta aparece separada de material/equipamento e entra corretamente no DRE.
+
+---
+
+### Fase 3 — Centros de custo para DRE
+
+Sugestão inicial de centros de custo:
+
+| Código | Nome | Uso |
+|---|---|---|
+| `OPERACIONAL` | Operacional | Gastos diretos dos serviços |
+| `ADMINISTRATIVO` | Administrativo | Backoffice, escritório e gestão |
+| `COMERCIAL` | Comercial | Vendas, marketing, prospecção |
+| `FERRAMENTAS` | Ferramentas | Compra/manutenção de ferramentas |
+| `VEICULOS` | Veículos e deslocamento | Combustível, manutenção e transporte |
+| `TERCEIROS` | Terceiros | Mão de obra terceirizada |
+| `IMPOSTOS_TAXAS` | Impostos e taxas | Tributos, tarifas, taxas financeiras |
+| `OUTROS` | Outros | Classificação provisória |
+
+Ações:
+
+1. Criar fonte única `frontend/lib/finance-options.ts` com categorias e centros de custo.
+2. Adicionar `costCenter` onde faltar, especialmente `Expense` e formulários de despesa.
+3. Atualizar APIs para aceitar e persistir `costCenter`.
+4. Atualizar DRE/painel financeiro para agrupar despesas por centro de custo.
+5. Validar migração Prisma se o campo ainda não existir em algum modelo.
+
+**Critérios de aceite:** DRE mostra total por categoria e por centro de custo, com filtros.
+
+---
+
+### Fase 4 — Painel financeiro sempre atualizado
+
+1. Revisar `/api/financial/dashboard` para calcular:
+   - saldo consolidado com pagamentos pagos menos despesas pagas;
+   - previsão com recebíveis e despesas pendentes;
+   - entradas/saídas do dia;
+   - agrupamentos por categoria e centro de custo;
+   - últimos recebimentos e últimas despesas.
+2. Adicionar `export const dynamic = 'force-dynamic'` e cabeçalhos `Cache-Control: no-store` onde fizer sentido.
+3. No front, atualizar em:
+   - montagem da página;
+   - clique em recarregar;
+   - retorno de foco/visibilidade da aba;
+   - depois de ações financeiras críticas em outras telas, se houver store/evento global.
+4. Mostrar `Última atualização: HH:mm:ss`.
+5. Tratar erro com mensagem clara e botão tentar novamente.
+
+**Critérios de aceite:** ao marcar uma despesa como paga ou baixar um recebimento, o painel reflete a alteração ao voltar/focar/recarregar.
+
+---
+
+### Fase 5 — Faturamento e baixa de itens manuais
+
+1. Mapear a diferença entre fatura, pagamento e item manual.
+2. Garantir que todo item manual tenha identificador, valor, status e vínculo com fatura/pagamento quando aplicável.
+3. Criar ação “Abrir / Baixar como paga” para itens manuais.
+4. Implementar fluxo:
+   - abrir detalhes do item;
+   - escolher data de pagamento, método e observação;
+   - criar/atualizar `Payment`;
+   - atualizar status da fatura/item;
+   - refletir no financeiro.
+5. Adicionar testes para item manual, fatura gerada por orçamento e baixa parcial/total.
+
+**Critérios de aceite:** itens manuais deixam de ficar “travados” e podem ser baixados como pagos com rastreabilidade.
+
+---
+
+### Fase 6 — Despesas: pagar, editar e excluir
+
+1. Conferir contrato de `GET/POST/PUT/DELETE /api/expenses`.
+2. Na tela de despesas, adicionar:
+   - botão editar;
+   - botão excluir/cancelar;
+   - botão marcar paga;
+   - modal de confirmação;
+   - campos de categoria, centro de custo, data, valor, status, observações e fornecedor/compra se existir.
+3. Corrigir endpoint de “marcar paga” caso esteja incompatível.
+4. Garantir atualização do painel financeiro após alteração.
+5. Adicionar testes cobrindo CRUD completo.
+
+**Critérios de aceite:** despesa pode ser criada, editada, marcada como paga e excluída/cancelada pela interface.
+
+---
+
+### Fase 7 — Integrações e automatizações
+
+Automatizações recomendadas:
+
+1. Compra aprovada → gera despesa pendente com categoria e centro de custo herdados.
+2. Despesa paga → cria transação financeira de saída.
+3. Pagamento recebido → cria transação financeira de entrada.
+4. Fatura paga → atualiza status de fatura e pagamento.
+5. Ordem de serviço concluída → sugere/gera cobrança quando não existir pagamento.
+6. Dashboard financeiro → recalcula a partir de fontes canônicas, não de estados duplicados.
+7. Auditoria → registrar quem alterou, quando e antes/depois para ações financeiras.
+
+**Critérios de aceite:** nenhuma ação financeira importante fica isolada sem refletir nos relatórios.
+
+---
+
+### Fase 8 — Testes, qualidade e regressão
+
+1. Unitários para funções de opções financeiras, cálculo de DRE e formatação.
+2. Integração/API para despesas, pagamentos, faturamento, financeiro e compras.
+3. E2E para fluxos críticos:
+   - criar despesa → editar → marcar paga → painel atualiza;
+   - criar ferramenta em compra/despesa → DRE agrupa em `FERRAMENTAS`;
+   - abrir modal/drawer em cada módulo → `ESC` fecha;
+   - faturamento manual → baixar como pago → painel atualiza.
+4. Typecheck e lint obrigatórios antes de PR.
+5. Screenshots das principais telas alteradas.
+
+**Critérios de aceite:** PR só deve ser aberto com checklist de teste executado ou justificativa de limitação ambiental.
+
+---
+
+## 4. Prompts prontos para agentes
+
+### Prompt A — Auditoria de ESC, modais, cards e janelas
+
+```text
+Você está no repositório /workspace/clickmarido-ativo. Responda em português brasileiro.
+
+Objetivo: fazer uma varredura completa de todos os módulos, cards, modais, drawers e janelas para garantir que `ESC` fecha a interface aberta de forma consistente.
+
+Tarefas:
+1. Leia AGENTS.md e siga as instruções.
+2. Mapeie todos os usos de Modal, drawer, `activeModalId`, `isOpen`, `selected*`, `onKeyDown`, `keydown`, `Escape` e componentes de detalhes.
+3. Implemente fechamento por Escape no componente global Modal, sem quebrar backdrop/cancelar.
+4. Para drawers que não usam Modal, crie/aplique hook reutilizável `useEscapeToClose`.
+5. Valide os módulos: Serviços e Peças/Produtos, Clientes, Orçamentos, Ordens de Serviço, Pagamentos, Garantias, Financeiro, Faturamento, Despesas, Compras e Fornecedores.
+6. Adicione testes quando a estrutura permitir.
+7. Rode typecheck/lint/testes disponíveis.
+8. Faça commit com mensagem em PT-BR e descreva arquivos alterados.
+
+Critérios de aceite:
+- Toda janela/drawer fecha com ESC.
+- Clique dentro do modal não fecha acidentalmente.
+- Clique no backdrop continua funcionando onde já funcionava.
+- Não há listeners vazando após desmontagem.
+```
+
+### Prompt B — Categoria Ferramentas e centros de custo no DRE
+
+```text
+Você está no repositório /workspace/clickmarido-ativo. Responda em português brasileiro.
+
+Objetivo: criar a categoria `FERRAMENTAS` e centros de custo padronizados para compras, despesas, produtos/serviços e DRE.
+
+Tarefas:
+1. Localize todos os pontos com categorias hardcoded ou enums de validação.
+2. Crie uma fonte única de opções financeiras, por exemplo `frontend/lib/finance-options.ts`, contendo categorias e centros de custo com label PT-BR.
+3. Inclua `FERRAMENTAS` em despesas, fornecedores, compras, produtos/serviços e relatórios.
+4. Adicione centros de custo sugeridos: OPERACIONAL, ADMINISTRATIVO, COMERCIAL, FERRAMENTAS, VEICULOS, TERCEIROS, IMPOSTOS_TAXAS, OUTROS.
+5. Atualize Prisma e migrações se algum modelo necessário ainda não tiver `costCenter`.
+6. Atualize formulários, filtros, validações e APIs para persistir/retornar centro de custo.
+7. Atualize o painel/DRE para agrupar por categoria e centro de custo.
+8. Rode Prisma generate/migrate quando aplicável, typecheck/lint/testes.
+9. Faça commit com mensagem em PT-BR.
+
+Critérios de aceite:
+- Ferramentas não se mistura com Material ou Equipamento.
+- DRE mostra separação por categoria e centro de custo.
+- Compra aprovada herda categoria/centro de custo para despesa/transação.
+```
+
+### Prompt C — Corrigir painel financeiro desatualizado
+
+```text
+Você está no repositório /workspace/clickmarido-ativo. Responda em português brasileiro.
+
+Objetivo: garantir que o Painel Financeiro atualize corretamente após pagamentos, despesas e faturamento.
+
+Tarefas:
+1. Audite `frontend/app/(dashboard)/financial/page.tsx` e `frontend/app/api/financial/dashboard/route.ts`.
+2. Verifique se há cache indevido em Next.js/API/fetch/axios.
+3. Force dados dinâmicos quando necessário (`no-store`, `dynamic = force-dynamic`, headers).
+4. Adicione atualização ao focar/voltar para a aba (`visibilitychange`/`focus`) e botão recarregar com loading claro.
+5. Mostre horário de última atualização.
+6. Confirme que despesas pagas, pagamentos aprovados e faturas baixadas entram no cálculo correto.
+7. Adicione agrupamentos por categoria e centro de custo se ainda não existirem.
+8. Crie testes de API para os cálculos centrais.
+9. Rode typecheck/lint/testes e faça commit em PT-BR.
+
+Critérios de aceite:
+- Ao marcar despesa como paga, o painel reflete a saída.
+- Ao aprovar/baixar pagamento, o painel reflete a entrada.
+- Não há dados obsoletos por cache.
+```
+
+### Prompt D — Faturamento: abrir itens manuais e baixar como paga
+
+```text
+Você está no repositório /workspace/clickmarido-ativo. Responda em português brasileiro.
+
+Objetivo: corrigir o módulo Faturamento para permitir abrir itens adicionados manualmente e dar baixa como paga.
+
+Tarefas:
+1. Mapeie modelos e APIs de invoices, payments e itens manuais.
+2. Identifique por que itens manuais não abrem: ausência de ID, rota, handler, modal ou vínculo financeiro.
+3. Implemente ação de abrir detalhes para item manual.
+4. Implemente baixa como paga com data, método, valor e observação.
+5. Atualize invoice/payment/status de forma transacional.
+6. Garanta atualização do painel financeiro após a baixa.
+7. Adicione estados de erro/sucesso e confirmação visual.
+8. Crie testes para item manual pago, item manual pendente e baixa parcial/total se existir.
+9. Rode typecheck/lint/testes e faça commit em PT-BR.
+
+Critérios de aceite:
+- Item manual abre em modal/drawer.
+- Item manual pode ser marcado como pago.
+- Baixa aparece em pagamentos/financeiro.
+```
+
+### Prompt E — Despesas: CRUD completo e baixa como paga
+
+```text
+Você está no repositório /workspace/clickmarido-ativo. Responda em português brasileiro.
+
+Objetivo: corrigir o módulo Despesas para criar, editar, excluir/cancelar e marcar como paga pela interface.
+
+Tarefas:
+1. Audite `frontend/app/(dashboard)/expenses/page.tsx` e as rotas `frontend/app/api/expenses`.
+2. Confirme métodos existentes: listar, criar, editar, excluir/cancelar, marcar paga.
+3. Corrija endpoints incompatíveis entre front e API.
+4. Adicione modal de edição com categoria, centro de custo, descrição, valor, data, status e observações.
+5. Adicione confirmação para excluir/cancelar.
+6. Adicione feedback visual com toast/alert padronizado e recarregamento.
+7. Garanta que despesa paga atualize DRE/painel financeiro.
+8. Adicione testes para criar, editar, marcar paga e excluir/cancelar.
+9. Rode typecheck/lint/testes e faça commit em PT-BR.
+
+Critérios de aceite:
+- Botão Marcar Paga funciona.
+- Botão Editar funciona e persiste.
+- Botão Excluir/Cancelar funciona sem quebrar histórico financeiro.
+- Painel financeiro reflete alterações.
+```
+
+### Prompt F — Varredura geral de qualidade e automações ponta a ponta
+
+```text
+Você está no repositório /workspace/clickmarido-ativo. Responda em português brasileiro.
+
+Objetivo: fazer uma auditoria ponta a ponta das funcionalidades do CRM Click Marido, encontrando inconsistências, ações sem efeito, integrações quebradas e pontos de automação.
+
+Tarefas:
+1. Liste todos os módulos do dashboard e seus fluxos principais.
+2. Para cada módulo, verifique botões, cards, menus, modais, formulários, APIs chamadas e atualização de tela.
+3. Monte uma matriz: módulo, ação, endpoint, entidade afetada, status atual, bug encontrado, correção sugerida, teste necessário.
+4. Corrija primeiro bugs bloqueantes e ações sem efeito.
+5. Proponha automações para reduzir cliques manuais, principalmente entre orçamento, OS, compra, despesa, faturamento e pagamento.
+6. Adicione testes E2E ou documentação de teste manual quando E2E ainda não estiver configurado.
+7. Rode typecheck/lint/testes disponíveis.
+8. Gere relatório em Markdown dentro de `automacoes/` e faça commit em PT-BR.
+
+Critérios de aceite:
+- Nenhum botão crítico sem ação funcional.
+- Fluxos financeiros refletem em DRE/painel.
+- Relatório indica o que foi corrigido, o que ficou pendente e próximos prompts.
+```
+
+---
+
+## 5. Checklist de QA manual por módulo
+
+| Módulo | Abrir | Editar | Excluir/Cancelar | Marcar pago/baixar | ESC fecha | Atualiza financeiro |
+|---|---:|---:|---:|---:|---:|---:|
+| Serviços e Peças | ☐ | ☐ | ☐ | N/A | ☐ | ☐ |
+| Clientes | ☐ | ☐ | ☐ | N/A | ☐ | N/A |
+| Orçamentos | ☐ | ☐ | ☐ | N/A | ☐ | ☐ |
+| Ordens de Serviço | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
+| Pagamentos | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
+| Garantias | ☐ | ☐ | ☐ | N/A | ☐ | ☐ |
+| Financeiro | ☐ | N/A | N/A | N/A | ☐ | ☐ |
+| Faturamento | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
+| Despesas | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
+| Compras | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
+| Fornecedores | ☐ | ☐ | ☐ | N/A | ☐ | ☐ |
+
+---
+
+## 6. Definition of Done para cada PR
+
+- [ ] Código em PT-BR onde for comunicação/documentação.
+- [ ] Sem credenciais ou `.env.local` no commit.
+- [ ] Typecheck executado.
+- [ ] Lint executado, se configurado.
+- [ ] Testes unitários/integração/E2E executados ou limitação documentada.
+- [ ] Screenshot anexado/gerado quando houver mudança perceptível em web app.
+- [ ] Migração Prisma revisada quando houver alteração de schema.
+- [ ] Commit em português brasileiro.
+- [ ] PR descreve resumo, testes e riscos.
