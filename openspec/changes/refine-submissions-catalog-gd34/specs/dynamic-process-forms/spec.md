## MODIFIED Requirements

### Requirement: Catálogo de templates de submissão

O sistema SHALL apresentar os tipos ativos de submissão na ordem institucional fixa: Método Novo, Método Novo – Dossiê Completo, Extensão do Domínio de Aplicação e Método Similar. Cada opção MUST usar o nome e a descrição aprovados pelo BraCVAM, localizados em português do Brasil e inglês, e MUST NOT expor chaves técnicas ou apresentar a definição interna do formulário como substituta de seu preenchimento.

As descrições SHALL explicar que Método Novo é um método em desenvolvimento ou já desenvolvido cuja validação ainda não foi executada; Método Novo – Dossiê Completo é um método desenvolvido, com protocolo estabelecido e validação concluída, cujo dossiê está disponível para avaliação por pares; Extensão do Domínio de Aplicação amplia o domínio de um método já validado para nova finalidade de uso ou aplicação regulatória; e Método Similar é estrutural e funcionalmente semelhante a um método de referência validado e aceito, podendo ser candidato a validação baseada em padrões de desempenho.

O catálogo MUST NOT classificar Fitness for Purpose Validation como um tipo ou abordagem de validação independente. A Prova de Conceito MUST NOT ser oferecida para novas submissões; processos existentes dessa categoria MUST permanecer consultáveis e acompanháveis.

#### Scenario: Tipos apresentados na ordem institucional

- **WHEN** a pessoa autenticada abre Nova submissão e os tipos estão disponíveis
- **THEN** o sistema apresenta as quatro opções na ordem definida, com nomes e descrições institucionais nos dois idiomas

#### Scenario: Fitness for purpose não é uma categoria

- **WHEN** a pessoa consulta as opções e descrições do catálogo
- **THEN** Fitness for Purpose Validation não aparece como tipo ou abordagem independente, e sua relação com finalidade, relevância e confiabilidade é explicada no contexto apropriado

#### Scenario: Prova de Conceito removida para novas submissões

- **WHEN** uma pessoa inicia uma nova submissão
- **THEN** Prova de Conceito não aparece no catálogo, enquanto processos anteriores dessa categoria continuam disponíveis nas listas de acompanhamento e rascunhos

#### Scenario: Catálogo vazio

- **WHEN** a consulta é concluída sem tipos ativos
- **THEN** o sistema informa que não existem tipos de submissão disponíveis

#### Scenario: Falha ao consultar tipos

- **WHEN** o catálogo não pode ser carregado
- **THEN** o sistema comunica a falha e oferece uma ação para tentar novamente

### Requirement: Criação imediata do rascunho

O sistema SHALL solicitar uma única vez o título do método antes de criar o processo. A identificação MUST usar o rótulo e orientação “Informe o título do método novo.” no fluxo Método Novo; o título informado MUST ser reaproveitado no processo e no campo correspondente do formulário, sem exigir que a pessoa o digite novamente. O processo MUST ser criado antes de carregar o formulário, pois os campos dependem da instância persistida. O valor do título MUST permanecer recuperável quando a carga do formulário falhar e a pessoa tentar novamente.

#### Scenario: Identificação única do método

- **WHEN** a pessoa confirma o título ao iniciar um tipo de submissão
- **THEN** o processo é criado e o formulário é aberto com o mesmo título já preenchido no campo vinculado, sem uma segunda solicitação de título

#### Scenario: Retomada sem repetir o título

- **WHEN** a carga do formulário falha depois da criação do processo
- **THEN** uma nova tentativa usa o processo e o título já registrados sem criar outro processo nem solicitar o título de novo

#### Scenario: Criação não pode ser concluída

- **WHEN** a API rejeita ou não conclui a criação do processo
- **THEN** o sistema não apresenta um formulário editável sem vínculo persistido e informa a falha

#### Scenario: Seleção repetida durante a criação

- **WHEN** a criação de um rascunho já está em andamento
- **THEN** o sistema impede uma segunda solicitação concorrente para a mesma interação

### Requirement: Formulário dinâmico em popup

O sistema SHALL abrir no processo recém-criado o formulário de submissão vigente vinculado ao tipo escolhido e SHALL ordenar os campos conforme a definição recebida. O sistema MUST representar rótulo, orientação, obrigatoriedade, opções e regras aplicáveis sem declarar localmente uma definição fixa de formulário para cada tipo. O campo configurado para guardar o título do método MUST receber o título informado na identificação e MUST NOT solicitar que a pessoa o digite novamente.

#### Scenario: Formulário BraCVAM associado ao tipo

- **WHEN** a API retorna a definição vigente vinculada ao tipo de submissão escolhido
- **THEN** o popup apresenta os campos dessa versão na ordem definida e preenche valores já persistidos, inclusive o título do método

#### Scenario: Tipo sem formulário vinculado

- **WHEN** um tipo ativo não possui formulário vigente associado
- **THEN** o sistema informa que o preenchimento ainda não está disponível para esse tipo e não apresenta um formulário de outro tipo

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

### Requirement: Envio da submissão para análise

Na primeira abertura do formulário após a identificação do método, o sistema SHALL apresentar somente Salvar rascunho e MUST NOT apresentar Enviar para análise. Depois que o primeiro salvamento for concluído, o rascunho SHALL ser retomado pela aba Rascunhos e o sistema SHALL apresentar Enviar para análise ao lado de Salvar rascunho enquanto o formulário não estiver submetido. Antes da confirmação, MUST explicar quais dados do formulário serão encaminhados, qual é a finalidade e o limite de eventual pré-avaliação automatizada, que a análise técnica cabe à equipe BraCVAM, quem poderá consultar a submissão e quais etapas ocorrerão após o envio. A descrição MUST NOT sugerir que uma verificação automatizada identifica originalidade ou similaridade de métodos, nem que substitui avaliação humana, a menos que o backend publique explicitamente essa capacidade.

Ao acionar o envio, o sistema MUST enviar os valores atuais ao endpoint de conclusão e MUST impedir salvamento ou envio concorrente durante a operação. Após sucesso, o processo MUST permanecer na aba Submissões e apresentar seu código com uma explicação consistente com a regra de atribuição confirmada pelo backend. A mensagem sobre relatório MUST distinguir um relatório indisponível ou ainda não produzido de uma falha no envio e MUST informar se isso altera ou não a continuidade do fluxo.

#### Scenario: Orientação antes do envio

- **WHEN** a pessoa visualiza Enviar para análise
- **THEN** consegue consultar o conteúdo enviado, o papel da pré-avaliação automatizada quando aplicável, os responsáveis pela revisão, a visibilidade da submissão e os próximos passos

#### Scenario: Primeira abertura exige salvamento do rascunho

- **WHEN** o formulário é aberto imediatamente após a identificação do método e a criação do processo
- **THEN** o sistema apresenta somente Salvar rascunho e não permite enviar para análise nessa interação

#### Scenario: Envio disponível ao retomar o rascunho

- **WHEN** a pessoa salva o rascunho e depois o retoma pela aba Rascunhos
- **THEN** o sistema apresenta Salvar rascunho e Enviar para análise

#### Scenario: Envio aceito

- **WHEN** a pessoa aciona o envio com todos os valores obrigatórios válidos
- **THEN** o sistema conclui o formulário, fecha o popup, atualiza Rascunhos e Submissões e informa que o processo segue para análise da equipe responsável

#### Scenario: Relatório ainda não disponível

- **WHEN** não existe relatório de pré-avaliação disponível para o processo
- **THEN** o sistema explica o que essa ausência significa e se ela impede ou não a continuidade do fluxo, sem apresentá-la como falha de envio

#### Scenario: Código atribuído pelo sistema

- **WHEN** o processo recebe um código de identificação
- **THEN** o sistema informa que ele foi atribuído pelo sistema e explica seu formato ou regra somente conforme documentado e confirmado pelo backend

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
