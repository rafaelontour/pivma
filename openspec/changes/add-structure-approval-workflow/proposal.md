## Why

A BraCVAM precisa revisar a composição, as designações e a definição de amostras antes da execução, inclusive devolver pontos específicos para correção sem apagar o histórico. A API já publica o painel e as decisões, mas o frontend ainda não apresenta essa homologação.

## What Changes

- Criar um painel por processo com o status da homologação, pontos estruturais, designações, contagens de amostras, pendências e bloqueios.
- Permitir à BraCVAM aprovar ou rejeitar a estrutura com justificativa e seleção dos pontos rejeitados.
- Exibir o histórico de decisões da mais recente para a mais antiga.
- Refletir atividades reabertas ou devolvidas pela API e conduzir cada responsável ao espaço de correção correspondente.
- Atualizar o Kanban e as tarefas após cada decisão sem alterar estado do processo no cliente.

## Capabilities

### New Capabilities

- `process-structure-approval`: consulta, aprovação, rejeição pontual, histórico e retomada da homologação estrutural do processo.

### Modified Capabilities

Nenhuma.

## Impact

- Novos tipos, serviço server-only, Route Handlers e workspace de homologação em `/processos/[processId]`.
- Integração com `/processes/{id}/structure-approval*`, tarefas e Kanban.
- Autorização de decisão exclusiva da BraCVAM e leitura limitada aos participantes autorizados.
- Conteúdo controlado disponível em português e inglês.
