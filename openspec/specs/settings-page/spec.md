# settings-page Specification

## Purpose

Oferecer uma página centralizada de Configurações no pi*VMA para reunir e organizar o acesso aos módulos administrativos de Formulários, Avaliações por IA e Usuários de acordo com as permissões da sessão.

## Requirements

### Requirement: Central de configurações da plataforma

O sistema SHALL disponibilizar uma página autenticada de Configurações na rota `/configuracoes`. A página MUST exigir uma sessão válida; sem uma sessão ativa, o sistema MUST redirecionar a pessoa para o login sem revelar os módulos de configuração.

#### Scenario: Acesso com sessão válida

- **WHEN** uma pessoa autenticada com permissão para ao menos um módulo acessa `/configuracoes`
- **THEN** o sistema carrega a página de Configurações dentro da área autenticada

#### Scenario: Acesso sem sessão válida

- **WHEN** uma pessoa não autenticada tenta acessar `/configuracoes`
- **THEN** o sistema redireciona a pessoa para a tela de login

### Requirement: Listagem modular de configurações

O sistema SHALL exibir na página de Configurações uma listagem estruturada dos módulos administrativos da plataforma: Formulários, Avaliações por IA e Usuários. Cada módulo listado MUST apresentar título, descrição do objetivo funcional e um controle interativo para abrir o módulo correspondente.

#### Scenario: Apresentação dos módulos

- **WHEN** a página de Configurações é exibida para uma pessoa com permissões completas
- **THEN** o sistema lista os módulos Formulários, Avaliações por IA e Usuários com título, resumo do módulo e ação de acesso

#### Scenario: Navegação com teclado e acessibilidade

- **WHEN** uma pessoa navega pela listagem de módulos com leitor de tela ou teclado
- **THEN** os cartões de cada módulo possuem foco visível e nomes acessíveis inequívocos para navegação

### Requirement: Controle de visibilidade por perfil e permissão

O sistema SHALL condicionar a disponibilidade e exibição de cada módulo na listagem às permissões e perfis da sessão atual:
- **Formulários**: disponibilizado para pessoas administradoras, com perfil "Grupo Gestor" ou permissão `rbac.read`.
- **Avaliações por IA**: disponibilizado para pessoas com permissão `ai_evaluations.read` ou `ai_evaluations.manage`.
- **Usuários**: disponibilizado para pessoas com permissão `users.read`.

Caso a sessão não possua autorização para nenhum módulo, o sistema MUST apresentar uma mensagem contextual informando que não há configurações disponíveis para o perfil atual.

#### Scenario: Pessoa com acesso parcial

- **WHEN** uma pessoa com permissão apenas para gerenciar usuários acessa Configurações
- **THEN** o sistema apresenta o módulo Usuários e oculta ou restringe o acesso aos módulos de Formulários e Avaliações por IA

#### Scenario: Pessoa sem permissões administrativas

- **WHEN** uma pessoa sem nenhuma permissão de gestão ou configuração acessa `/configuracoes`
- **THEN** o sistema apresenta aviso seguro de que não existem módulos de configuração liberados para a conta

### Requirement: Navegação contextual entre configurações e módulos

O sistema SHALL permitir que a pessoa acesse diretamente a tela operacional de cada módulo a partir da listagem e SHALL disponibilizar nos módulos acessados uma forma clara de navegação de retorno para a central de Configurações.

#### Scenario: Abertura do módulo

- **WHEN** a pessoa clica na ação de abrir o módulo Formulários
- **THEN** o sistema navega para a interface de gerenciamento de formulários

#### Scenario: Retorno à central de configurações

- **WHEN** a pessoa aciona a navegação de retorno a partir da página de um módulo
- **THEN** o sistema reconduz para `/configuracoes` preservando o estado da navegação
