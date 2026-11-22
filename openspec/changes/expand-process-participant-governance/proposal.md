## Why

O frontend cobre apenas a composição inicial de patrocinador, grupo gestor e laboratório participante, enquanto a API já publica todos os cargos locais, revogação, conflitos, histórico e conclusão explícita das atribuições. Sem uma governança completa, patrocinadores e gestores não encontram seus processos e a BraCVAM não consegue corrigir substituições durante a execução.

## What Changes

- Ampliar a composição para todos os cargos locais publicados pela API, respeitando quem pode atribuir cada papel e quando a tarefa correspondente está acionável.
- Permitir consultar, revogar e substituir designações, declarar conflitos e concluir a atribuição de um cargo.
- Apresentar o histórico auditável de participantes e convites, incluindo reenvio e revogação de convites pendentes.
- Dar ao patrocinador uma área própria de acompanhamento dos projetos patrocinados, sem acesso ao Kanban, e manter a descoberta autorizada dos processos para os demais participantes.
- Dar ao grupo gestor itens próprios de navegação para consultar seus integrantes e os processos associados com a etapa atual.
- Aplicar a cada cargo um perfil visual próprio no shell autenticado, com cor, ícone, nome e descrição coerentes com o papel efetivo da sessão.
- Restringir o módulo efetivo Proponente a Início e Submissões, bloqueando também a abertura direta de qualquer outra página autenticada.
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
