## MODIFIED Requirements

### Requirement: Criação imediata do rascunho

O sistema SHALL solicitar um título significativo antes de criar a instância técnica necessária ao formulário. A criação MUST ocorrer somente depois que a pessoa selecionar um template e informar um título entre 3 e 255 caracteres; o sistema MUST NOT fabricar títulos sequenciais no formato `<template_key>-001` e MUST NOT persistir os valores digitados no formulário antes da ação Salvar rascunho.

#### Scenario: Template selecionado

- **WHEN** a pessoa seleciona um template disponível
- **THEN** o sistema apresenta a etapa de identificação da submissão antes de criar o processo

#### Scenario: Título válido informado

- **WHEN** a pessoa confirma um título válido para o template selecionado
- **THEN** o sistema cria um processo em `SUBMISSION` com o título informado e carrega seu formulário inicial

#### Scenario: Título inválido

- **WHEN** a pessoa tenta continuar com um título vazio ou fora dos limites aceitos
- **THEN** o sistema não cria o processo e identifica a correção necessária

#### Scenario: Criação não pode ser concluída

- **WHEN** a API rejeita ou não conclui a criação do processo
- **THEN** o sistema não apresenta um formulário editável sem vínculo persistido, preserva o título informado e comunica a falha

#### Scenario: Confirmação repetida durante a criação

- **WHEN** a criação de um rascunho já está em andamento
- **THEN** o sistema impede uma segunda solicitação concorrente para a mesma interação

### Requirement: Formulário dinâmico em popup

O sistema SHALL abrir o formulário inicial do processo em um popup, SHALL agrupar os campos pelas seções definidas no backend e SHALL ordenar seções e campos conforme a definição recebida. O sistema MUST representar rótulo, orientação, obrigatoriedade, opções, regras aplicáveis e a existência de avaliação por IA sem declarar localmente um formulário fixo para cada template.

#### Scenario: Formulário carregado

- **WHEN** o rascunho é criado ou retomado e a API retorna a definição do formulário
- **THEN** o popup apresenta seções e campos suportados na ordem definida e preenche valores já persistidos quando existirem

#### Scenario: Campo possui avaliação por IA

- **WHEN** a definição informa uma avaliação publicada associada a um campo
- **THEN** o sistema identifica visualmente que esse campo participa da pré-avaliação automática sem revelar a configuração interna ao proponente

#### Scenario: Tipo de campo ainda não suportado

- **WHEN** a definição contém um tipo que a interface ainda não pode persistir com segurança
- **THEN** o sistema mantém o campo identificável, informa a limitação e não fabrica um valor incompatível

#### Scenario: Seleção de arquivo

- **WHEN** a definição contém `file_upload` e a pessoa seleciona um arquivo compatível com `allowed_extensions` e `max_size_mb`
- **THEN** o sistema envia o anexo ao campo correspondente pela integração interna e apresenta a referência confirmada pela API

#### Scenario: Arquivo incompatível

- **WHEN** o arquivo selecionado viola a extensão ou o tamanho definidos pelo campo
- **THEN** o sistema rejeita a seleção, explica a regra aplicável e não inclui a referência no envio

#### Scenario: Arquivo persistido no rascunho

- **WHEN** a pessoa retoma um rascunho que possui anexo confirmado
- **THEN** o sistema apresenta nome e metadados disponíveis e permite baixar ou remover o arquivo conforme o contrato

#### Scenario: Remoção de arquivo

- **WHEN** a pessoa remove um anexo de um formulário ainda editável e a API confirma a operação
- **THEN** o sistema limpa a referência do campo sem alterar os demais valores do rascunho

#### Scenario: Fechamento do popup

- **WHEN** a pessoa fecha o popup
- **THEN** o sistema encerra a interação sem apagar o processo em rascunho já criado

### Requirement: Envio da submissão para análise

O sistema SHALL apresentar Enviar para análise ao lado de Salvar rascunho enquanto o formulário não estiver submetido. Ao acionar o envio, o sistema MUST enviar os valores atuais ao endpoint de conclusão, MUST impedir salvamento ou envio concorrente e MUST refletir o estado do processo devolvido ou posteriormente consultado, inclusive `AI_PRE_EVALUATION` quando houver avaliações associadas.

#### Scenario: Envio aceito com avaliação por IA

- **WHEN** a pessoa envia valores válidos e ao menos uma avaliação publicada está associada ao formulário
- **THEN** o sistema conclui o formulário, fecha o popup, remove o processo de Meus rascunhos e apresenta a pré-avaliação em andamento

#### Scenario: Envio aceito sem avaliação por IA

- **WHEN** a pessoa envia valores válidos e nenhuma avaliação publicada está associada ao formulário
- **THEN** o sistema conclui o formulário, fecha o popup, remove o processo de Meus rascunhos e apresenta que o processo seguiu para triagem

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

### Requirement: Acompanhamento das submissões enviadas

O sistema SHALL listar na aba Submissões os processos do proponente cujo formulário atual esteja concluído. Meus rascunhos MUST conter os formulários atuais ainda abertos, incluindo correções salvas de processos enviados anteriormente. Uma submissão devolvida permanece em Submissões até a pessoa salvar a correção como rascunho; depois disso, MUST aparecer em Meus rascunhos com o resultado da avaliação preservado para orientar a revisão.

#### Scenario: Submissões disponíveis

- **WHEN** a pessoa possui processos enviados como proponente
- **THEN** o sistema apresenta cada processo na aba Submissões com código, título, tipo e estado atual

#### Scenario: Submissão recém-enviada

- **WHEN** o backend aceita o envio do formulário
- **THEN** o sistema abre a aba Submissões, remove o processo de Meus rascunhos e atualiza a lista de enviados

#### Scenario: Processo avança no fluxo

- **WHEN** uma submissão do proponente assume um estado posterior
- **THEN** o processo continua disponível na aba Submissões com o novo estado

#### Scenario: Processo retorna para correção

- **WHEN** uma pré-avaliação negativa ou uma decisão de triagem devolve o processo para `SUBMISSION`
- **THEN** o processo permanece na aba Submissões com a indicação de correção pendente até o salvamento explícito como rascunho

#### Scenario: Correção é movida para rascunhos

- **WHEN** a pessoa salva a correção como rascunho
- **THEN** o sistema fecha o modal, abre Meus rascunhos e lista ali o processo com indicação de correção

#### Scenario: Correção em rascunho é retomada

- **WHEN** a pessoa aciona Retomar edição em uma correção salva
- **THEN** o sistema restaura o modal ampliado, o painel laranja, os pontos pendentes e as respostas salvas individualmente

#### Scenario: Nenhuma submissão enviada

- **WHEN** a pessoa não possui processos enviados como proponente
- **THEN** a aba informa que ainda não existem submissões enviadas

#### Scenario: Falha ao consultar submissões

- **WHEN** a listagem de processos enviados não pode ser concluída
- **THEN** o sistema comunica a falha e oferece uma ação para tentar novamente

### Requirement: Proteção da integração de submissões

O navegador MUST acessar somente Route Handlers internos para consultar templates e processos, criar processos, obter formulários, salvar valores, enviar, baixar ou remover anexos, concluir a submissão, acompanhar a pré-avaliação e solicitar revisão humana direta. A URL externa e a credencial de sessão MUST permanecer no servidor.

#### Scenario: Sessão ausente

- **WHEN** uma operação de submissão é solicitada sem sessão válida
- **THEN** o sistema não retorna dados do template, processo ou avaliação e comunica a necessidade de autenticação

#### Scenario: Integração protegida

- **WHEN** a interface executa uma operação do fluxo de submissão
- **THEN** a requisição do navegador usa uma rota interna sem receber a URL externa ou o cookie da API

## ADDED Requirements

### Requirement: Acompanhamento assíncrono da pré-avaliação

O sistema SHALL acompanhar a execução assíncrona da pré-avaliação enquanto o processo estiver em `AI_PRE_EVALUATION`. A consulta automática MUST evitar requisições sobrepostas, pausar quando a página não estiver visível e permitir atualização manual.

#### Scenario: Pré-avaliação em andamento

- **WHEN** o backend ainda processa a submissão
- **THEN** o sistema apresenta o estado em andamento e consulta novamente após um intervalo controlado

#### Scenario: Página deixa de estar visível

- **WHEN** a pessoa alterna para outra aba do navegador durante o processamento
- **THEN** o sistema pausa as consultas automáticas e retoma ao recuperar visibilidade

#### Scenario: Resultado positivo

- **WHEN** a pré-avaliação termina com resultado positivo
- **THEN** o sistema atualiza o processo para triagem e apresenta um resumo do resultado ao proponente

#### Scenario: Falha de consulta

- **WHEN** uma consulta de acompanhamento falha temporariamente
- **THEN** o sistema preserva o último estado conhecido e oferece nova tentativa sem declarar conclusão

### Requirement: Tratamento de pré-avaliação negativa

O sistema SHALL apresentar ao proponente um resumo por campo e por critério quando a pré-avaliação ou a triagem devolver o processo para correção. Cada campo apontado pela BraCVAM MUST exibir de forma destacada o parecer `NEEDS_REVISION` ou `REJECTED` e seu comentário, e o resumo do retorno MUST permitir navegar diretamente para esses pontos. Durante a correção, somente os campos apontados MUST aceitar edição. A ação Confirmar e reenviar MUST permanecer desabilitada até que todos os campos apontados tenham sido alterados e o formulário esteja válido. Ao confirmar, o sistema MUST concluir o novo envio, mantendo o processo em Submissões.

O retorno da BraCVAM MUST apresentar somente a ação Iniciar correção, sem perguntar como o proponente deseja prosseguir e sem solicitar justificativa. Essa ação SHALL registrar `REVISE`, iniciar a etapa de correção e liberar o formulário como rascunho, sem reenviá-lo na mesma operação. O contexto visual de correção MUST permanecer ativo enquanto o processo estiver `awaiting_correction`, usando aproximadamente 85% da largura da viewport e mantendo visíveis o resumo lateral e os destaques dos campos apontados. A aplicação SHALL preservar no navegador o snapshot dos pareceres recebido antes de `REVISE` enquanto a API não os expuser na nova rodada, isolando-o por processo e removendo-o depois do reenvio. Cada campo corrigível SHALL oferecer Salvar resposta e Editar. Salvar resposta MUST persistir os valores atuais antes de bloquear o campo, removê-lo da lista pendente e reduzir a contagem; Editar MUST liberar o campo, devolvê-lo à lista e restaurar a contagem. O formulário de correção SHALL oferecer Salvar rascunho da correção, persistindo pela operação de salvamento do formulário todos os valores atuais sem concluir a submissão. A pessoa MUST poder fechar e retomar esse rascunho com os valores persistidos e os apontamentos da BraCVAM ainda visíveis no mesmo navegador.

#### Scenario: Resultado negativo recebido

- **WHEN** a pré-avaliação termina com critérios não atendidos
- **THEN** o sistema mostra o resultado, identifica os pontos que exigem atenção e reabre a edição do formulário

#### Scenario: Proponente inicia a correção obrigatória

- **WHEN** a pessoa aciona Iniciar correção em uma submissão devolvida
- **THEN** o sistema registra `REVISE` sem solicitar escolha ou justificativa, libera os campos apontados como rascunho e mantém a proposta sem reenvio até uma confirmação posterior

#### Scenario: Pontos da BraCVAM são apresentados

- **WHEN** a triagem devolve a submissão com pareceres por campo
- **THEN** o sistema apresenta no resumo e junto a cada campo apontado o resultado, o comentário e uma ação de navegação para o ponto correspondente

#### Scenario: Contexto visual permanece durante a correção

- **WHEN** o retorno já foi aceito e o processo permanece aguardando correção
- **THEN** o modal continua ampliado para aproximadamente 85% da viewport e mantém o painel dos apontamentos visível

#### Scenario: Rascunho da correção é salvo

- **WHEN** a pessoa altera parte dos campos apontados e aciona Salvar rascunho da correção
- **THEN** o sistema persiste os valores atuais sem concluir o formulário, mantém o processo em Submissões e confirma que a correção pode ser retomada

#### Scenario: Correção parcial é retomada

- **WHEN** a pessoa reabre uma correção salva anteriormente
- **THEN** o sistema carrega os valores persistidos, mantém os pareceres da BraCVAM visíveis e permite continuar a edição dos campos apontados

#### Scenario: Correção concluída é reenviada

- **WHEN** a pessoa altera todos os campos apontados e aciona Confirmar e reenviar
- **THEN** o sistema conclui o novo envio, preserva o histórico anterior e inicia uma nova passagem pelo fluxo aplicável sem mover o processo para Meus rascunhos

#### Scenario: Correção ainda incompleta

- **WHEN** ao menos um campo apontado permanece com o valor devolvido ou o formulário corrigido é inválido
- **THEN** o sistema mantém Confirmar e reenviar desabilitado

#### Scenario: Campo não apontado pela BraCVAM

- **WHEN** o formulário de correção contém um campo sem parecer `NEEDS_REVISION` ou `REJECTED`
- **THEN** o sistema apresenta esse campo somente para consulta

#### Scenario: Correção de campo é salva

- **WHEN** a pessoa altera um campo apontado e aciona Salvar resposta
- **THEN** o sistema persiste os valores atuais, bloqueia o campo, remove o ponto da lista lateral e reduz em um a contagem pendente da seção

#### Scenario: Correção salva volta à edição

- **WHEN** a pessoa aciona Editar em um campo com correção salva
- **THEN** o sistema libera o campo, devolve o ponto à lista lateral e acrescenta novamente um ponto à contagem pendente

### Requirement: Solicitação de revisão humana direta

O sistema SHALL permitir que o proponente encaminhe para triagem humana uma submissão devolvida pela pré-avaliação, com justificativa opcional. A solicitação MUST preservar o relatório automático e MUST impedir confirmações concorrentes.

#### Scenario: Revisão direta solicitada

- **WHEN** a pessoa confirma o encaminhamento direto de uma submissão elegível
- **THEN** o sistema envia a solicitação uma única vez e acompanha o processo em `TRIAGE`

#### Scenario: Processo não é elegível

- **WHEN** a pessoa tenta solicitar revisão direta para um processo que não está aguardando correção após IA
- **THEN** o sistema não simula sucesso e informa que o estado atual não permite a operação

### Requirement: Integração com o fluxo assíncrono publicado

O sistema SHALL usar os contratos publicados de pré-avaliação, feedback e revisão humana direta para reproduzir o fluxo demonstrado ao proponente. A aplicação MUST acompanhar os estados devolvidos pela API e MUST NOT reintroduzir avaliação imediata, inferir resultados ou simular mudanças de estado no cliente.

#### Scenario: Contratos assíncronos são utilizados

- **WHEN** uma submissão entra em pré-avaliação ou solicita revisão humana direta
- **THEN** o sistema usa os endpoints correspondentes do processo e apresenta o estado confirmado pelo backend

#### Scenario: Operação do fluxo falha

- **WHEN** uma consulta ou mutação de pré-avaliação é rejeitada ou fica indisponível
- **THEN** o sistema preserva o último estado confirmado, comunica a falha e não fabrica resultado ou transição

## REMOVED Requirements

### Requirement: Exclusão confirmada de rascunho

**Reason**: Nem a API publicada nem o contrato de desenvolvimento disponibilizam exclusão de processos; manter a ação produz uma operação que sempre falha.

**Migration**: Remover a ação e a integração interna de exclusão, mantendo os rascunhos retomáveis. A função poderá retornar em uma mudança futura quando o backend publicar um contrato explícito e autorizado.

#### Scenario: Rascunho permanece retomável

- **WHEN** a pessoa visualiza seus rascunhos enquanto não existe contrato de exclusão
- **THEN** o sistema não apresenta a ação Excluir e mantém a ação Retomar edição
