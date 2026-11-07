## Context

A API publica mutações específicas para dispensar um laboratório de uma fase e reabrir uma atividade laboratorial. O frontend já lista tarefas e processos, mas não possui um modelo de execução por laboratório nem controles administrativos para essas operações.

## Goals / Non-Goals

**Goals:**

- Contextualizar as mutações com identificadores validados no servidor.
- Exigir justificativa, confirmação e reconciliação.
- Refletir novas rodadas sem alterar o histórico anterior.

**Non-Goals:**

- Criar fases ou atividades.
- Mover cartões manualmente no Kanban.
- Permitir que laboratórios concedam a própria dispensa ou reabertura.

## Decisions

### 1. Controles no detalhe do processo

As ações ficarão próximas das tarefas e execuções correspondentes. Uma página administrativa separada aumentaria o risco de operar o processo errado.

### 2. Identificadores vêm do snapshot

Fase, atividade e laboratório serão selecionados entre itens retornados pela API. Route Handlers validarão UUIDs e chaves antes da mutação.

### 3. Diálogos separados por operação

Dispensa e reabertura possuem efeitos diferentes e terão confirmações próprias. Ambas exigirão motivo não vazio e bloquearão concorrência local.

### 4. API controla a nova execução

O frontend não incrementará rodada nem alterará tarefa. Após sucesso, recarregará tarefas, processo e detalhes operacionais.

### 5. Histórico permanece somente leitura

Execuções anteriores não serão substituídas. Quando o contrato não fornecer uma listagem histórica específica, a interface apresentará apenas os eventos disponíveis em tarefas e timeline.

## Risks / Trade-offs

- [Não há endpoint agregado próprio para todos os controles] → compor o contexto apenas com tarefas e detalhes já publicados, sem fabricar estado.
- [Operações podem ficar obsoletas entre abertura e confirmação] → tratar conflito e reconsultar.
- [Autorização não possui extensão OpenAPI explícita] → validar com sessão BraCVAM real antes de habilitar controles.

## Migration Plan

1. Tipar respostas e criar rotas internas sem controles visíveis.
2. Exibir contexto somente leitura.
3. Validar autorização e habilitar dispensa.
4. Habilitar reabertura e revalidação do Kanban.
5. Em rollback, ocultar ações; mutações já aceitas permanecem auditáveis.
