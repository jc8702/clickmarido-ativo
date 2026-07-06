# Fluxos Operacionais

## Fluxo Principal: Captação até Pagamento

### 1. Captação de Cliente
```
Novo contato → Cadastro no sistema → Qualificação → Orçamento
```

### 2. Orçamento
```
Criação → Envio → Análise pelo cliente → Aceito/Rejeitado
                                    ↓
                              Expirou (7 dias)
```

### 3. Ordem de Serviço (OS)
```
Orçamento aprovado → OS criada → Técnico designado → Agendamento
                                                     ↓
                                              Execução → Fotos
                                                     ↓
                                              Conclusão → Pagamento
```

### 4. Pagamento
```
Pagamento gerado → Envio de cobrança → Recebimento → Confirmação
                                    ↓
                              Lembrete (3+ dias)
```

## Fluxos Detalhados

### Fluxo de Orçamento
1. **Rascunho**: Orçamento criado, pode ser editado
2. **Enviado**: Enviado ao cliente (email/WhatsApp)
3. **Aceito**: Cliente aprovou → gera OS automaticamente
4. **Rejeitado**: Cliente recusou
5. **Expirado**: 7 dias sem resposta

### Fluxo de OS
1. **Agendada**: OS criada com data/hora
2. **Em Progresso**: Técnico iniciou o serviço
3. **Concluída**: Serviço finalizado
4. **Cancelada**: OS cancelada

### Fluxo de Pagamento
1. **Pendente**: Pagamento gerado, aguardando
2. **Confirmado**: Pagamento recebido
3. **Cancelado**: Pagamento cancelado
4. **Devolvido**: Valor devolvido

## Automações

### Criação Automática
- Orçamento aprovado → Cria OS
- OS concluída → Cria pagamento pendente

### Notificações
- Orçamento enviado → Notifica cliente
- OS criada → Notifica técnico
- Pagamento pendente → Lembrete ao cliente
- Garantia vencendo → Notifica cliente

### Cron Jobs
- Verificação de orçamentos expirados (08:00/dia)
- Verificação de garantias vencendo (09:00/dia)
- Lembretes de pagamento (10:00/dia)
- Relatório diário (18:00/dia)

## Regras de Negócio

### Orçamentos
- Expiram após 7 dias sem resposta
- Aprovação gera OS automaticamente
- Rejeição envia notificação

### OS
- Número sequencial automático (OS-0001, OS-0002...)
- Conclusão gera pagamento pendente
- Fotos são registradas durante execução

### Pagamentos
- Lembrete automático após 3 dias pendente
- PIX gera código copia-e-cola
- Boleto pode ser gerado via Mercado Pago

## Exceções e Escalonamento

### Quando Escalar para Humano
- Dúvida fora da base
- Risco técnico
- Cobrança ou garantia
- Conflito de informações
- Necessidade de orçamento
- Usuário confuso/irritado

### Mensagem Padrão
"Vou conectar você com um especialista para melhor atender. Por favor, aguarde um momento."
