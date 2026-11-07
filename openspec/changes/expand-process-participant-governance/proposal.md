## Why

O frontend cobre apenas a composição inicial de patrocinador, grupo gestor e laboratório participante, enquanto a API já publica todos os cargos locais, revogação, conflitos, histórico e conclusão explícita das atribuições. Sem uma governança completa, patrocinadores e gestores não encontram seus processos e a BraCVAM não consegue corrigir substituições durante a execução.

## What Changes

- Ampliar a composição para todos os cargos locais publicados pela API, respeitando quem pode atribuir cada papel e quando a tarefa correspondente está acionável.
- Permitir consultar, revogar e substituir designações, declarar conflitos e concluir a atribuição de um cargo.
- Apresentar o histórico auditável de participantes e convites, incluindo reenvio e revogação de convites pendentes.
- Dar a patrocinador, grupo gestor e demais participantes acesso de leitura aos processos dos seus escopos.
- Criar uma visão administrativa da BraCVAM para ajustes autorizados sem apagar histórico.

## Capabilities

### New Capabilities

- `process-participant-governance`: gestão completa de cargos locais, convites, conflitos, revogações, conclusão e histórico das participações de um processo.

### Modified Capabilities

Nenhuma.

## Impact

- Novos contratos em `types/`, serviços server-only e Route Handlers para participantes, histórico, conflitos e convites.
- Ampliação de `/processos/[processId]/composicao`, navegação autenticada, Kanban e autorização por escopo.
- Integração com os endpoints `/processes/{process_id}/participants*` e tarefas atuais.
- Novos textos simultâneos em `pt-BR` e `en`.
