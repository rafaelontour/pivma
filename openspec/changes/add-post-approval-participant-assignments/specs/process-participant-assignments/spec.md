## Purpose

Permitir que a BraCVAM componha, após a aprovação, o grupo gestor e o patrocinador de um processo em uma jornada rastreável, usando contas existentes ou convites por e-mail.

## ADDED Requirements

### Requirement: Linha do tempo da composição pós-aprovação

O sistema SHALL levar a pessoa autorizada da BraCVAM à composição do processo depois da aprovação da submissão e SHALL apresentar uma linha do tempo retomável. A linha do tempo MUST ordenar **Definir grupo gestor** antes de **Definir patrocinador** e MUST obter o estado de cada etapa da API.

#### Scenario: Aprovação abre a composição

- **WHEN** a BraCVAM aprova uma submissão e a API aceita a decisão
- **THEN** o sistema abre a composição do mesmo processo com a etapa de grupo gestor em evidência

#### Scenario: Composição retomada

- **WHEN** uma pessoa autorizada reabre um processo cuja composição não terminou
- **THEN** o sistema apresenta as etapas, participantes e convites já persistidos e retoma a primeira etapa ainda incompleta

#### Scenario: Etapa posterior ainda indisponível

- **WHEN** a etapa do grupo gestor ainda não satisfaz as condições publicadas pela API
- **THEN** o sistema mantém a definição do patrocinador identificada como etapa posterior sem simular sua liberação

### Requirement: Grupo gestor formado por participantes do processo

O sistema SHALL representar o grupo gestor como uma coleção de uma ou mais contas individuais vinculadas ao processo com o papel local `group_manager`. O sistema MUST NOT criar conta coletiva, entidade paralela ou plataforma separada para o grupo e MUST NOT substituir integrantes ativos ao adicionar outra pessoa.

#### Scenario: Primeiro integrante adicionado

- **WHEN** a BraCVAM designa uma conta válida como `group_manager`
- **THEN** o sistema inclui essa pessoa entre os participantes ativos do grupo gestor

#### Scenario: Integrantes adicionais

- **WHEN** já existe um integrante ativo e a BraCVAM adiciona outra conta válida
- **THEN** o sistema mantém os integrantes anteriores e acrescenta uma nova designação `group_manager`

#### Scenario: Conclusão do grupo gestor

- **WHEN** existe ao menos um integrante ativo e a BraCVAM solicita a conclusão da etapa
- **THEN** o sistema usa a operação autoritativa da API e atualiza a linha do tempo conforme o resultado retornado

### Requirement: Seleção de usuários existentes

O sistema SHALL permitir que a BraCVAM pesquise contas ativas da plataforma pelo nome completo, nome de usuário ou e-mail e selecione uma identidade persistida para o grupo gestor ou para o patrocinador. A confirmação MUST permanecer indisponível enquanto nenhum resultado válido estiver selecionado e MUST NOT tratar texto livre como identidade.

A pesquisa MUST NOT ocultar contas por perfil global, cargo local ou participação já existente. A validade da nova designação SHALL ser decidida na confirmação pela API autoritativa.

A composição MUST abrir com o modo de designação de conta existente selecionado, deixando o campo de pesquisa visível sem interação adicional. O modo de convite por e-mail permanece disponível no seletor.

Quando a pessoa alternar entre convite e designação de conta existente, o sistema MUST limpar o texto, a seleção e os resultados da pesquisa; ao retornar à designação, o campo estará vazio e pronto para uma nova busca.

#### Scenario: Conta existente selecionada

- **WHEN** a pesquisa retorna uma conta ativa e a BraCVAM seleciona essa conta
- **THEN** o sistema permite confirmar a designação usando o identificador persistido da pessoa

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

O sistema SHALL permitir convidar para `group_manager` ou `sponsor` uma pessoa não selecionada no diretório, usando um e-mail válido e o canal de entrega por e-mail. O sistema MUST distinguir o estado do convite da situação de sua entrega e MUST NOT revelar, por respostas diferentes, se o endereço já pertence a uma conta.

#### Scenario: Convite criado para entrega por e-mail

- **WHEN** a BraCVAM informa um e-mail válido, escolhe o cargo e confirma o convite
- **THEN** o sistema solicita o envio por e-mail, confirma a criação e mostra o estado de entrega retornado pela API

#### Scenario: Convite permanece pendente

- **WHEN** o convite ainda não foi aceito ou a pessoa ainda não possui uma conta vinculada
- **THEN** o sistema apresenta a pessoa como convite pendente e não como participante ativo

#### Scenario: Entrega falha

- **WHEN** a API informa falha no envio do e-mail
- **THEN** o sistema mostra a falha de entrega sem afirmar que o convite chegou e sem repetir automaticamente a mutação

#### Scenario: Convite aceito

- **WHEN** a API registra o aceite e publica a designação correspondente
- **THEN** o sistema remove a pendência da apresentação corrente e passa a mostrar a pessoa como participante ativo

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
- **THEN** usa uma rota interna, não expõe URL externa, cookie ou token de convite e localiza rótulos e datas sem traduzir nomes próprios
