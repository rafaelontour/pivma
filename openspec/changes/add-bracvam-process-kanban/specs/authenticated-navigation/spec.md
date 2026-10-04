## ADDED Requirements

### Requirement: Acesso ao Kanban de processos

O sistema SHALL apresentar o item de navegação Processos para pessoas autorizadas da BraCVAM a consultar processos. O item MUST direcionar para o Kanban, possuir nome e ícone acessíveis e indicar visualmente quando a página estiver ativa.

#### Scenario: Pessoa autorizada acessa o Kanban

- **WHEN** uma pessoa autenticada possui permissão para consultar processos
- **THEN** o sistema apresenta o item Processos na barra lateral e permite acessar o Kanban

#### Scenario: Item Processos está ativo

- **WHEN** a pessoa está na página do Kanban
- **THEN** a barra lateral identifica o item Processos como a localização atual

#### Scenario: Pessoa sem autorização não recebe o acesso administrativo

- **WHEN** a sessão não possui permissão para consultar processos
- **THEN** o sistema não apresenta o item Processos e não revela dados caso a URL seja acessada diretamente

### Requirement: Triagem acessada pelo contexto do processo

O sistema SHALL concentrar o início da triagem na ação Analisar dos cartões do Kanban e MUST NOT apresentar um item Triagem separado na barra lateral.

#### Scenario: Pessoa autorizada consulta a navegação

- **WHEN** a pessoa possui permissão `triage.review`
- **THEN** a barra lateral apresenta Processos como entrada do fluxo e não apresenta um item Triagem independente
