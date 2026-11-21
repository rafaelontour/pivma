## ADDED Requirements

### Requirement: Composição na consulta do processo

O sistema SHALL apresentar na consulta somente leitura do processo o grupo gestor, o patrocinador, os convites pendentes e o estado das etapas da composição. O Kanban MUST continuar sem movimentação manual de estados e MUST oferecer acesso à composição somente para uma sessão BraCVAM autorizada.

#### Scenario: BraCVAM consulta a composição

- **WHEN** uma pessoa autorizada abre os detalhes de um processo aprovado
- **THEN** o sistema apresenta integrantes ativos, patrocinador, convites pendentes e a etapa corrente da composição

#### Scenario: BraCVAM retoma uma ação

- **WHEN** a composição possui uma etapa incompleta e a sessão pode atuar
- **THEN** os detalhes oferecem acesso à linha do tempo protegida sem transformar o cartão em controle de workflow

#### Scenario: Composição altera o fluxo

- **WHEN** a API atualiza tarefas ou processo após uma designação ou aceite
- **THEN** a próxima revalidação atualiza os detalhes e o posicionamento conforme o estado retornado pela API

#### Scenario: Histórico da submissão em andamento

- **WHEN** uma pessoa abre os detalhes de uma submissão na coluna **Em andamento**
- **THEN** o Kanban oferece **Ver histórico** e exibe a linha do tempo da submissão após a consulta autorizada à API
