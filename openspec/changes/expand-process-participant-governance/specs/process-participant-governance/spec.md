## Purpose

Governar todos os cargos locais de um processo com autorização por escopo, histórico auditável e separação explícita entre participação, convite e afiliação institucional.

## ADDED Requirements

### Requirement: Composição dirigida pelos cargos e tarefas publicados
O sistema SHALL apresentar os cargos locais suportados pela API e MUST permitir uma atribuição somente quando a sessão e a tarefa atual autorizarem a operação. Identificadores técnicos de cargo MUST permanecer inalterados nos payloads.

#### Scenario: Cargo acionável
- **WHEN** uma tarefa de atribuição está acionável para um papel efetivo da sessão
- **THEN** o sistema apresenta o cargo, as designações atuais e o controle de atribuição permitido

#### Scenario: Cargo sem autorização
- **WHEN** uma pessoa acessa um cargo que não pode atribuir naquele processo
- **THEN** o sistema apresenta somente os dados que ela pode consultar e não envia mutação

### Requirement: Ciclo de vida de convites
O sistema SHALL permitir criar, listar, reenviar e revogar convites conforme os endpoints publicados. Convites pendentes, aceitos, expirados e revogados MUST ser distinguidos de participantes ativos.

#### Scenario: Reenvio autorizado
- **WHEN** uma pessoa autorizada confirma o reenvio de um convite pendente
- **THEN** o sistema executa uma única mutação e reconcilia o convite com a API

#### Scenario: Convite revogado
- **WHEN** a API confirma a revogação
- **THEN** o convite deixa de ser apresentado como caminho válido de ingresso sem apagar seu histórico

### Requirement: Revogação e substituição explícitas
O sistema SHALL permitir revogar uma designação ativa mediante confirmação e MUST tratar uma substituição como revogação e nova atribuição autoritativas. Remover uma afiliação institucional MUST NOT revogar silenciosamente uma participação de processo.

#### Scenario: Participante deixa o processo
- **WHEN** a BraCVAM ou outro ator autorizado confirma a revogação de uma designação
- **THEN** o sistema atualiza a composição após a resposta da API e preserva o evento no histórico

#### Scenario: Afiliação ao laboratório é removida
- **WHEN** uma pessoa deixa de ser afiliada ao laboratório, mas mantém designação ativa no processo
- **THEN** o sistema não simula a revogação e sinaliza a necessidade de tratar a designação separadamente

### Requirement: Conflitos e efetividade
O sistema SHALL permitir registrar a declaração de conflito publicada pela API e MUST diferenciar designação ativa de designação efetiva. Uma pessoa com conflito vigente MUST NOT ser apresentada como apta a agir quando a API indicar o contrário.

#### Scenario: Conflito declarado
- **WHEN** a API registra uma declaração de conflito para a designação
- **THEN** o sistema atualiza o indicador de conflito e a efetividade sem remover o histórico da pessoa

### Requirement: Conclusão da atribuição de cargo
O sistema SHALL oferecer a conclusão explícita de um cargo quando a API exigir essa operação e MUST bloquear a confirmação enquanto existirem pendências publicadas para o cargo.

#### Scenario: Cargo completo
- **WHEN** todas as designações necessárias estão válidas e a pessoa confirma a conclusão
- **THEN** o sistema chama a conclusão do cargo e recarrega tarefas, participantes e processo

### Requirement: Histórico auditável
O sistema SHALL apresentar o histórico paginado das participações com ator, cargo, laboratório, situação e datas disponíveis, sem converter eventos históricos em estado atual.

#### Scenario: Designação revogada no histórico
- **WHEN** uma designação antiga não está mais ativa
- **THEN** o sistema mantém o evento consultável e o identifica como histórico

### Requirement: Descoberta por escopo local
O sistema SHALL permitir que grupo gestor e demais participantes encontrem os processos presentes em seus escopos, respeitando as capacidades de cada papel. A BraCVAM SHALL poder localizar os processos que administra. O patrocinador MUST acompanhar exclusivamente os processos em que possui designação ativa `sponsor` pela área **Acompanhamento** e MUST NOT receber acesso ao quadro Kanban.

#### Scenario: Patrocinador autenticado
- **WHEN** a sessão possui `sponsor` em um processo
- **THEN** o processo aparece em **Acompanhamento** e não no quadro Kanban

### Requirement: Acompanhamento próprio do patrocinador
O sistema SHALL apresentar ao módulo efetivo Patrocinador o item **Acompanhamento** e MUST NOT apresentar o item **Processos**. A listagem SHALL conter somente processos em que a sessão possua uma designação ativa `sponsor` e SHALL apresentar, para cada vínculo, código e nome do processo, nome do proponente e data de atribuição do patrocinador formatada conforme o locale ativo. Cada item SHALL abrir uma página própria de acompanhamento, sem reutilizar ou expor o quadro Kanban.

A página de detalhe SHALL apresentar o estado, a fase e a atividade do projeto somente conforme dados publicados pela API. Enquanto o processo estiver em `PLANNING`, a interface SHALL informar que a pessoa foi convidada para ser patrocinadora, que o projeto ainda está em elaboração e que os resultados poderão ser acompanhados quando estiverem disponíveis. Resultados, marcos e demais informações MUST NOT ser inferidos quando a API ainda não os publicar.

#### Scenario: Lista de projetos patrocinados
- **WHEN** uma pessoa com módulo efetivo Patrocinador abre **Acompanhamento**
- **THEN** o sistema lista somente seus vínculos ativos `sponsor`, identificando processo, proponente e data localizada da atribuição

#### Scenario: Projeto ainda em elaboração
- **WHEN** o patrocinador abre um projeto cujo estado é `PLANNING`
- **THEN** a página informa que o convite de patrocínio foi aceito, que o projeto está em elaboração e que seus resultados poderão ser acompanhados posteriormente

#### Scenario: Projeto iniciado
- **WHEN** o patrocinador abre um projeto que já saiu de `PLANNING`
- **THEN** a página apresenta o estado, a fase, a atividade e as informações de acompanhamento efetivamente publicadas para o projeto

#### Scenario: Tentativa de abrir o Kanban
- **WHEN** uma conta cujo módulo efetivo é Patrocinador solicita diretamente `/processos` ou uma página operacional não autorizada
- **THEN** o sistema não apresenta o Kanban nem o conteúdo operacional e redireciona a pessoa para `/acompanhamento`

#### Scenario: Conta com outro cargo efetivo e vínculo auxiliar de patrocinador
- **WHEN** a sessão também possui `sponsor`, mas outro cargo ou perfil institucional tem precedência como módulo efetivo
- **THEN** a navegação e a autorização seguem o módulo efetivo sem substituir suas capacidades pela restrição exclusiva do Patrocinador

### Requirement: Navegação do grupo gestor
O módulo efetivo `group_manager` SHALL apresentar **Acompanhamento** usando a lista existente de integrantes do grupo gestor por processo e MUST NOT apresentar **Processos** nem o Kanban. Além de **Início**, o módulo SHALL permitir somente a página `/grupo`; solicitações diretas a outras páginas autenticadas SHALL redirecionar para `/grupo`. Perfis ou cargos de maior precedência permanecem sujeitos ao próprio módulo efetivo.

#### Scenario: Consulta dos integrantes do grupo
- **WHEN** uma conta cujo módulo efetivo é `group_manager` abre **Acompanhamento**
- **THEN** o sistema organiza os integrantes ativos do grupo gestor por processo e oferece **Ver processo** para consultar um resumo somente leitura, sem abrir a composição administrativa

#### Scenario: Acesso direto ao Kanban
- **WHEN** uma conta cujo módulo efetivo é `group_manager` solicita diretamente `/processos` ou outra página fora da allowlist
- **THEN** o sistema não apresenta o Kanban nem conteúdo operacional e redireciona para `/grupo`

### Requirement: Navegação de submissões para ingresso como Proponente
O sistema SHALL apresentar a opção **Submissões** para contas no **Módulo geral da plataforma** e para contas Proponente, permitindo que uma pessoa ainda sem cargo faça sua primeira submissão. Contas identificadas como Administração, BraCVAM ou outro cargo associativo MUST NOT receber essa opção, ainda que possuam um escopo auxiliar com papel `proponent` em algum processo. Quando o módulo efetivo da sessão for Proponente, a navegação autenticada MUST apresentar somente **Início** e **Submissões** e MUST NOT apresentar **Designações**, **Processos** ou qualquer item administrativo, operacional ou de observabilidade. A abertura direta de qualquer página autenticada fora de `/inicio` e da árvore `/submissoes` MUST ser bloqueada e redirecionada para `/inicio` antes de apresentar o conteúdo restrito.

#### Scenario: Conta administrativa com escopo de proponente
- **WHEN** uma conta Administração ou BraCVAM também possui `proponent` em um escopo local
- **THEN** o menu não apresenta a opção **Submissões**

#### Scenario: Conta proponente
- **WHEN** uma conta Proponente sem identidade Administração ou BraCVAM abre a área autenticada
- **THEN** o menu apresenta somente **Início** e **Submissões**

#### Scenario: Proponente tenta abrir outra página diretamente
- **WHEN** uma conta cujo módulo efetivo é Proponente solicita diretamente uma página autenticada fora de `/inicio` e da árvore `/submissoes`
- **THEN** o sistema não apresenta o conteúdo solicitado e redireciona a pessoa para `/inicio`

#### Scenario: Perfil institucional com papel auxiliar de proponente
- **WHEN** uma conta Administração, BraCVAM ou com outro cargo associativo também possui `proponent` em seus escopos
- **THEN** a restrição exclusiva do módulo Proponente não substitui a navegação e a autorização correspondentes à identidade efetiva da sessão

#### Scenario: Conta ainda sem cargo
- **WHEN** uma conta sem perfil nem cargo associativo abre o módulo geral
- **THEN** o menu apresenta **Submissões** para permitir seu primeiro envio

### Requirement: Perfil visual por cargo
O sistema SHALL identificar o perfil visual efetivo da sessão a partir dos perfis globais e cargos locais publicados pela API. Proponente, BraCVAM, Administração e cada um dos doze cargos locais SHALL possuir nome, descrição, ícone e tema cromático próprios no shell autenticado. O tema verde SHALL identificar o perfil BraCVAM, o azul SHALL identificar o Proponente e o roxo SHALL identificar a Administração. Os cargos locais SHALL usar matizes próprias que não confundam essas três identidades principais. A identidade visual MUST NOT conceder acesso nem substituir as permissões e escopos autoritativos.

#### Scenario: Conta com cargo técnico local
- **WHEN** a sessão publica uma associação local reconhecida diferente de `proponent`
- **THEN** o shell, o indicador de módulo e o cartão da conta usam o perfil visual correspondente ao cargo

#### Scenario: Conta administrativa com escopo de proponente
- **WHEN** a conta possui perfil Administração explícito e a sessão também publica somente `proponent` como cargo local
- **THEN** o shell mantém o perfil visual Administração sem apresentar a conta como Proponente

#### Scenario: Pessoa associada ao laboratório líder
- **WHEN** a sessão publica `lead_laboratory` para a pessoa, inclusive quando ela também possui perfil institucional
- **THEN** a interface usa o tema ciano e o badge identifica **Módulo do lab. líder**

#### Scenario: Pessoa associada ao grupo gestor
- **WHEN** a sessão publica `group_manager` para a pessoa
- **THEN** a interface usa o tema do grupo gestor e o badge identifica **Módulo do grupo gestor**

#### Scenario: Conta BraCVAM sem cargo local
- **WHEN** a conta possui perfil BraCVAM e nenhum cargo associativo reconhecido, ainda que tenha `proponent` ou uma capacidade administrativa técnica
- **THEN** somente o perfil visual BraCVAM permanece ativo, com tema verde

#### Scenario: Conta com mais de um cargo local
- **WHEN** a sessão publica vários cargos locais
- **THEN** o sistema escolhe o perfil visual de forma determinística pelo catálogo fechado de cargos e não depende da ordem da resposta da API

#### Scenario: Pessoas distintas no mesmo cargo
- **WHEN** duas pessoas possuem a mesma associação local
- **THEN** ambas recebem o mesmo nome, ícone e tema do cargo, sem variante baseada em username ou conta

#### Scenario: Conta sem perfil nem cargo
- **WHEN** a sessão não publica perfil institucional nem cargo associativo reconhecido
- **THEN** a interface usa tema cinza, identifica **Módulo geral da plataforma** e apresenta o perfil como **Acesso padrão**

#### Scenario: Primeira submissão da conta
- **WHEN** a pessoa sem cargo envia sua primeira submissão e a API passa a publicar `proponent`
- **THEN** o shell reconcilia a sessão uma única vez, muda o tema para azul e identifica **Módulo do proponente** sem recarregar a página inteira

#### Scenario: Identificação sem percepção de cor
- **WHEN** a pessoa não distingue o tema cromático
- **THEN** o nome, a descrição e o ícone do perfil continuam identificando o cargo ativo

#### Scenario: Cores dos perfis principais
- **WHEN** BraCVAM, Proponente e Administração são apresentados
- **THEN** seus temas são respectivamente verde, azul e roxo, sem que o Grupo Gestor reutilize uma dessas identidades principais

### Requirement: Integração protegida e localizada
O navegador MUST usar somente rotas internas, e erros externos MUST preservar o código publicado pelo backend. Todo conteúdo controlado pela aplicação SHALL existir em `pt-BR` e `en`. A navegação entre itens do menu autenticado SHALL preservar o shell e a sessão já carregada, substituindo apenas o conteúdo da rota sem repetir a consulta de sessão a cada clique.

#### Scenario: Backend recusa uma mutação
- **WHEN** a API retorna um código de erro para uma operação de participante
- **THEN** a interface apresenta esse código com feedback localizado e não inventa conclusão local

#### Scenario: Navegação pelo menu autenticado
- **WHEN** a pessoa abre outro item do menu por navegação interna
- **THEN** header, barra lateral, perfil e sessão permanecem montados enquanto somente o conteúdo da página é substituído
