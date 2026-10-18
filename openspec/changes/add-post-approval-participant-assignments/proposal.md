## Why

Depois da aprovação da triagem, o processo avança para tarefas de definição do patrocinador e do grupo gestor, mas o frontend ainda não oferece uma jornada para concluí-las. Sem essas designações, a pessoa responsável pelo grupo gestor também não consegue cadastrar os laboratórios participantes e o processo fica interrompido no início da fase de planejamento.

## What Changes

- Adicionar ao acompanhamento da submissão aprovada uma etapa de composição inicial na qual o proponente define uma pessoa como patrocinador e outra como responsável pelo grupo gestor.
- Usar convites por e-mail para essas designações, pois o proponente não possui `users.read`, mantendo a API responsável por vincular uma conta existente ou concluir o convite de uma nova pessoa.
- Exibir o estado de cada designação, permitir retomar tarefas incompletas e refletir automaticamente o avanço produzido pela API.
- Disponibilizar à pessoa com papel local `group_manager` um espaço do processo para selecionar laboratórios ativos e convidar ou vincular uma pessoa responsável a cada laboratório com o papel `participating_laboratory`.
- Listar as designações ativas do processo e impedir duplicidade, associação sem laboratório ou uso de laboratório inativo.
- Manter URL externa, credenciais e cookies exclusivamente no servidor por meio de serviços e Route Handlers internos.
- Criar simultaneamente toda a interface, validação e feedback em português do Brasil e inglês.

## Capabilities

### New Capabilities

- `process-participant-assignments`: composição pós-aprovação do patrocinador, grupo gestor e laboratórios participantes, com autorização por papel local, convites, retomada e acompanhamento do avanço do processo.

### Modified Capabilities

- `dynamic-process-forms`: o acompanhamento de uma submissão aprovada passa a apresentar e abrir as tarefas pós-triagem que competem ao proponente.
- `authenticated-navigation`: pessoas com tarefas acionáveis como grupo gestor passam a encontrar o espaço de composição do processo pela área autenticada.
- `process-kanban`: os detalhes do processo passam a apresentar a composição e as tarefas da fase de atribuição sem permitir movimentação manual do quadro.

## Impact

- Novos contratos em `types/` para participantes, convites, laboratórios, tarefas pós-aprovação e estados da interface.
- Novos serviços server-only e Route Handlers internos para `/processes/{process_id}/participants`, convites de participantes e `/institutional/laboratories`.
- Alterações em `/submissoes`, no shell autenticado e nos detalhes do Kanban; possível criação de uma página autenticada específica para composição do processo.
- Uso dos papéis publicados `sponsor`, `group_manager` e `participating_laboratory`; a designação de laboratório sempre inclui uma pessoa e um `laboratory_id`, conforme o contrato atual.
- Nenhuma nova dependência de frontend e nenhuma alteração direta no ciclo de vida: a API permanece autoritativa para concluir tarefas e avançar fases.
