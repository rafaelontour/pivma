## MODIFIED Requirements

### Requirement: Listagem inicial de formulários de processo

O sistema SHALL apresentar, no acesso à página `/formularios`, uma listagem ampla e simplificada dos formulários vinculados aos processos da plataforma, ocupando toda a largura útil e sem reservar espaço lateral para o editor. A experiência de navegação e acesso a este módulo SHALL ser padronizada de forma idêntica para perfis de administração e perfis BraCVAM / Grupo Gestor. Cada item listado MUST exibir prioritariamente o nome do formulário, o processo associado, a versão ou status e a ação principal de abertura da configuração. A interface do usuário MUST NOT exibir a chave técnica interna (`key`), a descrição técnica longa nos cartões do catálogo, nem o botão redundante de atualização manual no cabeçalho da lista. A interface do usuário MUST NOT utilizar o termo técnico "template" ou "templates" em títulos, botões ou textos explicativos voltados para a pessoa usuária.

#### Scenario: Acesso inicial apresenta a listagem de formulários
- **WHEN** uma pessoa autorizada com perfil administrador ou BraCVAM acessa a página de formulários
- **THEN** o sistema exibe a listagem dos formulários disponíveis em visão de catálogo amplo, sem exibir a coluna de edição simultaneamente, e apresentando cartões simplificados contendo nome, processo associado, versão e botão de configuração, sem exibir chave técnica (`key`) nem descrição nos cartões

#### Scenario: Lista sem formulários disponíveis
- **WHEN** não há formulários cadastrados ou retornados pelo serviço
- **THEN** o sistema exibe mensagem amigável comunicando a ausência de formulários para configuração

#### Scenario: Atualização da listagem sem botão manual redundante
- **WHEN** a pessoa visualiza a listagem de formulários
- **THEN** a interface não exibe botão de "Atualizar lista" no topo do catálogo, atualizando a listagem automaticamente na montagem ou ao retornar do editor

#### Scenario: Recuperação em caso de erro de carregamento
- **WHEN** o carregamento da lista de formulários falha
- **THEN** o sistema apresenta a mensagem de erro com um botão contextual de nova tentativa (retry)

#### Scenario: Padronização de acesso entre perfis
- **WHEN** um usuário com perfil administrador ou do Grupo Gestor / BraCVAM navega até formulários
- **THEN** o sistema oferece a mesma hierarquia de navegação com breadcrumbs de retorno para Configurações e cabeçalho alinhado
