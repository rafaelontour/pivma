## Purpose

Permitir que participantes autorizados componham os papéis e laboratórios do processo após a aprovação da triagem, preservando a autorização por escopo local e o avanço controlado pelo backend.

## ADDED Requirements

### Requirement: Definição pós-aprovação pelo proponente

O sistema SHALL permitir que a pessoa com papel local `proponent` defina um patrocinador e uma pessoa responsável pelo grupo gestor quando as tarefas `assign_sponsor` e `assign_group_manager` estiverem acionáveis. Cada designação MUST usar respectivamente os papéis técnicos `sponsor` e `group_manager`, e o sistema MUST permitir que a mesma pessoa acumule papéis quando a API aceitar essa composição.

#### Scenario: Tarefas de composição disponíveis

- **WHEN** a triagem foi aprovada e as tarefas de patrocinador e grupo gestor estão acionáveis para o proponente
- **THEN** o sistema apresenta as duas designações pendentes e permite tratá-las independentemente

#### Scenario: Uma designação já foi concluída

- **WHEN** somente uma das tarefas de composição permanece acionável
- **THEN** o sistema mantém a designação concluída identificada e oferece ação apenas para a tarefa pendente

#### Scenario: Papel acumulado

- **WHEN** o proponente informa para um segundo papel uma pessoa já participante do processo e a API permite o acúmulo
- **THEN** o sistema registra a nova designação sem remover o papel anterior

### Requirement: Designação por convite de e-mail

O sistema SHALL coletar um e-mail válido para convidar o patrocinador, o grupo gestor e a pessoa responsável por um laboratório, sem exigir que o ator tenha permissão administrativa para listar usuários. O sistema MUST informar se a designação está pendente de aceite ou já está ativa e MUST NOT revelar se um endereço pertence previamente a uma conta fora do resultado seguro publicado pela API.

#### Scenario: Convite criado

- **WHEN** uma pessoa autorizada informa um e-mail válido e confirma uma designação
- **THEN** o sistema cria o convite com o papel correto, confirma a operação e atualiza o estado da composição

#### Scenario: Convite pendente

- **WHEN** a API registra um convite que ainda precisa ser aceito
- **THEN** o sistema identifica a designação como pendente sem apresentá-la como participante ativo

#### Scenario: Convite inválido ou conflitante

- **WHEN** a API rejeita o convite por formato, duplicidade, conflito de estado ou falta de autorização
- **THEN** o sistema preserva os dados da interação e apresenta uma mensagem segura sem simular a designação

### Requirement: Composição de laboratórios pelo grupo gestor

O sistema SHALL permitir que uma pessoa com papel local efetivo `group_manager` selecione laboratórios ativos e atribua a cada um uma pessoa com o papel `participating_laboratory`. Cada designação MUST conter o identificador do laboratório e uma pessoa identificada ou convidada por e-mail; o sistema MUST NOT criar uma designação de laboratório sem responsável.

#### Scenario: Laboratório participante atribuído

- **WHEN** o grupo gestor seleciona um laboratório ativo, informa um e-mail válido e confirma
- **THEN** o sistema cria a designação `participating_laboratory` associada à pessoa e ao laboratório escolhidos

#### Scenario: Laboratório sem responsável

- **WHEN** o grupo gestor seleciona um laboratório sem informar uma pessoa válida
- **THEN** o sistema não envia a designação e indica que a pessoa responsável é obrigatória

#### Scenario: Laboratório inativo

- **WHEN** um laboratório está inativo ou deixa de estar disponível antes da confirmação
- **THEN** o sistema não conclui sua designação e solicita a atualização da lista

#### Scenario: Designação duplicada

- **WHEN** já existe uma designação ativa ou um convite pendente equivalente para a pessoa e o laboratório
- **THEN** o sistema não apresenta sucesso duplicado e informa o estado já existente

### Requirement: Acompanhamento da composição do processo

O sistema SHALL listar separadamente participantes ativos e convites pendentes do processo, mostrando papéis com rótulos localizados e laboratórios quando aplicáveis. Após cada operação, o sistema MUST reconciliar participantes, convites e tarefas atuais com a API, que permanece a fonte de verdade para o avanço do fluxo.

#### Scenario: Composição retomada

- **WHEN** uma pessoa autorizada reabre um processo com designações anteriores
- **THEN** o sistema apresenta participantes ativos, convites pendentes e tarefas ainda acionáveis sem depender de estado temporário do navegador

#### Scenario: API avança a fase

- **WHEN** uma designação satisfaz uma tarefa e a API avança ou desbloqueia o processo
- **THEN** o sistema atualiza a composição e as tarefas sem enviar uma alteração manual de estado

#### Scenario: Atualização falha após operação

- **WHEN** a operação é aceita, mas a reconciliação posterior falha
- **THEN** o sistema informa que o estado precisa ser atualizado e oferece nova consulta sem repetir automaticamente a mutação

### Requirement: Autorização por papel local

O sistema MUST autorizar a composição conforme os papéis e tarefas do processo: somente o `proponent` com tarefa acionável pode definir patrocinador e grupo gestor, e somente o `group_manager` efetivo pode atribuir laboratórios participantes. Perfis globais MUST NOT substituir a participação local exigida pelo processo.

#### Scenario: Proponente de outro processo

- **WHEN** um proponente tenta compor um processo fora dos seus escopos locais
- **THEN** o sistema recusa a operação sem revelar participantes, convites ou laboratórios associados ao processo

#### Scenario: Grupo gestor sem escopo no processo

- **WHEN** uma pessoa sem papel local `group_manager` tenta atribuir um laboratório participante
- **THEN** o sistema recusa a operação e não cria convite nem designação

#### Scenario: URL acessada diretamente

- **WHEN** uma pessoa sem papel aplicável acessa diretamente a interface de composição
- **THEN** o sistema não apresenta os dados protegidos nem controles de mutação

### Requirement: Integração interna e localizada

O navegador MUST usar somente Route Handlers internos para consultar tarefas, participantes, convites e laboratórios e para criar as designações. Todo conteúdo controlado pela aplicação MUST existir em português do Brasil e inglês, enquanto nomes de pessoas, instituições e laboratórios recebidos da API MUST permanecer inalterados.

#### Scenario: Operação protegida

- **WHEN** a interface consulta ou altera a composição de um processo
- **THEN** a requisição do navegador usa uma rota interna sem receber a URL externa ou o cookie da API

#### Scenario: Idioma alternado

- **WHEN** a pessoa troca o idioma durante a composição
- **THEN** rótulos, validações, estados e mensagens mudam para o locale ativo sem traduzir nomes e e-mails retornados pela API

