## Context

O endpoint de homologação agrega pontos de atividades, designações, contagens de amostras, pendências e decisões. A decisão aceita `APPROVED` ou `REJECTED`, com justificativa e pontos rejeitados. O backend é responsável por reabrir atividades e criar novas execuções.

## Goals / Non-Goals

**Goals:**

- Apresentar o agregado sem reconstruí-lo a partir de chamadas independentes.
- Registrar decisões pontuais e refletir as atividades reabertas.
- Preservar histórico entre rodadas.

**Non-Goals:**

- Editar participantes ou amostras dentro do painel da BraCVAM.
- Escolher manualmente a próxima fase.
- Apagar decisões anteriores.

## Decisions

### 1. O painel agregado é a fonte de verdade

O frontend consumirá `/structure-approval` diretamente. Participantes e amostras poderão ser abertos em seus workspaces, mas não serão usados para recalcular pendências.

### 2. Rejeição usa seleção explícita de pontos

Cada ponto renderizado manterá seu identificador técnico. O diálogo exigirá justificativa e seleção compatível antes do envio.

### 3. Correções acontecem nos workspaces de origem

Após rejeição, tarefas indicarão responsáveis e destinos. Links serão derivados do tipo da atividade; a BraCVAM não editará dados em nome deles.

### 4. Histórico faz parte do mesmo snapshot

Decisões serão exibidas na ordem retornada, identificando rodada e resultado. Não haverá mescla com o histórico de triagem.

### 5. Revalidação coordenada

Uma decisão aceita dispara reconsulta do painel, tarefas e processo. Falha de reconsulta marca estado desatualizado sem repetir a decisão.

## Risks / Trade-offs

- [Novos tipos de ponto podem surgir] → renderizar fallback somente leitura e impedir rejeição específica até haver suporte tipado.
- [A listagem de processos pode falhar] → acesso direto por tarefa e `processId` continua disponível.
- [Decisão é sensível à concorrência] → bloquear envio em voo e tratar conflito com reconsulta.

## Migration Plan

1. Implementar painel somente leitura e histórico.
2. Validar acesso com BraCVAM e participantes.
3. Habilitar aprovação e rejeição.
4. Integrar destinos de correção e Kanban.
5. Em rollback, ocultar decisões; o histórico externo permanece preservado.
