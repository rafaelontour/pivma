## Purpose

Permitir que a equipe BraCVAM execute a triagem humana das submissões, confrontando proposta e evidências da IA, registrando revisões rastreáveis e tomando a decisão que move o processo.

## ADDED Requirements

### Requirement: Fila de processos para triagem

O sistema SHALL apresentar à pessoa com `triage.review` os processos elegíveis em `TRIAGE`, com filtros e identificação suficientes para selecionar uma submissão sem expor processos fora de seu escopo.

#### Scenario: Processos aguardam triagem

- **WHEN** a pessoa autorizada abre a página de triagem
- **THEN** o sistema lista os processos elegíveis com código, título, tipo, proponente e atualização

#### Scenario: Fila vazia

- **WHEN** nenhum processo elegível está disponível
- **THEN** o sistema apresenta um estado vazio sem misturar rascunhos em `SUBMISSION`

### Requirement: Leitura da proposta submetida

O sistema SHALL apresentar os campos, seções e valores da proposta selecionada de acordo com a definição vigente na submissão. O conteúdo MUST permanecer somente para leitura durante a triagem.

#### Scenario: Proposta selecionada

- **WHEN** a pessoa abre um processo da fila
- **THEN** o sistema apresenta sua identificação e todos os valores submetidos agrupados pelas seções correspondentes

#### Scenario: Valor não possui renderização especializada

- **WHEN** um campo contém um tipo ainda não suportado visualmente
- **THEN** o sistema mantém sua chave e valor legíveis sem permitir alteração destrutiva

### Requirement: Evidências da pré-avaliação por IA

O sistema SHALL apresentar junto à proposta o relatório automático disponível, incluindo execução, versão da avaliação, critérios, resultado e justificativas devolvidas. A ausência de avaliação MUST ser distinguida de falha ou resultado negativo.

#### Scenario: Relatório disponível

- **WHEN** o processo possui uma pré-avaliação concluída
- **THEN** o sistema vincula cada evidência ao campo e critério correspondentes e identifica a versão executada

#### Scenario: Processo seguiu sem IA

- **WHEN** nenhuma avaliação estava associada à submissão
- **THEN** o sistema informa que a triagem foi iniciada sem pré-avaliação automática

### Requirement: Revisão humana por campo

O sistema SHALL permitir registrar em cada campo `APPROVED`, `NEEDS_REVISION` ou `REJECTED`, acompanhado de comentário quando exigido pelo contrato. A gravação MUST apresentar o estado confirmado pela API.

#### Scenario: Revisão registrada

- **WHEN** a pessoa escolhe um resultado válido e salva o comentário aplicável
- **THEN** o sistema atualiza a revisão do campo sem alterar o valor submetido pelo proponente

#### Scenario: Revisão incompleta

- **WHEN** o resultado escolhido exige justificativa e ela não foi informada
- **THEN** o sistema impede a gravação e indica a informação pendente

### Requirement: Feedback humano sobre critérios da IA

O sistema SHALL permitir classificar cada critério automático como concordante, discordante ou inconclusivo e registrar justificativa. O feedback MUST complementar a execução histórica e MUST NOT reescrever o resultado produzido pela IA.

#### Scenario: Discordância registrada

- **WHEN** a pessoa marca um critério como discordante e informa a justificativa requerida
- **THEN** o sistema salva o feedback humano separado da evidência automática original

#### Scenario: Feedback atualizado

- **WHEN** a pessoa revisa um feedback permitido pelo contrato
- **THEN** o sistema mantém autoria e instante da atualização para rastreabilidade

### Requirement: Decisão final da triagem

O sistema SHALL permitir concluir a triagem somente quando as validações requeridas estiverem satisfeitas. A decisão `APPROVED` MUST mover o processo para `PLANNING`, `NEEDS_REVISION` MUST devolvê-lo para `SUBMISSION` e `REJECTED` MUST movê-lo para `CLOSED`.

#### Scenario: Proposta aprovada

- **WHEN** a pessoa confirma `APPROVED` numa triagem elegível
- **THEN** o sistema registra a decisão e passa a acompanhar o processo em `PLANNING`

#### Scenario: Correção solicitada

- **WHEN** a pessoa confirma `NEEDS_REVISION` com a justificativa aplicável
- **THEN** o sistema registra a decisão, devolve o processo para `SUBMISSION` e disponibiliza a orientação ao proponente

#### Scenario: Proposta rejeitada

- **WHEN** a pessoa confirma `REJECTED` com a justificativa aplicável
- **THEN** o sistema registra a decisão e passa a acompanhar o processo em `CLOSED`

#### Scenario: Estado mudou concorrentemente

- **WHEN** o backend informa que o processo já não está elegível para a decisão
- **THEN** o sistema não simula sucesso, recarrega o estado atual e preserva o texto ainda não enviado quando possível

### Requirement: Linha do tempo da triagem

O sistema SHALL apresentar uma linha do tempo com transições, execuções de IA, revisões, feedbacks e decisão final que a API autorize a pessoa a consultar.

#### Scenario: Histórico disponível

- **WHEN** a pessoa abre a linha do tempo de uma proposta
- **THEN** o sistema ordena os eventos por instante e identifica tipo, autoria ou origem e resultado

### Requirement: Integração protegida da triagem

O navegador MUST usar somente Route Handlers internos para fila, detalhes, revisões, feedbacks, decisão e linha do tempo. A página e seu item de navegação MUST depender de `triage.review`, mantendo URL externa e credencial no servidor.

#### Scenario: Acesso não autorizado

- **WHEN** uma sessão sem `triage.review` tenta abrir ou consultar a triagem
- **THEN** o sistema não expõe propostas, relatórios ou histórico e comunica a falta de acesso

#### Scenario: Operação de triagem falha

- **WHEN** a API não conclui uma consulta, revisão, feedback ou decisão da triagem
- **THEN** a interface preserva o último estado confirmado, comunica a falha e não altera o processo localmente
