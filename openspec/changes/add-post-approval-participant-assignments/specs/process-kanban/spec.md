## ADDED Requirements

### Requirement: Composição na consulta do processo

O sistema SHALL apresentar na consulta somente leitura do processo a composição atual de patrocinador, grupo gestor e laboratórios participantes, além das tarefas pendentes da fase de atribuição. O Kanban MUST continuar sem controles de alteração manual de estado, e ações de composição MUST aparecer somente quando a própria sessão tiver papel e tarefa aplicáveis.

#### Scenario: Equipe BraCVAM consulta a composição

- **WHEN** uma pessoa autorizada abre os detalhes de um processo após a triagem
- **THEN** o sistema apresenta participantes ativos, convites pendentes identificáveis e tarefas de atribuição sem permitir mover o processo manualmente

#### Scenario: Ator do processo possui ação aplicável

- **WHEN** a sessão possui papel local e tarefa acionável para uma designação exibida nos detalhes
- **THEN** o sistema oferece acesso à composição protegida sem transformar o cartão ou a coluna em controle de estado

#### Scenario: Composição altera o fluxo

- **WHEN** a API atualiza tarefas ou fase após uma designação
- **THEN** a próxima revalidação reposiciona ou atualiza o processo conforme o estado retornado pela API

