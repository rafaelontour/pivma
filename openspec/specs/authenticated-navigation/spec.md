# authenticated-navigation Specification

## Purpose

Oferecer uma área inicial autenticada no pi*VMA, com identificação clara do perfil e uma navegação lateral preparada para a ampliação gradual dos módulos da plataforma.

## Requirements

### Requirement: Destino da sessão autenticada

O sistema SHALL redirecionar a pessoa para a página de Início após uma autenticação bem-sucedida. A página de Início MUST exigir uma sessão válida; sem uma sessão válida, o sistema MUST direcionar a pessoa para a tela de login sem revelar dados do perfil.

#### Scenario: Login concluído

- **WHEN** as credenciais são aceitas e o perfil da sessão é carregado
- **THEN** o sistema direciona a pessoa para a página de Início

#### Scenario: Acesso sem sessão

- **WHEN** uma pessoa acessa a página de Início sem uma sessão válida
- **THEN** o sistema redireciona a pessoa para o login e não exibe informações autenticadas

### Requirement: Barra lateral de navegação

O sistema SHALL exibir uma barra lateral persistente na área autenticada com o item de menu Início. O item MUST incluir um ícone reconhecível, um rótulo textual quando a barra estiver expandida e indicação visual de que está ativo na página de Início.

#### Scenario: Área inicial apresenta o menu

- **WHEN** uma pessoa autenticada abre a página de Início
- **THEN** o sistema apresenta a barra lateral com o item Início e seu ícone como item ativo

#### Scenario: Navegação por teclado

- **WHEN** uma pessoa navega pela barra lateral com teclado ou tecnologia assistiva
- **THEN** o item Início e seus controles possuem nome acessível, recebem foco visível e podem ser acionados

### Requirement: Header da área autenticada

O sistema SHALL apresentar um header horizontal de altura fixa de 72 pixels no topo da área autenticada, acima da barra lateral e do conteúdo principal. O header MUST conter o controle de recolher ou expandir a barra lateral e a marca da plataforma, com o controle posicionado à esquerda da marca, e uma ação para encerrar a sessão posicionada no canto direito. O conteúdo rolável e a barra lateral MUST ocupar o espaço disponível abaixo dele.

#### Scenario: Área inicial apresenta o header

- **WHEN** uma pessoa autenticada abre a página de Início
- **THEN** o sistema apresenta um header de 72 pixels acima da barra lateral e do conteúdo principal, com o controle de menu à esquerda da marca

### Requirement: Encerramento de sessão pelo header

O sistema SHALL oferecer no canto direito do header um botão acessível para encerrar a sessão atual. Ao concluir o encerramento, o sistema MUST direcionar a pessoa para a tela de login e MUST NOT manter dados de perfil visíveis na área autenticada.

#### Scenario: Pessoa encerra a sessão

- **WHEN** uma pessoa seleciona a ação de sair no header
- **THEN** o sistema encerra a sessão pela rota interna e direciona a pessoa para o login

#### Scenario: Encerramento indisponível

- **WHEN** não é possível concluir a solicitação de encerramento
- **THEN** o sistema mantém a pessoa na área autenticada e apresenta um aviso seguro de falha

### Requirement: Barra lateral recolhível

O sistema SHALL oferecer um controle para recolher e expandir a barra lateral. No estado recolhido, o sistema MUST manter acessível o ícone do item Início, o controle de expansão e uma identificação essencial do perfil; os rótulos textuais ocultos MUST continuar disponíveis por nome acessível.

#### Scenario: Pessoa recolhe a barra lateral

- **WHEN** uma pessoa seleciona o controle de recolher
- **THEN** o sistema reduz a barra lateral, mantém os ícones e controles operacionais e libera mais espaço para o conteúdo principal

#### Scenario: Pessoa expande a barra lateral

- **WHEN** uma pessoa seleciona o controle de expandir na barra recolhida
- **THEN** o sistema restaura os rótulos do menu e os dados completos de identificação do perfil

### Requirement: Identificação do perfil autenticado

O sistema SHALL apresentar na barra lateral o nome de usuário e o e-mail do perfil associado à sessão atual. A interface MUST obter esses dados da sessão por uma rota interna da aplicação e MUST NOT expor a URL da API externa, credenciais de sessão ou senha.

#### Scenario: Perfil é apresentado

- **WHEN** a página de Início carrega com uma sessão válida
- **THEN** o sistema exibe o nome de usuário e o e-mail associados à sessão atual na barra lateral expandida

#### Scenario: Perfil indisponível

- **WHEN** não é possível obter um perfil válido para a sessão atual
- **THEN** o sistema não exibe dados de perfil desatualizados e direciona a pessoa para o login com um aviso seguro

### Requirement: Acesso à gestão de usuários

O sistema SHALL apresentar o item de navegação Usuários para pessoas cuja sessão possua a permissão de consultar usuários. A página de Usuários MUST continuar exigindo uma sessão válida e tratar a ausência de autorização sem revelar dados administrativos.

#### Scenario: Pessoa autorizada acessa usuários

- **WHEN** uma pessoa autenticada possui permissão para consultar usuários
- **THEN** o sistema apresenta o item Usuários na barra lateral e permite acessar a listagem administrativa

#### Scenario: Pessoa sem autorização acessa usuários

- **WHEN** uma pessoa sem autorização tenta carregar dados da página de Usuários
- **THEN** o sistema não apresenta dados administrativos e comunica que a consulta não é permitida

### Requirement: Acesso às submissões do proponente

O sistema SHALL apresentar o item Submissões na navegação de pessoas autenticadas que possam iniciar processos como proponente. O item MUST possuir nome e ícone acessíveis e indicar quando a página estiver ativa.

#### Scenario: Pessoa autenticada acessa submissões

- **WHEN** uma pessoa autenticada pode criar uma submissão
- **THEN** o sistema apresenta o item Submissões e permite abrir o catálogo de templates

#### Scenario: Item Submissões está ativo

- **WHEN** a pessoa está na página de submissões
- **THEN** a barra lateral identifica Submissões como a localização atual

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
