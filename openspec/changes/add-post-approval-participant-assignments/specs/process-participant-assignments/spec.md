## Purpose

Permitir que a BraCVAM componha, após a aprovação, o grupo gestor e o patrocinador de um processo em uma jornada rastreável, usando contas existentes ou convites por e-mail, e registrar a continuidade operacional planejada para as etapas seguintes.

## ADDED Requirements

### Requirement: Linha do tempo da composição pós-aprovação

O sistema SHALL levar a pessoa autorizada da BraCVAM à composição do processo depois da aprovação da submissão e SHALL apresentar uma linha do tempo retomável. A linha do tempo MUST ordenar **Definir grupo gestor** antes de **Definir patrocinador** e MUST obter o estado de cada etapa da API.

A interface MUST apresentar cada etapa em uma aba numerada, com **Grupo gestor** primeiro e **Patrocinador** em seguida, exibindo somente o painel da aba selecionada. A troca entre abas MUST preservar os dados já preenchidos e permitir navegação por teclado.

#### Scenario: Aprovação abre a composição

- **WHEN** a BraCVAM aprova uma submissão e a API aceita a decisão
- **THEN** o sistema abre a composição do mesmo processo com a etapa de grupo gestor em evidência

#### Scenario: Composição retomada

- **WHEN** uma pessoa autorizada reabre um processo cuja composição não terminou
- **THEN** o sistema apresenta as etapas, participantes e convites já persistidos e retoma a primeira etapa ainda incompleta

#### Scenario: Etapa posterior ainda indisponível

- **WHEN** a etapa do grupo gestor ainda não satisfaz as condições publicadas pela API
- **THEN** o sistema mantém a definição do patrocinador identificada como etapa posterior sem simular sua liberação

#### Scenario: Navegação entre etapas da composição

- **WHEN** a pessoa autorizada alterna entre as abas da composição
- **THEN** o sistema mostra somente o painel da etapa selecionada, preserva os dados preenchidos nos demais painéis e mantém a ordem numerada do grupo gestor antes do patrocinador

### Requirement: Grupo gestor formado por participantes do processo

O sistema SHALL representar o grupo gestor como uma coleção de uma ou mais contas individuais vinculadas ao processo com o papel local `group_manager`. O sistema MUST NOT criar conta coletiva, entidade paralela ou plataforma separada para o grupo e MUST NOT substituir integrantes ativos ao adicionar outra pessoa.

Depois da conclusão da etapa inicial, a BraCVAM com `process.participants.manage` SHALL poder adicionar outros integrantes ao grupo gestor e revogar designações existentes, sujeito às regras autoritativas da API. Essas operações de manutenção MUST NOT reabrir ou alterar manualmente a tarefa concluída.

Enquanto `assign_group_manager` estiver acionável, a interface SHALL permitir adicionar vários integrantes sem concluir a tarefa automaticamente. A ação **Concluir definição do grupo gestor** SHALL permanecer explícita, ser apresentada após haver pessoa ativa e só concluir quando a BraCVAM confirmar essa ação e a API aceitar a operação.

Depois que o grupo gestor estiver concluído, a tela de composição SHALL manter disponível o formulário para adicionar novos integrantes à sessão autorizada. Adicionar ou revogar pessoas, inclusive quando o último integrante ativo for removido, MUST NOT esconder o formulário nem exigir reabertura da tarefa; cada nova designação SHALL ser reconciliada com a API e outras inclusões continuarão disponíveis.

#### Scenario: Primeiro integrante adicionado

- **WHEN** a BraCVAM designa uma conta válida como `group_manager`
- **THEN** o sistema inclui essa pessoa entre os participantes ativos do grupo gestor

#### Scenario: Integrantes adicionais

- **WHEN** já existe um integrante ativo e a BraCVAM adiciona outra conta válida
- **THEN** o sistema mantém os integrantes anteriores e acrescenta uma nova designação `group_manager`

#### Scenario: Adicionar pessoas antes de concluir o grupo

- **WHEN** a tarefa `assign_group_manager` permanece acionável após uma ou mais designações
- **THEN** a interface mantém a opção de adicionar outras pessoas e só conclui a etapa quando a BraCVAM aciona **Concluir definição do grupo gestor**

#### Scenario: Manutenção depois da conclusão da etapa

- **WHEN** a etapa `assign_group_manager` está concluída e uma pessoa BraCVAM com `process.participants.manage` adiciona outra conta ativa
- **THEN** o sistema cria a designação por meio da API, mantém os integrantes existentes e não exige que a tarefa inicial volte a `READY`

#### Scenario: Grupo concluído permanece editável

- **WHEN** a tarefa inicial está concluída e a BraCVAM possui `process.participants.manage`
- **THEN** a interface mantém o formulário de inclusão disponível após adicionar integrantes e após revogar designações, inclusive quando não resta integrante ativo

#### Scenario: Remoção de integrante existente

- **WHEN** uma pessoa BraCVAM com `process.participants.manage` revoga a designação de um integrante
- **THEN** o servidor encaminha à API o cookie autenticado e a origem HTTP(S) da interface, e a lista é reconciliada com o resultado autoritativo

#### Scenario: Conclusão do grupo gestor

- **WHEN** existe ao menos um integrante ativo e a BraCVAM solicita a conclusão da etapa
- **THEN** o sistema usa a operação autoritativa da API e atualiza a linha do tempo conforme o resultado retornado

### Requirement: Continuidade operacional após a composição inicial

O plano do processo SHALL contemplar, após a definição inicial de patrocinador e grupo gestor, designações BraCVAM para grupo de seleção de amostras, laboratório líder, laboratórios participantes, estatístico, colaboradores/observadores e especialistas temáticos ad hoc. A ordem relativa entre patrocinador e grupo gestor não define dependência para as atividades posteriores.

O plano SHALL contemplar tarefas locais para o grupo de seleção definir e preparar amostras, para o estatístico preparar o plano estatístico e para cada laboratório participante confirmar seu recebimento. A homologação da estrutura do estudo SHALL ser uma tarefa BraCVAM liberada apenas após a conclusão das demais atividades requeridas da fase 2. O registro de problema no recebimento SHALL originar uma tarefa para o grupo de seleção resolver a não conformidade.

As chaves técnicas das atividades, cardinalidade de cargos, permissões, critérios de conclusão e dependências SHALL ser confirmados contra a API antes de implementar ou alterar transições no frontend. A interface MUST NOT simular estados, tarefas ou permissões localmente.

#### Scenario: Designações operacionais pela BraCVAM

- **WHEN** o processo avança para a composição técnica posterior à definição inicial
- **THEN** a BraCVAM pode designar os cargos listados por operações autorizadas pela API e as dependências do grupo gestor são respeitadas conforme o estado autoritativo

#### Scenario: Tarefas locais dos cargos designados

- **WHEN** a API publica tarefas para o grupo de seleção, estatístico ou laboratórios participantes
- **THEN** cada pessoa vê somente as tarefas correspondentes aos seus cargos e executa a atividade pelo fluxo próprio do cargo

#### Scenario: Homologação aguarda atividades da fase 2

- **WHEN** ainda existem atividades requeridas da fase 2 não concluídas
- **THEN** a tarefa de homologação da estrutura não é apresentada como disponível

#### Scenario: Problema identificado no recebimento

- **WHEN** um laboratório participante registra uma não conformidade no recebimento de amostras
- **THEN** o sistema acompanha a tarefa de resolução atribuída ao grupo de seleção conforme publicada pela API

### Requirement: Visibilidade da composição para o proponente

A interface de acompanhamento do proponente MUST informar que a BraCVAM está definindo os grupos enquanto as tarefas de grupo gestor e patrocinador não estiverem concluídas. A interface MUST NOT liberar a consulta da composição parcial e MUST disponibilizar a composição quando ambas as tarefas estiverem concluídas.

#### Scenario: Composição ainda em definição

- **WHEN** pelo menos uma das tarefas de definição do grupo gestor ou do patrocinador ainda não está concluída
- **THEN** o proponente vê uma mensagem de que a BraCVAM está definindo os grupos e que a composição será exibida quando estiver pronta

#### Scenario: Composição concluída

- **WHEN** as tarefas do grupo gestor e do patrocinador estão concluídas
- **THEN** o proponente pode abrir e consultar a composição do processo

### Requirement: Seleção de usuários existentes

O sistema SHALL permitir que a BraCVAM pesquise contas ativas da plataforma pelo nome completo, nome de usuário ou e-mail e selecione uma identidade persistida para o grupo gestor ou para o patrocinador. A confirmação MUST permanecer indisponível enquanto nenhum resultado válido estiver selecionado e MUST NOT tratar texto livre como identidade.

A pesquisa MUST NOT ocultar contas por perfil global, cargo local ou participação já existente. A validade da nova designação SHALL ser decidida na confirmação pela API autoritativa.

A composição MUST abrir com o modo de designação de conta existente selecionado, deixando o campo de pesquisa visível sem interação adicional. O modo de convite por e-mail permanece disponível no seletor.

Quando a pessoa alternar entre convite e designação de conta existente, o sistema MUST limpar o texto, a seleção e os resultados da pesquisa; ao retornar à designação, o campo estará vazio e pronto para uma nova busca.

#### Scenario: Conta existente selecionada

- **WHEN** a pesquisa retorna uma conta ativa e a BraCVAM seleciona essa conta
- **THEN** o sistema permite confirmar a designação usando o identificador persistido da pessoa

#### Scenario: Designação autenticada com origem da interface

- **WHEN** a BraCVAM confirma a designação de uma conta existente
- **THEN** o servidor encaminha à API externa o cookie da sessão autenticada e a origem HTTP(S) da interface que iniciou a solicitação

#### Scenario: Conta já possui cargo no processo

- **WHEN** a pesquisa encontra uma conta que já possui qualquer cargo local no processo
- **THEN** o sistema mantém a conta nos resultados sem filtrar pelo cargo e deixa a API validar a designação solicitada

#### Scenario: Busca pelo nome da pessoa

- **WHEN** a BraCVAM pesquisa pelo nome completo ou por parte do nome da pessoa
- **THEN** o sistema usa a mesma rota interna paginada do diretório de usuários e apresenta as contas ativas devolvidas pela busca da API visivelmente abaixo do campo

#### Scenario: Resultados e formulário em duas colunas

- **WHEN** a composição é exibida em uma tela larga
- **THEN** cada resultado identifica visualmente a pessoa pelo nome completo, nome de usuário e e-mail, e o formulário posiciona a escolha do modo à esquerda e a pesquisa à direita em telas largas

#### Scenario: Pesquisa sem correspondência

- **WHEN** nenhuma conta corresponde à pesquisa
- **THEN** o sistema apresenta estado vazio e oferece separadamente a opção de convidar por e-mail

- **WHEN** a consulta falha, é cancelada por uma nova busca ou excede o tempo limite
- **THEN** o sistema encerra o indicador de carregamento e informa o estado vazio ou a falha sem deixar a busca presa em andamento

#### Scenario: Conta deixa de estar disponível

- **WHEN** a conta selecionada fica inativa ou inválida antes da confirmação
- **THEN** o sistema rejeita a designação, preserva a pesquisa e solicita uma nova seleção

### Requirement: Convite por e-mail

O sistema SHALL permitir convidar para `group_manager` ou `sponsor` uma pessoa não selecionada no diretório, usando um e-mail válido e o canal de entrega por e-mail. O sistema MUST encaminhar ao backend a origem HTTP(S) do site que iniciou a solicitação, para validação contra as origens confiáveis. O sistema MUST distinguir o estado do convite da situação de sua entrega e MUST NOT revelar, por respostas diferentes, se o endereço já pertence a uma conta.

#### Scenario: Convite criado para entrega por e-mail

- **WHEN** a BraCVAM informa um e-mail válido, escolhe o cargo e confirma o convite
- **THEN** o sistema solicita o envio por e-mail, confirma a criação e mostra o estado de entrega retornado pela API

#### Scenario: Convite validado pela origem do site

- **WHEN** a BraCVAM envia um convite pela interface do site
- **THEN** o sistema encaminha a origem HTTP(S) desse site ao backend para que ele a valide, sem substituir pela origem da API

#### Scenario: Convite permanece pendente

- **WHEN** o convite ainda não foi aceito ou a pessoa ainda não possui uma conta vinculada
- **THEN** o sistema apresenta a pessoa como convite pendente e não como participante ativo

#### Scenario: Entrega falha

- **WHEN** a API informa falha no envio do e-mail
- **THEN** o sistema mostra a falha de entrega sem afirmar que o convite chegou e sem repetir automaticamente a mutação

#### Scenario: Convite aceito

- **WHEN** a API registra o aceite e publica a designação correspondente
- **THEN** o sistema remove a pendência da apresentação corrente e passa a mostrar a pessoa como participante ativo

### Requirement: Convite compartilhável por link

O sistema SHALL permitir que a BraCVAM crie um convite com `channel: link` e copie uma URL interna contendo o token retornado somente na resposta de criação. O token MUST NOT aparecer na listagem posterior de convites, no histórico, em logs da aplicação ou em dados de observabilidade. A abertura do link MUST apresentar somente a prévia publicada pela API e MUST NOT aceitar o convite automaticamente.

O aceite SHALL exigir uma sessão autenticada. O sistema MUST preservar o destino do convite durante login ou cadastro e MUST retornar à mesma página depois da autenticação. Cadastro e aceite MUST permanecer operações distintas: criar a conta não confirma a designação sem ação explícita da pessoa convidada.

As etapas de patrocinador e grupo gestor MUST permanecer pendentes enquanto houver convite não expirado com estado `pending` para o cargo correspondente. A conclusão manual de uma etapa MUST ser recusada nesse estado. Depois do aceite, a interface SHALL marcar a etapa como concluída somente quando a API publicar a tarefa concluída e existir participante ativo para o cargo; a situação **Concluída** SHALL receber destaque visual distinto da pendência.

Na definição do patrocinador, a interface SHALL identificar em destaque a pessoa convidada e o estado do convite até o aceite. Para o patrocinador ativo, a efetividade, os conflitos e as ações para declarar conflito ou revogar a designação SHALL ser apresentados com hierarquia visual clara e controles acessíveis.

Um convite MUST NOT ser apresentado como participante ativo apenas porque seu registro informa `accepted`. A interface SHALL manter a pessoa como convite pendente/aguardando vínculo até reconciliar `accepted_by` com uma designação ativa do mesmo cargo na lista de participantes. Só então a pessoa SHALL aparecer como integrante ou patrocinador ativo e deixar de aparecer como convite pendente.

#### Scenario: Pessoa já autenticada abre o link

- **WHEN** uma pessoa com sessão válida abre um convite por link ainda vigente
- **THEN** o sistema apresenta a prévia e permite confirmar o aceite sem exigir novo login

#### Scenario: Pessoa com conta está desconectada

- **WHEN** uma pessoa sem sessão abre o convite e escolhe entrar
- **THEN** o sistema preserva o destino durante o login e retorna à prévia após autenticar

#### Scenario: Pessoa ainda não possui conta

- **WHEN** uma pessoa sem sessão abre o convite e escolhe criar conta
- **THEN** o sistema preserva o destino durante o cadastro e o login subsequente e retorna à prévia para aceite explícito

#### Scenario: BraCVAM gera o link

- **WHEN** a BraCVAM cria um convite pelo canal `link`
- **THEN** a interface apresenta uma única URL interna copiável construída com o token da resposta e reconcilia a listagem sem persistir o token nela

#### Scenario: Link inválido, expirado ou já utilizado

- **WHEN** a API recusa a prévia ou o aceite por token inválido, expirado, revogado ou já aceito
- **THEN** o sistema apresenta o estado seguro correspondente e não cria designação local

#### Scenario: Etapa aguarda aceite dos convites

- **WHEN** existe convite `pending` e não expirado para patrocinador ou integrante do grupo gestor
- **THEN** a etapa exibe **Pendente de aceite**, a conclusão permanece bloqueada e o convite continua listado como pendente

#### Scenario: Etapa concluída após aceite

- **WHEN** todos os convites vigentes do cargo foram aceitos, há participante ativo e a API publica a tarefa como concluída
- **THEN** a interface destaca **Concluída** na etapa correspondente

### Requirement: Definição do patrocinador

O sistema SHALL permitir definir uma pessoa com o papel local `sponsor` depois da etapa do grupo gestor, por seleção de conta existente ou convite por e-mail. O sistema MUST apresentar a designação ativa, o convite pendente ou a ausência de patrocinador conforme a API.

#### Scenario: Patrocinador existente designado

- **WHEN** a BraCVAM seleciona uma conta ativa e confirma a designação de patrocinador
- **THEN** o sistema cria a designação `sponsor` e reconcilia a linha do tempo

#### Scenario: Patrocinador convidado

- **WHEN** a BraCVAM informa um e-mail válido na opção de convite do patrocinador
- **THEN** o sistema cria um convite `sponsor` e mantém a etapa pendente até o aceite e a designação autoritativa

### Requirement: Consulta mínima do participante

O sistema SHALL permitir abrir um modal para um participante ativo e SHALL mostrar somente os dados autorizados e efetivamente retornados pela API. Nesta entrega, o modal MUST apresentar nome, data de entrada no processo e cargo localizado e MUST omitir foto e outros campos ausentes do contrato.

#### Scenario: Modal de integrante ativo

- **WHEN** a BraCVAM seleciona uma pessoa ativa do grupo gestor ou o patrocinador
- **THEN** o sistema abre um modal com nome, data de entrada localizada e cargo localizado

#### Scenario: Informação não publicada

- **WHEN** a API não fornece foto ou outro dado de perfil
- **THEN** o sistema omite esse campo sem criar valor, imagem ou conteúdo substituto que pareça um dado real

#### Scenario: Convite pendente selecionado

- **WHEN** a BraCVAM consulta um convite ainda pendente
- **THEN** o sistema mostra somente os dados e estados do convite e não o apresenta como perfil de participante ativo

### Requirement: Autorização da composição

O sistema MUST restringir a composição inicial à capacidade BraCVAM autorizada pelo backend e MUST repetir a autorização no servidor em cada leitura e mutação. Perfis globais ou papéis locais com nomes semelhantes MUST NOT substituir a decisão autoritativa da API.

#### Scenario: Sessão BraCVAM autorizada

- **WHEN** a sessão possui a capacidade publicada para compor o processo
- **THEN** o sistema permite consultar a linha do tempo e executar somente as ações liberadas pela API

#### Scenario: Sessão sem autorização

- **WHEN** uma pessoa sem a capacidade exigida acessa diretamente a página ou uma Route Handler
- **THEN** o sistema recusa a operação sem revelar usuários, participantes ou convites protegidos

### Requirement: Reconciliação e integração interna

Após cada designação, convite ou conclusão de etapa, o sistema MUST reconciliar tarefas, participantes e convites com a API e MUST NOT simular avanço local. O navegador MUST usar somente Route Handlers internos, e todo conteúdo controlado pela aplicação MUST existir em português do Brasil e inglês.

#### Scenario: API avança a composição

- **WHEN** uma operação satisfaz as condições de uma etapa e a API atualiza tarefas ou processo
- **THEN** o sistema reflete o novo estado retornado sem enviar alteração manual de fase

#### Scenario: Atualização falha após operação aceita

- **WHEN** a mutação é aceita, mas a reconciliação posterior falha
- **THEN** o sistema informa que o estado pode estar desatualizado e oferece nova consulta sem repetir a mutação

#### Scenario: Operação protegida e localizada

- **WHEN** a interface consulta ou altera a composição
- **THEN** usa uma rota interna, não expõe URL externa ou cookie e limita o token de convite à URL compartilhável e à resposta imediata que a originou, localizando rótulos e datas sem traduzir nomes próprios
