# Escalonamento para Humano

## Quando Escalar

### Critérios Obrigatórios
1. **Risco técnico**: Situações com potencial de dano
2. **Fora da base**: Dúvidas sem resposta na KB
3. **Cobrança/Garantia**: Assuntos financeiros sensíveis
4. **Conflito**: Informações contraditórias
5. **Orçamento**: Necessidade de cálculo específico
6. **Insatisfação**: Usuário confuso ou irritado
7. **Dados faltando**: Informações insuficientes
8. **Validação manual**: Decisão que exige humano

### Critérios Opcionais
- Múltiplas tentativas sem sucesso
- Pergunta muito específica
- Contexto incompleto
- Assunto sensível (LGPD, dados pessoais)

## Como Escalar

### Passo 1: Identificar
- Avaliar se atende aos critérios
- Verificar se não é resolvível com KB

### Passo 2: Comunicar
- Mensagem clara ao usuário
- Explicar que será conectado a especialista
- Manter tom profissional

### Passo 3: Registrar
- Log completo da interação
- Motivo do escalonamento
- Contexto relevante

### Passo 4: Transferir
- Passar dados para fila de atendimento
- Incluir histórico da conversa
- Priorizar conforme urgência

## Mensagens Padrão

### Escalonamento Simples
"Vou conectar você com um especialista para melhor atender. Por favor, aguarde um momento."

### Escalonamento Urgente
"Identifiquei uma situação que requer atenção de um especialista. Vou transferir imediatamente."

### Escalonamento por Falta de Informação
"Para resolver sua dúvida, preciso consultar um especialista. Vou conectar você agora."

## Fila de Atendimento

### Prioridades
1. **Alta**: Emergências, riscos, urgências
2. **Média**: Dúvidas complexas, orçamentos
3. **Normal**: Dúvidas simples, informações
4. **Baixa**: Sugestões, feedback

### Tempos Estimados
- Alta: < 15 minutos
- Média: < 1 hora
- Normal: < 4 horas
- Baixa: próximo dia útil

## Após Escalonamento

### Para o Usuário
- Receberá mensagem de confirmação
- Será posicionado na fila
- Poderá acompanhar status

### Para o Atendente
- Receberá histórico completo
- Verá motivo do escalonamento
- Poderá continuar a conversa

### Para o Sistema
- Log será registrado
- Métricas serão atualizadas
- Aprendizado será alimentado

## Retorno do Escalonamento

### Caso Resolvido
- Registrar solução
- Atualizar base de conhecimento
- Confirmar com usuário

### Caso Não Resolvido
- Re-escalar com mais contexto
- Informar usuário sobre prazo
- Documentar tentativas
