# Plano de Rota Técnica: Revitalização e Integração dos Módulos (Click Marido CRM)

Este plano detalha as melhorias estéticas e funcionais que o Squad de Especialistas executará para transformar a interface do CRM (eliminando o visual genérico) e integrar todos os módulos operacionais com interações e botões dinâmicos.

---

## 🎨 DIRETRIZ VISUAL PREMIUM

- **Cores Tailored:** Tons de roxo profundo (`#6347F9`) como marca principal, verde esmeralda (`#1FAA63`) para status de sucesso/aprovado, e laranja vibrante (`#FB8500`) para alertas.
- **Glassmorphism e Sombras:** Aplicação de fundos translúcidos (`backdrop-blur-md bg-white/80`), bordas finas com baixo contraste e sombras suaves tridimensionais.
- **Animações de Transição:** Movimentos suaves de elevação ao passar o mouse em botões e cartões.
- **Shimmer Effects:** Indicadores visuais de carregamento em esqueleto para evitar telas piscando.

---

## 📅 CRONOGRAMA E PASSOS DE EXECUÇÃO

### PASSO 1: Resolução de Loops de Render (Telas Piscando)
1. Atualizar o hook `useAuth.js` utilizando `useCallback` para retornar referências estáveis de `getToken`, `login` e `logout`.
2. Remover os disparos concorrentes de `mutate()` nos `useEffect` da página de Clientes (`customers/page.tsx`) e Orçamentos (`quotations/page.tsx`).
3. Adicionar estados visuais de esqueleto de carregamento (*shimmers*).

### PASSO 2: Revitalização Estética do Dashboard
1. Redesenhar os cartões de estatísticas principais usando ícones dinâmicos em SVG e micro-animações de elevação.
2. Adicionar layout do tipo Bento Grid com agrupamento sofisticado para "Últimas Ordens" e "Top Serviços".

### PASSO 3: Revitalização e Expansão de Clientes e Orçamentos
1. **Clientes:** Exibir contatos, telefone e resumo do endereço cadastrado. Adicionar gaveta de detalhes lateral (Drawer).
2. **Orçamentos:** Adicionar no formulário de criação: Prazo de Execução, Tipo de Garantia (30 dias a 1 ano), Desconto/Acréscimo e Forma de Pagamento sugerida. Mudar chave do item de `name` para `description` no envio para a API passar no Zod.

### PASSO 4: Integração de Ações em Ordens de Serviço (OS)
1. Adicionar o botão "Criar Ordem Manual" que gera automaticamente um orçamento aprovado na API por baixo dos panos.
2. Adicionar links direcionando o usuário para o Cliente associado e para o Orçamento de origem.

### PASSO 5: Integração de Ações em Pagamentos
1. Adicionar botão "Registrar Recebimento Manual".
2. Integrar links na tabela de pagamentos para visualizar Cliente e Ordens de Serviço.
3. Adicionar botão para compartilhar PIX rapidamente via WhatsApp Web do cliente.

### PASSO 6: Integração de Ações em Garantias
1. Adicionar botão de acionamento de garantia.
2. Ao acionar a garantia, criar de forma automática no backend uma nova Ordem de Serviço de reparo sem custo (R$ 0,00) associada ao cliente.
3. Adicionar links para Clientes e Orçamentos.

### PASSO 7: Validação e Compilação
1. Executar `npm run build` na pasta `frontend/`.

---

## 💎 CRITÉRIOS DE ACEITAÇÃO (Estilo Diamante)
- **Zero oscilações:** As páginas de Clientes e Orçamentos devem carregar sem loops de re-render.
- **Fidelidade Visual Premium:** O visual deve ser impactante e moderno.
- **Fluxo Integrado:** Ações em Garantias e OS devem atualizar e criar registros dinâmicos correspondentes sem quebras.
