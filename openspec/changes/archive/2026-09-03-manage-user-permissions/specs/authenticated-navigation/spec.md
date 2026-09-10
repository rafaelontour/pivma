## ADDED Requirements

### Requirement: Acesso à gestão de usuários

O sistema SHALL apresentar o item de navegação Usuários para pessoas cuja sessão possua a permissão de consultar usuários. A página de Usuários MUST continuar exigindo uma sessão válida e tratar a ausência de autorização sem revelar dados administrativos.

#### Scenario: Pessoa autorizada acessa usuários

- **WHEN** uma pessoa autenticada possui permissão para consultar usuários
- **THEN** o sistema apresenta o item Usuários na barra lateral e permite acessar a listagem administrativa

#### Scenario: Pessoa sem autorização acessa usuários

- **WHEN** uma pessoa sem autorização tenta carregar dados da página de Usuários
- **THEN** o sistema não apresenta dados administrativos e comunica que a consulta não é permitida
