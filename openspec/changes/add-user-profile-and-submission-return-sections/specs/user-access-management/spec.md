## MODIFIED Requirements

### Requirement: Listagem de cargos de usuários

O sistema SHALL exibir, na listagem administrativa de usuários, o cargo de cada pessoa a partir da descrição dos perfis de acesso atribuídos. Pessoas sem perfil atribuído MUST ser identificadas como sem cargo atribuído. A listagem MUST oferecer uma ação para abrir o perfil detalhado de cada pessoa visível a quem possua autorização para gerenciar usuários.

#### Scenario: Cargo atribuído é exibido

- **WHEN** uma pessoa autorizada abre a listagem de usuários
- **THEN** o sistema exibe a descrição de cada perfil atribuído como cargo da respectiva pessoa

#### Scenario: Pessoa não possui cargo

- **WHEN** uma conta não possui perfil de acesso atribuído
- **THEN** o sistema a identifica como sem cargo atribuído na listagem

#### Scenario: Perfil detalhado é acessado da listagem

- **WHEN** uma pessoa autorizada seleciona a ação de perfil de uma conta listada
- **THEN** o sistema abre o perfil detalhado da conta selecionada
