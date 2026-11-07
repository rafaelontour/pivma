## Purpose

Permitir que administradores consultem o perfil completo de pessoas usuárias e a rastreabilidade de seus cargos sem expor dados sensíveis.

## ADDED Requirements

### Requirement: Consulta de perfil administrativo
O sistema SHALL permitir que pessoas com autorização de gerenciamento de usuários abram, a partir da listagem administrativa, uma página de perfil de cada pessoa listada. A página MUST apresentar nome, nome de usuário, e-mail, situação da conta e data de criação quando disponibilizada pelo serviço.

#### Scenario: Perfil é aberto com sucesso
- **WHEN** uma pessoa autorizada seleciona uma pessoa na listagem administrativa
- **THEN** o sistema apresenta o perfil detalhado dessa pessoa com os dados de conta disponíveis

#### Scenario: Data de criação indisponível
- **WHEN** o serviço não disponibiliza a data de criação da conta
- **THEN** o sistema informa que essa informação não está disponível sem inventar uma data

### Requirement: Exibição de cargos globais e locais
O sistema SHALL apresentar os cargos globais atribuídos à pessoa e as participações locais em processos, identificando processo, papel e data de atribuição quando disponibilizada. Cargos ou datas indisponíveis MUST ser identificados de forma clara.

#### Scenario: Pessoa possui cargos globais e locais
- **WHEN** o perfil possui perfis globais e participações em processos
- **THEN** o sistema apresenta cada conjunto em seções distintas com as respectivas datas de atribuição disponíveis

#### Scenario: Pessoa não possui participação local
- **WHEN** não existem cargos locais para a pessoa
- **THEN** o sistema apresenta um estado vazio específico para participações em processos

### Requirement: Proteção da consulta de perfil
O navegador MUST consultar o perfil detalhado somente por rota interna da aplicação. O sistema MUST aplicar a autorização administrativa no servidor e não expor credenciais de sessão ou a URL da API externa.

#### Scenario: Consulta sem autorização
- **WHEN** uma pessoa sem permissão administrativa tenta consultar um perfil detalhado
- **THEN** o sistema recusa a consulta e apresenta uma resposta segura
