## ADDED Requirements

### Requirement: Ações pós-aprovação no acompanhamento da submissão

O sistema SHALL apresentar ao proponente, no acompanhamento de uma submissão aprovada, as tarefas acionáveis para definir patrocinador e grupo gestor. O acompanhamento MUST abrir a composição do mesmo processo e MUST continuar exibindo o processo após a conclusão dessas tarefas.

#### Scenario: Aprovação desbloqueia a composição

- **WHEN** uma submissão aprovada retorna as tarefas `assign_sponsor` ou `assign_group_manager` acionáveis para o proponente
- **THEN** o cartão da submissão apresenta o próximo passo e uma ação para abrir a composição

#### Scenario: Composição parcialmente concluída

- **WHEN** apenas uma das duas designações iniciais foi concluída
- **THEN** o acompanhamento informa qual definição ainda está pendente e permite retomá-la

#### Scenario: Composição inicial concluída

- **WHEN** patrocinador e grupo gestor foram definidos e a API avançou o fluxo
- **THEN** a submissão permanece no acompanhamento com o estado atualizado e sem oferecer novamente tarefas concluídas

