## MODIFIED Requirements

### Requirement: Listagem modular de configurações

O sistema SHALL exibir na página de Configurações uma listagem estruturada dos módulos administrativos da plataforma: Formulários, Avaliações por IA, Usuários e Instituições e laboratórios. Cada módulo listado MUST apresentar título, descrição do objetivo funcional e um controle interativo para abrir o módulo correspondente.

#### Scenario: Apresentação dos módulos

- **WHEN** a página de Configurações é exibida para uma pessoa com permissões completas
- **THEN** o sistema lista os módulos Formulários, Avaliações por IA, Usuários e Instituições e laboratórios com título, resumo e ação de acesso

#### Scenario: Navegação com teclado e acessibilidade

- **WHEN** uma pessoa navega pela listagem de módulos com leitor de tela ou teclado
- **THEN** os cartões de cada módulo possuem foco visível e nomes acessíveis inequívocos para navegação

### Requirement: Controle de visibilidade por perfil e permissão

O sistema SHALL condicionar a disponibilidade e exibição de cada módulo na listagem às permissões e perfis da sessão atual:
- **Formulários**: disponibilizado para pessoas administradoras, com perfil "Grupo Gestor" ou permissão `rbac.read`.
- **Avaliações por IA**: disponibilizado para pessoas com permissão `ai_evaluations.read` ou `ai_evaluations.manage`.
- **Usuários**: disponibilizado para pessoas com permissão `users.read`.
- **Instituições e laboratórios**: disponibilizado para pessoas com permissão `institutional.catalogs.manage`.

Caso a sessão não possua autorização para nenhum módulo, o sistema MUST apresentar uma mensagem contextual informando que não há configurações disponíveis para o perfil atual.

#### Scenario: Pessoa com acesso parcial

- **WHEN** uma pessoa possui apenas uma das permissões necessárias para os módulos de Configurações
- **THEN** o sistema apresenta somente o módulo correspondente e oculta ou restringe os demais

#### Scenario: Administrador ou BraCVAM gerencia o catálogo

- **WHEN** uma sessão dos perfis atuais Administrador ou BraCVAM contém `institutional.catalogs.manage`
- **THEN** o sistema apresenta o módulo Instituições e laboratórios e permite abrir sua página

#### Scenario: Pessoa sem permissões administrativas

- **WHEN** uma pessoa sem nenhuma permissão de gestão ou configuração acessa `/configuracoes`
- **THEN** o sistema apresenta aviso seguro de que não existem módulos de configuração liberados para a conta

