## Purpose

Permitir que cada pessoa autenticada acompanhe avisos destinados a ela, reconheça itens pendentes e navegue com segurança ao contexto relacionado sem ampliar suas autorizações.

## ADDED Requirements

### Requirement: Indicador global de alerts não lidos

O sistema SHALL apresentar no header autenticado um controle de alerts com nome acessível e a contagem total de itens não lidos da pessoa atual. A contagem MUST ser obtida pela rota interna da aplicação, MUST refletir o total global independentemente da página ou filtro consultado e MUST ser atualizada ao carregar a área autenticada, após ações de leitura, durante a navegação e por consulta periódica enquanto a sessão permanecer ativa.

#### Scenario: Pessoa possui alerts não lidos

- **WHEN** uma pessoa autenticada possui um ou mais alerts não lidos
- **THEN** o header apresenta o sininho com a contagem total e um nome acessível que comunica a existência desses itens

#### Scenario: Pessoa não possui alerts não lidos

- **WHEN** a consulta informa contagem igual a zero
- **THEN** o controle continua acessível e não apresenta um selo que sugira pendências

#### Scenario: Atualização sem tempo real

- **WHEN** a área autenticada permanece aberta sem navegação
- **THEN** o sistema atualiza periodicamente a contagem sem depender de push ou WebSocket e sem realizar consultas em intervalo inferior a sessenta segundos

#### Scenario: Falha ao atualizar o contador

- **WHEN** uma atualização periódica falha após uma contagem válida ter sido apresentada
- **THEN** o sistema não encerra a sessão, não exibe dados de outra pessoa e reconcilia o contador em uma consulta posterior

### Requirement: Central paginada de alerts

O sistema SHALL permitir abrir pelo header uma central com os alerts do usuário em ordem decrescente de criação. A central MUST oferecer as visões localizadas Não lidos e Todos, respeitar a paginação publicada pela API e distinguir visual e semanticamente itens lidos e não lidos.

#### Scenario: Abertura da central

- **WHEN** a pessoa aciona o controle de alerts
- **THEN** o sistema apresenta a primeira página da visão selecionada, a contagem global de não lidos e controles acessíveis para filtrar e paginar

#### Scenario: Filtro de não lidos

- **WHEN** a pessoa seleciona a visão Não lidos
- **THEN** o sistema solicita somente itens não lidos e mantém a contagem global independente do filtro

#### Scenario: Página sem itens

- **WHEN** a página ou o filtro selecionado não possui alerts
- **THEN** o sistema apresenta um estado vazio localizado sem tratar a resposta como erro

#### Scenario: Falha de listagem

- **WHEN** não é possível consultar a página solicitada
- **THEN** o sistema mantém o shell operacional, apresenta uma mensagem segura e oferece uma ação de nova tentativa

### Requirement: Leitura individual idempotente

O sistema SHALL permitir marcar um alert pertencente à sessão como lido e MUST reconciliar o item e o contador com a resposta do servidor. Abrir um alert MUST iniciar a marcação como lido sem bloquear a navegação ao destino, e repetir a operação em um item já lido MUST preservar a data original de leitura.

#### Scenario: Pessoa abre um alert não lido

- **WHEN** a pessoa aciona um alert não lido
- **THEN** o sistema inicia a marcação como lido, atualiza a apresentação e segue para o destino sem aguardar a conclusão da mutação

#### Scenario: Marcação falha durante a navegação

- **WHEN** a marcação como lido falha
- **THEN** o sistema permite que a navegação prossiga e reconcilia posteriormente o estado do item e a contagem com o servidor

#### Scenario: Alert já estava lido

- **WHEN** a pessoa abre novamente um alert com `read_at` preenchido
- **THEN** o sistema permite a navegação sem alterar a data original de leitura

### Requirement: Marcação coletiva de leitura

O sistema SHALL oferecer uma ação destacada para marcar todos os alerts da pessoa como lidos. Após a confirmação do servidor, a interface MUST zerar o contador, remover os itens da visão Não lidos e informar de forma localizada quantos itens foram atualizados.

#### Scenario: Existem vários alerts não lidos

- **WHEN** a pessoa aciona Marcar todos como lidos e o servidor confirma a operação
- **THEN** o sistema zera o selo, atualiza a lista e comunica a quantidade efetivamente alterada

#### Scenario: Nenhum alert precisa ser atualizado

- **WHEN** o servidor responde que zero itens foram alterados
- **THEN** o sistema mantém o contador zerado e comunica que não havia novas pendências

#### Scenario: Marcação coletiva falha

- **WHEN** a operação de marcar todos como lidos é rejeitada ou fica indisponível
- **THEN** o sistema preserva ou restaura o estado confirmado anteriormente e apresenta uma mensagem segura de falha

### Requirement: Mensagens localizadas e extensíveis

O sistema SHALL montar o texto de cada alert conhecido a partir de `kind`, códigos estáveis e `params`, com conteúdo equivalente em português do Brasil e inglês. O sistema MUST preservar sem tradução automática nomes próprios, títulos, códigos e conteúdo institucional recebidos do backend, MUST usar os rótulos localizados já adotados para cargos e estados e MUST apresentar uma mensagem genérica localizada para tipos futuros desconhecidos.

#### Scenario: Tipo conhecido no locale ativo

- **WHEN** um alert possui `kind` e parâmetros reconhecidos
- **THEN** o sistema apresenta a mensagem correspondente no locale ativo sem modificar os identificadores enviados pela API

#### Scenario: Tarefa reaberta

- **WHEN** um alert `task_opened` possui `run_number` maior que um e não corresponde a uma mensagem mais específica
- **THEN** o sistema comunica no locale ativo que a atividade foi reaberta

#### Scenario: Tipo futuro desconhecido

- **WHEN** o backend devolve um `kind` que o frontend ainda não conhece
- **THEN** o sistema mostra uma mensagem genérica com o código do processo e mantém a navegação baseada no `target`

#### Scenario: Parâmetro opcional ausente

- **WHEN** um parâmetro opcional como prazo ou laboratório não está presente
- **THEN** o sistema omite apenas o trecho dependente desse dado e não exibe valores técnicos como `null` ou `undefined`

### Requirement: Datas no locale e fuso da pessoa

O sistema SHALL interpretar como UTC as datas de alert documentadas pelo backend, inclusive durante a compatibilidade temporária com timestamps sem sufixo de fuso, e MUST apresentá-las conforme o locale e o fuso do navegador. Valores inválidos MUST ser omitidos sem impedir a apresentação do restante do alert.

#### Scenario: Data UTC sem offset durante a compatibilidade

- **WHEN** o backend devolve `due_date` no formato ISO 8601 sem `Z` ou offset conforme o contrato temporário
- **THEN** o sistema interpreta o instante como UTC antes de formatá-lo no fuso da pessoa

#### Scenario: Data com offset explícito

- **WHEN** o backend devolve uma data com `Z` ou offset explícito
- **THEN** o sistema preserva o instante declarado e o formata no locale e fuso ativos

#### Scenario: Data inválida

- **WHEN** uma data opcional não pode ser interpretada com segurança
- **THEN** o sistema não apresenta o prazo e mantém o restante da mensagem utilizável

### Requirement: Navegação segura ao destino

O sistema SHALL resolver `target.type` para uma rota interna apropriada ao módulo e à autorização atuais. Para tarefas, o sistema MUST consultar os detalhes por uma rota interna e usar `activity_key` para selecionar o workspace; para processos, MUST abrir o contexto compatível com a pessoa; para recebimento de amostras, MUST abrir o processo e localizar o frasco indicado. A leitura de um alert MUST NOT conceder acesso adicional ao destino.

#### Scenario: Alert aponta para uma tarefa

- **WHEN** a pessoa abre um alert com `target.type` igual a `task`
- **THEN** o sistema consulta a tarefa pelo identificador e navega ao workspace correspondente ao `activity_key` e ao processo

#### Scenario: Alert aponta para um processo

- **WHEN** a pessoa abre um alert com `target.type` igual a `process`
- **THEN** o sistema abre o contexto do processo adequado ao módulo autenticado sem presumir uma permissão que não foi publicada

#### Scenario: Alert aponta para um frasco

- **WHEN** a pessoa abre um alert com `target.type` igual a `sample_receipt`
- **THEN** o sistema abre o recebimento de amostras do processo e tenta localizar ou destacar o frasco indicado por `target.id`

#### Scenario: Destino deixou de estar disponível

- **WHEN** a consulta ou a tela do destino responde que o objeto não existe ou não está mais ao alcance da sessão
- **THEN** o sistema informa que o item não está mais disponível, mantém o alert no histórico e não revela se houve remoção ou perda de autorização

#### Scenario: Target futuro desconhecido

- **WHEN** o backend devolve um `target.type` que o frontend ainda não consegue resolver
- **THEN** o sistema preserva o alert na lista, informa que o destino ainda não está disponível e não constrói uma URL externa

### Requirement: Mediação autenticada e minimização de dados

O sistema SHALL acessar a API externa de alerts e tarefas exclusivamente no servidor por rotas internas autenticadas. As mutações MUST encaminhar uma origem válida conforme o contrato do backend, os identificadores e filtros MUST ser validados antes da chamada externa e respostas inválidas MUST ser rejeitadas com mensagens seguras sem expor URL externa, cookie, credenciais ou conteúdo sensível.

#### Scenario: Consulta autenticada válida

- **WHEN** a pessoa consulta seus alerts por uma rota interna com sessão válida
- **THEN** o servidor retorna somente o contrato normalizado destinado àquela sessão sem expor a configuração da API externa

#### Scenario: Escrita com origem inválida

- **WHEN** uma mutação chega à rota interna sem uma origem HTTP válida e confiável
- **THEN** o sistema recusa a operação sem encaminhar credenciais à API externa

#### Scenario: Alert pertence a outra pessoa

- **WHEN** a sessão tenta marcar um identificador inexistente ou pertencente a outra pessoa
- **THEN** o sistema apresenta a mesma resposta segura de item indisponível nos dois casos

#### Scenario: Resposta externa malformada

- **WHEN** a API externa devolve uma estrutura incompatível com o contrato esperado
- **THEN** o sistema não renderiza dados parciais inseguros e apresenta uma falha genérica recuperável

### Requirement: Acessibilidade e adaptação da central

O sistema SHALL manter o controle, o painel, os filtros, os itens, a paginação e as ações da central operáveis por teclado e tecnologia assistiva. A central MUST gerenciar foco ao abrir e fechar, anunciar mudanças relevantes sem repetição excessiva, adaptar-se a telas estreitas e respeitar preferência por movimento reduzido.

#### Scenario: Uso completo por teclado

- **WHEN** a pessoa abre, percorre e fecha a central usando somente o teclado
- **THEN** o foco permanece visível, segue uma ordem previsível e retorna ao sininho ao encerrar o painel

#### Scenario: Atualização do contador para tecnologia assistiva

- **WHEN** uma ação de leitura altera a contagem de não lidos
- **THEN** o sistema anuncia a mudança de forma concisa sem transferir o foco inesperadamente

#### Scenario: Tela estreita

- **WHEN** a central é aberta em um viewport estreito
- **THEN** itens, mensagens e ações permanecem legíveis e operáveis sem rolagem horizontal obrigatória

