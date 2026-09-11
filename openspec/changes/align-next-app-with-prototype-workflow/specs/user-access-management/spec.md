## ADDED Requirements

### Requirement: Diretório pesquisável de usuários

O sistema SHALL permitir que uma pessoa autorizada pesquise usuários por nome ou e-mail e filtre a listagem entre contas ativas e inativas. A listagem MUST apresentar nome completo, nome de usuário, e-mail, situação e perfis ativos retornados pelo serviço.

#### Scenario: Pesquisa encontra usuários

- **WHEN** a pessoa informa um termo de pesquisa
- **THEN** o sistema consulta o diretório com esse termo e apresenta somente os resultados devolvidos pela API

#### Scenario: Filtro de situação é alterado

- **WHEN** a pessoa seleciona contas ativas ou inativas
- **THEN** o sistema atualiza a consulta e identifica claramente o filtro aplicado

#### Scenario: Pesquisa não encontra correspondência

- **WHEN** a API conclui a consulta sem itens
- **THEN** o sistema apresenta um estado vazio sem sugerir que ocorreu uma falha

### Requirement: Manutenção do nome completo

O sistema SHALL permitir que uma pessoa com autorização de gestão altere o nome completo de uma conta. A atualização MUST exigir um valor não vazio e MUST preservar o valor anterior quando a API rejeitar a operação.

#### Scenario: Nome completo é atualizado

- **WHEN** uma pessoa autorizada informa um nome válido e confirma a alteração
- **THEN** o sistema atualiza o usuário e reflete o novo nome no diretório

#### Scenario: Atualização é recusada

- **WHEN** a API recusa a alteração por validação ou autorização
- **THEN** o sistema mantém o nome anterior e apresenta uma mensagem segura e acionável

### Requirement: Criação de perfil customizado

O sistema SHALL permitir que uma pessoa autorizada crie um perfil de acesso customizado com nome, descrição e códigos de permissão selecionados no catálogo disponível. O sistema MUST comunicar que a criação do perfil não o atribui automaticamente a uma pessoa.

#### Scenario: Perfil é criado

- **WHEN** a pessoa informa nome e descrição válidos, seleciona os códigos desejados e confirma
- **THEN** o sistema cria o perfil e o disponibiliza para atribuição

#### Scenario: Perfil é inválido

- **WHEN** nome, descrição ou códigos são recusados pelo serviço
- **THEN** o sistema preserva a edição e apresenta os dados que precisam ser revisados

### Requirement: Uso dos perfis retornados pelo diretório

O sistema SHALL considerar os perfis ativos presentes em cada item da listagem de usuários como fonte inicial para exibição dos cargos, consultando o acesso detalhado somente quando a pessoa abrir a gestão daquele usuário.

#### Scenario: Diretório é carregado

- **WHEN** a API retorna usuários com seus perfis ativos
- **THEN** o sistema apresenta os cargos sem exigir uma consulta de acesso separada para cada usuário

#### Scenario: Gestão individual é aberta

- **WHEN** a pessoa abre as permissões de um usuário
- **THEN** o sistema consulta o acesso detalhado e apresenta permissões efetivas atualizadas

### Requirement: Proteção das novas operações de usuários

O navegador MUST usar somente rotas internas para pesquisar, filtrar ou alterar usuários e para criar perfis. Mutações MUST encaminhar no servidor o contexto de origem exigido pela API.

#### Scenario: Operação administrativa usa integração interna

- **WHEN** a pessoa pesquisa usuários, altera um nome ou cria um perfil
- **THEN** o navegador não recebe a URL externa nem a credencial de sessão
