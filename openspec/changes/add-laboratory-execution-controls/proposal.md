## Why

Durante a execução, a BraCVAM precisa dispensar laboratórios de fases específicas e reabrir execuções quando houver correção ou repetição autorizada. Esses controles existem na API, mas ainda não podem ser acionados nem auditados pelo frontend.

## What Changes

- Exibir as execuções por fase, atividade e laboratório no contexto do processo.
- Permitir registrar uma dispensa de laboratório para uma fase com justificativa.
- Permitir reabrir a execução de uma atividade para um laboratório com motivo explícito.
- Atualizar tarefas e Kanban somente com o estado devolvido pela API.
- Restringir os controles à BraCVAM e manter participantes locais em modo de consulta quando aplicável.

## Capabilities

### New Capabilities

- `laboratory-execution-controls`: dispensa por fase, reabertura de atividade laboratorial e acompanhamento das execuções afetadas.

### Modified Capabilities

Nenhuma.

## Impact

- Novos tipos, serviços server-only, Route Handlers e controles no detalhe do processo.
- Integração com `/processes/{id}/phases/{phase_key}/laboratory-waivers` e `/processes/{id}/activities/{activity_key}/laboratories/{laboratory_id}/reopen`.
- Revalidação de tarefas e processos após as mutações.
- Internacionalização e confirmações acessíveis em `pt-BR` e `en`.
