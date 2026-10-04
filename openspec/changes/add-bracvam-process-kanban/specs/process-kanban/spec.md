## Purpose

Permitir que a equipe BraCVAM acompanhe todos os processos acessíveis em um quadro único e somente leitura, organizado conforme os estados determinados pelo fluxo do sistema.

## ADDED Requirements

### Requirement: Carregamento completo do quadro

O sistema SHALL carregar todos os processos que a pessoa autenticada estiver autorizada a consultar, percorrendo a paginação do serviço até representar o conjunto completo no Kanban. Durante a carga, o sistema MUST comunicar o progresso sem apresentar um quadro parcialmente carregado como se estivesse completo.

#### Scenario: Processos ocupam mais de uma página

- **WHEN** o serviço informa que existem mais processos do que cabem em uma página
- **THEN** o sistema consulta as páginas restantes e apresenta todos os processos acessíveis no quadro

#### Scenario: Não existem processos acessíveis

- **WHEN** a consulta completa é concluída sem retornar processos
- **THEN** o sistema apresenta o quadro vazio com uma mensagem informativa e não trata o resultado como falha

#### Scenario: Consulta não pode ser concluída

- **WHEN** alguma etapa necessária para carregar o conjunto completo falha
- **THEN** o sistema não apresenta dados parciais como quadro completo e oferece uma ação para tentar novamente

### Requirement: Organização dos processos por macroetapa operacional

O sistema SHALL apresentar, nessa ordem, as colunas Novas submissões, Em revisão, Em andamento e Encerradas. A posição de cada processo MUST ser derivada do ciclo de vida, da fase, da atividade, da rodada e da responsabilidade das tarefas correntes devolvidas pela API. Cada processo MUST aparecer em exatamente uma coluna e a contagem de cada coluna MUST permanecer visível.

#### Scenario: Submissão inicial aguarda análise

- **WHEN** a submissão inicial foi concluída e o processo ainda não avançou da primeira rodada de triagem
- **THEN** o sistema apresenta o cartão em Novas submissões

#### Scenario: Processo está em revisão ou correção

- **WHEN** a triagem está em uma rodada posterior, foi concluída sem avanço de fase ou existe uma tarefa corrente de retorno ao proponente
- **THEN** o sistema apresenta o cartão em Em revisão e sinaliza de quem é a ação

#### Scenario: Processo avançou para execução

- **WHEN** um processo aberto possui tarefa corrente em fase posterior à submissão e triagem
- **THEN** o sistema apresenta o cartão em Em andamento

#### Scenario: Processo terminou seu ciclo de vida

- **WHEN** o ciclo de vida do processo é `CLOSED`, `CANCELLED` ou `ARCHIVED`
- **THEN** o sistema apresenta o cartão em Encerradas, preservando o estado técnico e o motivo recebido

#### Scenario: Submissão enviada ainda não possui classificação mais específica

- **WHEN** o processo está aberto, há evidência de que a submissão inicial foi enviada e não há tarefa suficiente para indicar revisão ou andamento
- **THEN** o sistema o mantém visível em Novas submissões e não apresenta uma coluna de estado não mapeado

#### Scenario: Rascunho inicial não aparece para a BraCVAM

- **WHEN** o processo está aberto e possui somente a submissão inicial ainda não concluída
- **THEN** o sistema não apresenta esse processo em nenhuma coluna do Kanban

### Requirement: Sinalização da responsabilidade durante a revisão

O cartão em Em revisão SHALL informar quando a ação está com a BraCVAM, aguardando o proponente ou voltou corrigida. Quando a tarefa corrente estiver atribuída ao proponente, o sistema MUST desabilitar somente a ação de analisar e MUST manter a consulta dos detalhes disponível.

#### Scenario: Proponente está corrigindo a submissão

- **WHEN** existe uma tarefa corrente `submission_return_review` atribuída ao papel `proponent`
- **THEN** o cartão informa que aguarda correção do proponente, mantém Ver detalhes disponível e apresenta Analisar desabilitado

#### Scenario: Correção foi reenviada

- **WHEN** a atividade de submissão possui rodada posterior concluída e a nova triagem pode ser executada pela BraCVAM
- **THEN** o cartão informa Correção recebida e habilita a ação de análise

#### Scenario: Nova triagem confirma o recebimento da correção

- **WHEN** uma tarefa de triagem em rodada posterior está pronta para a BraCVAM, mesmo que a consulta de tarefas não inclua a submissão concluída correspondente
- **THEN** o cartão informa Correção recebida e habilita a ação de análise

### Requirement: Filtro da coluna Em andamento por fase

O sistema SHALL obter as fases correntes dos processos em andamento e SHALL oferecer um filtro que afeta somente essa coluna. O filtro MUST preservar a contagem total da coluna e comunicar a quantidade atualmente exibida.

#### Scenario: Pessoa escolhe uma fase

- **WHEN** uma fase é selecionada no filtro de Em andamento
- **THEN** a coluna mostra apenas os processos cuja tarefa corrente pertence à fase escolhida

#### Scenario: Pessoa volta para todas as fases

- **WHEN** a opção Todas as fases é selecionada
- **THEN** a coluna volta a mostrar todos os processos em andamento

### Requirement: Identificação e consulta do processo

Cada cartão SHALL exibir pelo menos o código e o título do processo e MUST possuir uma ação acessível para consultar seus detalhes. O cartão MUST NOT depender somente de cor para comunicar o estado.

#### Scenario: Processo é apresentado no quadro

- **WHEN** uma coluna contém um processo
- **THEN** o cartão apresenta seu código e título e permite abrir a consulta do processo

#### Scenario: Navegação sem percepção de cores

- **WHEN** a pessoa consulta o quadro sem distinguir as cores das colunas
- **THEN** o texto e os nomes acessíveis continuam identificando o estado e o processo

#### Scenario: Detalhes de processo ainda aberto

- **WHEN** a pessoa consulta os detalhes de um processo cujo ciclo de vida não é terminal
- **THEN** o sistema mostra template, versão e início, sem apresentar o ciclo de vida técnico, encerramento ou motivo do encerramento

#### Scenario: Detalhes de processo encerrado

- **WHEN** a pessoa consulta os detalhes de um processo `CLOSED`, `CANCELLED` ou `ARCHIVED`
- **THEN** o sistema apresenta data e motivo do encerramento sem expor o identificador técnico do ciclo de vida

### Requirement: Triagem contextual no Kanban

O sistema SHALL abrir a análise da submissão selecionada em um modal sobre o Kanban. O modal MUST ocupar 85% da largura e 85% da altura da viewport, o conteúdo interno MUST usar essa área sem limitação adicional de largura, MUST reutilizar o workspace de triagem e MUST preservar fechamento acessível por botão e tecla Escape. A decisão Aprovado, Solicitar correção ou Reprovado MUST permanecer visível no painel de análise sem exigir a abertura de outro modal.

#### Scenario: BraCVAM inicia a análise de uma nova submissão

- **WHEN** a pessoa aciona Analisar em um cartão disponível para a BraCVAM
- **THEN** o sistema abre um modal amplo com o conteúdo de triagem já carregando o processo selecionado

#### Scenario: Modal usa a área disponível

- **WHEN** o modal de análise é aberto
- **THEN** ele ocupa 85% da largura e da altura da viewport e distribui o conteúdo interno por toda essa área

#### Scenario: Carregamento da proposta é interrompido

- **WHEN** a requisição incorporada é abortada por uma remontagem controlada ou excede o tempo limite
- **THEN** o sistema reinicia a carga quando aplicável ou apresenta uma falha recuperável com ação para tentar novamente, sem permanecer indefinidamente no estado de carregamento

#### Scenario: Decisão final permanece disponível

- **WHEN** a BraCVAM revisa a submissão no modal
- **THEN** o painel mantém visíveis as opções Aprovado, Solicitar correção e Reprovado, a justificativa e a ação de confirmação

#### Scenario: Pessoa consulta o histórico da submissão

- **WHEN** a pessoa aciona Histórico no modal de análise
- **THEN** o sistema orienta que o botão alterna entre análise e histórico, apresenta os eventos com rótulos compreensíveis em uma linha do tempo de pontos conectados e destaca o evento mais recente com uma onda circular animada

#### Scenario: Cartão está em Novas submissões

- **WHEN** um cartão é apresentado na coluna Novas submissões
- **THEN** o sistema mantém Analisar habilitado e permite abrir o workspace, mesmo que a tarefa `triage_evaluation` ou a pré-avaliação ainda não estejam disponíveis

#### Scenario: Análise pertence ao proponente

- **WHEN** a tarefa corrente exige correção do proponente
- **THEN** Analisar permanece desabilitado e nenhum modal de triagem é aberto

### Requirement: Quadro sem rolagem horizontal

O Kanban SHALL distribuir todas as colunas configuradas por toda a largura horizontal disponível. O quadro MUST NOT criar rolagem lateral; as colunas MUST reduzir sua largura de forma fluida e preservar a rolagem vertical de seus cartões.

#### Scenario: Todas as colunas ocupam o quadro

- **WHEN** o Kanban é apresentado
- **THEN** todas as colunas dividem a largura disponível sem ultrapassar horizontalmente o contêiner

#### Scenario: Largura disponível diminui

- **WHEN** a área de conteúdo fica mais estreita
- **THEN** as colunas se comprimem proporcionalmente sem adicionar rolagem horizontal ao quadro

### Requirement: Kanban sem alteração manual de estado

O Kanban SHALL ser uma visualização somente leitura dos estados dos processos. O sistema MUST NOT oferecer drag-and-drop, seletor de estado ou qualquer outra ação que permita à equipe BraCVAM ou a outra pessoa alterar manualmente o estado de um processo pelo quadro.

#### Scenario: Pessoa interage com um cartão

- **WHEN** a pessoa aponta, toca, focaliza ou aciona um cartão
- **THEN** o sistema permite consultar o processo, mas não oferece uma operação para mudar seu estado

#### Scenario: Estado muda pelo fluxo do sistema

- **WHEN** uma atividade do fluxo altera o estado do processo na API
- **THEN** o Kanban não envia nenhuma solicitação adicional de alteração de estado

### Requirement: Sincronização dos estados exibidos

O sistema SHALL tratar os processos e as tarefas retornados pela API como fontes de verdade e SHALL revalidar periodicamente os dois conjuntos completos enquanto o quadro estiver visível. Quando uma revalidação concluída alterar o ciclo de vida, a fase, a atividade, a rodada ou a responsabilidade, o sistema MUST recalcular a macroetapa, reposicionar automaticamente o cartão e atualizar as contagens sem exigir ação manual.

#### Scenario: Processo avança no fluxo

- **WHEN** uma revalidação completa retorna um novo estado para um processo já exibido
- **THEN** o sistema move visualmente o cartão para a coluna do novo estado e atualiza as contagens afetadas

#### Scenario: Processo é criado ou deixa de ser acessível

- **WHEN** uma revalidação completa altera o conjunto de processos acessíveis
- **THEN** o sistema adiciona ou remove os cartões correspondentes e atualiza as contagens

#### Scenario: Revalidação falha

- **WHEN** não é possível concluir a atualização periódica do quadro
- **THEN** o sistema preserva o último conjunto completo, informa que os dados podem estar desatualizados e permite tentar novamente

### Requirement: Proteção da integração do Kanban

O navegador MUST usar somente rotas internas da aplicação para consultar processos. A aplicação MUST manter a credencial de sessão e a URL da API externa no servidor e MUST tratar ausência de sessão e falta de autorização sem revelar dados dos processos.

#### Scenario: Pessoa sem autorização abre o Kanban

- **WHEN** uma pessoa sem permissão para consultar processos tenta carregar o quadro
- **THEN** o sistema não apresenta cartões ou metadados administrativos e comunica que o acesso não é permitido

#### Scenario: Consulta usa integração interna

- **WHEN** o quadro carrega ou revalida os processos
- **THEN** o navegador consulta uma rota interna sem receber a URL externa ou a credencial de sessão

### Requirement: Retorno amplo para o proponente

O sistema SHALL apresentar a revisão do retorno em um modal amplo que aproveite a viewport e SHALL separar, em telas largas, a decisão e os avisos da equipe BraCVAM do formulário tabulado. Depois que o proponente escolher corrigir a submissão, o sistema SHALL permitir a edição somente dos campos marcados pela BraCVAM como `NEEDS_REVISION` ou `REJECTED`, mantendo os demais visíveis apenas para consulta.

#### Scenario: Proponente consulta um retorno da BraCVAM

- **WHEN** o proponente abre uma submissão devolvida para revisão ou correção
- **THEN** o modal ocupa aproximadamente 94% da largura e 92% da altura disponíveis, mantém avisos e decisão em uma lateral e usa a área restante para o formulário

#### Scenario: Proponente corrige somente os campos sinalizados

- **WHEN** o proponente escolhe `REVISE` e abre a nova rodada de correção
- **THEN** somente os campos com parecer `NEEDS_REVISION` ou `REJECTED` ficam editáveis, enquanto campos aprovados ou sem parecer continuam visíveis e bloqueados

#### Scenario: Nova rodada é liberada para correção

- **WHEN** a API confirma a escolha `REVISE`
- **THEN** o modal de retorno é fechado, as listas são atualizadas, a aba Rascunhos é selecionada e o proponente pode abrir o formulário para salvar ou reenviar, sem indicar que a correção já chegou à BraCVAM

### Requirement: Entrada na área de submissões

O sistema SHALL selecionar Nova submissão como a aba inicial sempre que a página de submissões for carregada.

#### Scenario: Proponente abre a página de submissões

- **WHEN** a página de submissões conclui sua abertura inicial
- **THEN** a aba Nova submissão está selecionada e apresenta os tipos de formulário disponíveis
