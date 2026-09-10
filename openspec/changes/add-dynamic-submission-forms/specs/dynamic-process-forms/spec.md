## Purpose

Permitir que o proponente descubra os tipos de submissão disponíveis, salve explicitamente seu preenchimento e retome rascunhos próprios em um formulário definido pelo backend.

## ADDED Requirements

### Requirement: Catálogo de templates de submissão

O sistema SHALL apresentar os templates ativos disponíveis para uma nova submissão. Cada opção MUST identificar seu nome e sua descrição sem expor a definição interna completa como substituta do formulário.

#### Scenario: Templates disponíveis

- **WHEN** a pessoa autenticada abre a página Submissões e existem templates ativos
- **THEN** o sistema apresenta uma opção selecionável para cada template com nome e descrição

#### Scenario: Catálogo vazio

- **WHEN** a consulta é concluída sem templates ativos
- **THEN** o sistema informa que não existem tipos de submissão disponíveis

#### Scenario: Falha ao consultar templates

- **WHEN** o catálogo não pode ser carregado
- **THEN** o sistema comunica a falha e oferece uma ação para tentar novamente

### Requirement: Criação imediata do rascunho

O sistema SHALL criar uma instância técnica assim que a pessoa selecionar um template, pois os campos dependem dessa instância. Enquanto a renomeação de processos não estiver disponível, o sistema MUST enviar um título automático no formato `<template_key>-001`, mas MUST NOT persistir os valores digitados antes da ação Salvar rascunho.

#### Scenario: Template selecionado

- **WHEN** a pessoa seleciona um template disponível
- **THEN** o sistema cria um processo em rascunho com o template escolhido e carrega seu formulário inicial

#### Scenario: Criação não pode ser concluída

- **WHEN** a API rejeita ou não conclui a criação do processo
- **THEN** o sistema não apresenta um formulário editável sem vínculo persistido e informa a falha

#### Scenario: Seleção repetida durante a criação

- **WHEN** a criação de um rascunho já está em andamento
- **THEN** o sistema impede uma segunda solicitação concorrente para a mesma interação

### Requirement: Formulário dinâmico em popup

O sistema SHALL abrir o formulário inicial do processo em um popup e SHALL ordenar os campos conforme a definição recebida. O sistema MUST representar rótulo, orientação, obrigatoriedade, opções e regras aplicáveis sem declarar localmente um formulário fixo para cada template.

#### Scenario: Formulário carregado

- **WHEN** o rascunho é criado e a API retorna a definição do formulário
- **THEN** o popup apresenta os campos suportados na ordem definida e preenche valores já persistidos quando existirem

#### Scenario: Tipo de campo ainda não suportado

- **WHEN** a definição contém um tipo que a interface ainda não pode persistir com segurança
- **THEN** o sistema mantém o campo identificável, informa a limitação e não fabrica um valor incompatível

#### Scenario: Seleção de arquivo

- **WHEN** a definição contém `file_upload` e a pessoa seleciona um arquivo compatível com `allowed_extensions` e `max_size_mb`
- **THEN** o sistema mantém sua referência durante a edição e a inclui nos valores da submissão final

#### Scenario: Arquivo incompatível

- **WHEN** o arquivo selecionado viola a extensão ou o tamanho definidos pelo campo
- **THEN** o sistema rejeita a seleção, explica a regra aplicável e não inclui a referência no envio

#### Scenario: Arquivo em rascunho

- **WHEN** a pessoa seleciona um arquivo e aciona Salvar rascunho
- **THEN** o sistema salva os demais valores, mantém a seleção somente no popup atual e informa que a API não persiste anexos em rascunho

#### Scenario: Fechamento do popup

- **WHEN** a pessoa fecha o popup
- **THEN** o sistema encerra a interação sem apagar o processo em rascunho já criado

### Requirement: Salvamento parcial do formulário

O sistema SHALL permitir salvar valores parciais do formulário enquanto ele não tiver sido submetido. Os valores MUST ser enviados somente quando a pessoa acionar Salvar rascunho. O nome preenchido que pertença à definição do formulário MUST ser incluído nos valores enviados.

#### Scenario: Rascunho salvo

- **WHEN** a pessoa aciona Salvar rascunho com valores compatíveis
- **THEN** o sistema persiste os valores pela integração interna e confirma o salvamento sem encerrar o popup

#### Scenario: Edição ainda não salva

- **WHEN** a pessoa altera um campo e ainda não acionou Salvar rascunho
- **THEN** o sistema mantém a alteração somente na interface e não envia uma atualização do formulário

#### Scenario: Rascunho inválido

- **WHEN** a API rejeita um ou mais valores parciais
- **THEN** o sistema preserva os valores digitados e apresenta uma mensagem segura para correção

#### Scenario: Formulário já submetido

- **WHEN** o formulário retornado pela API já está submetido
- **THEN** o sistema apresenta seus valores sem permitir novo salvamento de rascunho

### Requirement: Retomada dos próprios rascunhos

O sistema SHALL apresentar uma seção Meus rascunhos com processos no estado `SUBMISSION` em que a sessão autenticada possui o papel local `proponent`. Cada item MUST permitir carregar o formulário persistido e retomar sua edição.

#### Scenario: Rascunhos disponíveis

- **WHEN** a pessoa possui processos `SUBMISSION` como proponente
- **THEN** o sistema lista esses processos com identificação suficiente e uma ação Retomar edição

#### Scenario: Retomada da edição

- **WHEN** a pessoa aciona Retomar edição em um rascunho
- **THEN** o sistema abre o formulário correspondente preenchido com os valores persistidos

#### Scenario: Nenhum rascunho próprio

- **WHEN** a pessoa não possui processos `SUBMISSION` como proponente
- **THEN** a seção informa que ainda não existem rascunhos salvos

#### Scenario: Processo de outra pessoa

- **WHEN** a listagem externa contém um processo que não pertence ao escopo proponente da sessão
- **THEN** o sistema não inclui esse processo em Meus rascunhos

#### Scenario: Falha ao consultar rascunhos

- **WHEN** os rascunhos não podem ser consultados
- **THEN** o sistema comunica a falha e oferece uma ação para tentar novamente

### Requirement: Envio da submissão para análise

O sistema SHALL apresentar Enviar para análise ao lado de Salvar rascunho enquanto o formulário não estiver submetido. Ao acionar o envio, o sistema MUST enviar os valores atuais ao endpoint de conclusão e MUST impedir salvamento ou envio concorrente durante a operação.

#### Scenario: Envio aceito

- **WHEN** a pessoa aciona Enviar para análise com todos os valores obrigatórios válidos
- **THEN** o sistema conclui o formulário, fecha o popup, atualiza Meus rascunhos e confirma que a submissão foi enviada para análise

#### Scenario: Arquivo obrigatório não selecionado

- **WHEN** um campo `file_upload` obrigatório não possui referência selecionada
- **THEN** o sistema mantém o popup aberto e solicita a seleção antes de chamar a integração de conclusão

#### Scenario: Envio rejeitado

- **WHEN** o backend rejeita o envio por valores ausentes ou inválidos
- **THEN** o sistema mantém o popup aberto, preserva os valores digitados e informa que os campos devem ser revisados

#### Scenario: Operação em andamento

- **WHEN** um salvamento ou envio já está em andamento
- **THEN** o sistema desabilita ambas as ações até a operação terminar

#### Scenario: Formulário já submetido

- **WHEN** o formulário retornado já está submetido
- **THEN** o sistema não apresenta Salvar rascunho nem Enviar para análise

### Requirement: Organização da página em abas

O sistema SHALL organizar Meus rascunhos, Submissões e Nova submissão em abas distintas, mostrando somente o conteúdo da aba ativa para reduzir a rolagem vertical. As abas MUST possuir estado selecionado acessível e a área de submissões MUST ocupar toda a largura disponível dentro do layout autenticado.

#### Scenario: Aba de rascunhos

- **WHEN** a pessoa abre a página Submissões
- **THEN** o sistema apresenta Meus rascunhos como aba ativa e mantém o catálogo de templates oculto

#### Scenario: Aba de nova submissão

- **WHEN** a pessoa seleciona Nova submissão
- **THEN** o sistema apresenta o catálogo de templates e oculta a lista de rascunhos

#### Scenario: Aba de submissões

- **WHEN** a pessoa seleciona Submissões
- **THEN** o sistema apresenta seus processos enviados e oculta rascunhos e catálogo de templates

### Requirement: Acompanhamento das submissões enviadas

O sistema SHALL listar na aba Submissões os processos em que a sessão possui o papel local `proponent` e cujo estado seja diferente de `SUBMISSION`. Cada item MUST apresentar código, título, tipo e estado atual sem expor processos de outras pessoas.

#### Scenario: Submissões disponíveis

- **WHEN** a pessoa possui processos enviados como proponente
- **THEN** o sistema apresenta cada processo na aba Submissões com sua identificação e estado atual

#### Scenario: Submissão recém-enviada

- **WHEN** o backend aceita o envio do formulário
- **THEN** o sistema abre a aba Submissões, remove o processo de Meus rascunhos e atualiza a lista de enviados

#### Scenario: Processo avança no fluxo

- **WHEN** uma submissão do proponente deixa `TRIAGE` e assume outro estado posterior
- **THEN** o processo continua disponível na aba Submissões com o novo estado

#### Scenario: Nenhuma submissão enviada

- **WHEN** a pessoa não possui processos enviados como proponente
- **THEN** a aba informa que ainda não existem submissões enviadas

#### Scenario: Falha ao consultar submissões

- **WHEN** a listagem de processos enviados não pode ser concluída
- **THEN** o sistema comunica a falha e oferece uma ação para tentar novamente

### Requirement: Exclusão confirmada de rascunho

O sistema SHALL oferecer uma ação Excluir em cada rascunho e MUST solicitar confirmação em um modal próprio da aplicação antes de enviar a exclusão. O sistema MUST NOT usar a caixa de confirmação nativa do navegador e MUST remover o item da lista somente após sucesso da API.

#### Scenario: Abertura da confirmação

- **WHEN** a pessoa aciona Excluir em um rascunho
- **THEN** o sistema abre um modal que identifica o rascunho e oferece Cancelar e Excluir rascunho

#### Scenario: Exclusão cancelada

- **WHEN** a pessoa cancela ou fecha o modal
- **THEN** o sistema não envia a exclusão e mantém o rascunho na lista

#### Scenario: Exclusão confirmada com sucesso

- **WHEN** a pessoa confirma e o backend exclui o rascunho
- **THEN** o sistema fecha o modal, remove o rascunho da lista e confirma a operação

#### Scenario: Exclusão rejeitada

- **WHEN** a pessoa confirma e o backend não conclui a exclusão
- **THEN** o sistema mantém o modal e o rascunho, informando a falha sem simular sucesso

### Requirement: Proteção da integração de submissões

O navegador MUST acessar somente Route Handlers internos para consultar templates e rascunhos, criar ou excluir processos, obter formulários, salvar valores e enviar a submissão. A URL externa e a credencial de sessão MUST permanecer no servidor.

#### Scenario: Sessão ausente

- **WHEN** uma operação de submissão é solicitada sem sessão válida
- **THEN** o sistema não retorna dados do template ou processo e comunica a necessidade de autenticação

#### Scenario: Integração protegida

- **WHEN** a interface executa uma operação do fluxo de rascunho
- **THEN** a requisição do navegador usa uma rota interna sem receber a URL externa ou o cookie da API
