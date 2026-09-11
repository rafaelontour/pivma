## MODIFIED Requirements

### Requirement: Acesso à gestão de usuários

O sistema SHALL disponibilizar o acesso à gestão de Usuários através da central de Configurações para pessoas cuja sessão possua a permissão de consultar usuários. A página de Usuários MUST continuar exigindo uma sessão válida e tratar a ausência de autorização sem revelar dados administrativos.

#### Scenario: Pessoa autorizada acessa usuários
- **WHEN** uma pessoa autenticada possui permissão para consultar usuários
- **THEN** o sistema disponibiliza o módulo de Usuários em Configurações e permite acessar a listagem administrativa

#### Scenario: Pessoa sem autorização acessa usuários
- **WHEN** uma pessoa sem autorização tenta carregar dados da página de Usuários
- **THEN** o sistema não apresenta dados administrativos e comunica que a consulta não é permitida

## ADDED Requirements

### Requirement: Acesso à central de configurações na barra lateral

O sistema SHALL apresentar o item de navegação Configurações na barra lateral persistente para pessoas cuja sessão possua autorização para consultar ou gerenciar ao menos um dos módulos de configuração (Formulários, Avaliações por IA ou Usuários). O item MUST possuir ícone reconhecível, rótulo textual legível quando a barra estiver expandida e indicação visual de ativo quando a pessoa estiver na página `/configuracoes`.

#### Scenario: Sessão autorizada visualiza Configurações
- **WHEN** uma pessoa autenticada possui permissão para formulários, avaliações por IA ou usuários
- **THEN** o sistema exibe o item Configurações na barra lateral e permite navegar para `/configuracoes`

#### Scenario: Sessão sem permissões de configuração
- **WHEN** uma pessoa autenticada não possui permissão para nenhum dos módulos de configuração
- **THEN** o sistema não exibe o item Configurações na barra lateral de navegação

#### Scenario: Item Configurações está ativo
- **WHEN** a pessoa está na página `/configuracoes`
- **THEN** a barra lateral identifica Configurações como a localização ativa
