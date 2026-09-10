## Purpose

Permitir que administradores gerenciem cargos e permissões de usuários com rastreabilidade e sem expor credenciais ou a URL da API externa ao navegador.

## ADDED Requirements

### Requirement: Listagem de cargos de usuários

O sistema SHALL exibir, na listagem administrativa de usuários, o cargo de cada pessoa a partir da descrição dos perfis de acesso atribuídos. Pessoas sem perfil atribuído MUST ser identificadas como sem cargo atribuído.

#### Scenario: Cargo atribuído é exibido

- **WHEN** uma pessoa autorizada abre a listagem de usuários
- **THEN** o sistema exibe a descrição de cada perfil atribuído como cargo da respectiva pessoa

#### Scenario: Pessoa não possui cargo

- **WHEN** uma conta não possui perfil de acesso atribuído
- **THEN** o sistema a identifica como sem cargo atribuído na listagem

### Requirement: Concessão e remoção de cargos

O sistema SHALL permitir que uma pessoa com autorização administrativa consulte os perfis de acesso ativos, atribua um perfil a uma conta e remova um perfil já atribuído. O sistema MUST impedir a atribuição duplicada de um perfil já presente e comunicar o resultado da operação.

#### Scenario: Administrador atribui cargo

- **WHEN** uma pessoa autorizada seleciona um perfil ativo não atribuído e confirma o salvamento
- **THEN** o sistema atribui o perfil à conta selecionada e atualiza os cargos e permissões exibidos

#### Scenario: Administrador remove cargo

- **WHEN** uma pessoa autorizada seleciona a remoção de um perfil atribuído
- **THEN** o sistema remove somente aquele perfil da conta selecionada e atualiza a listagem

#### Scenario: Operação administrativa é recusada

- **WHEN** o serviço recusa a concessão ou remoção por autorização, validação ou indisponibilidade
- **THEN** o sistema mantém dados consistentes e apresenta uma mensagem segura e acionável

### Requirement: Edição de códigos de permissão de perfis

O sistema SHALL permitir que uma pessoa com autorização administrativa consulte o catálogo de códigos de permissão e altere os `permission_codes` de um perfil atribuído. Antes de salvar, o sistema MUST informar que a alteração do perfil afeta todas as pessoas a ele vinculadas.

#### Scenario: Administrador altera códigos de um perfil

- **WHEN** uma pessoa autorizada seleciona ou desmarca códigos de permissão de um perfil e salva
- **THEN** o sistema atualiza os códigos do perfil e apresenta as permissões efetivas atualizadas para a pessoa selecionada

#### Scenario: Escopo global da alteração é informado

- **WHEN** a edição dos códigos de um perfil é apresentada
- **THEN** o sistema informa que a alteração vale para todas as pessoas vinculadas ao perfil

### Requirement: Proteção da integração administrativa

O navegador MUST chamar somente rotas internas da aplicação para consultar ou alterar cargos e códigos de permissão. A aplicação MUST manter credenciais de sessão e a URL da API externa no servidor e encaminhar os requisitos de origem exigidos pelo serviço externo para operações de alteração.

#### Scenario: Alteração usa rota interna

- **WHEN** uma pessoa salva, remove ou atualiza permissões de um perfil
- **THEN** o navegador chama uma rota interna e não recebe a URL da API externa ou a credencial de sessão
