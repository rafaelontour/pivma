## Purpose

Permitir que a equipe BraCVAM configure, teste, versione e reutilize avaliações por IA associadas aos campos dos formulários, com controle humano e rastreabilidade do contrato executado.

## ADDED Requirements

### Requirement: Biblioteca reutilizável de avaliações

O sistema SHALL apresentar uma biblioteca pesquisável de avaliações por IA com nome, objetivo, estado e versão publicada. Uma avaliação MUST poder ser reutilizada em mais de um campo sem duplicar sua configuração.

#### Scenario: Pesquisa na biblioteca

- **WHEN** a pessoa pesquisa por nome ou objetivo
- **THEN** o sistema apresenta as avaliações correspondentes e mantém visíveis seus estados de publicação

#### Scenario: Biblioteca vazia

- **WHEN** ainda não existem avaliações cadastradas
- **THEN** o sistema explica o propósito da biblioteca e oferece criação somente à pessoa autorizada

### Requirement: Criação de avaliação em rascunho

O sistema SHALL permitir criar uma avaliação em rascunho a partir de nome e objetivo. O nome SHALL identificar a definição criada e permanecer somente para leitura depois da criação enquanto o contrato publicado não oferecer uma operação para alterá-lo. O objetivo e os critérios da versão em rascunho MUST permanecer editáveis, e rascunhos MUST NOT ser executados em submissões reais.

#### Scenario: Rascunho criado

- **WHEN** a pessoa informa nome e objetivo válidos
- **THEN** o sistema persiste uma avaliação não publicada e abre sua configuração

#### Scenario: Dados incompletos

- **WHEN** a pessoa tenta criar sem os dados obrigatórios
- **THEN** o sistema não chama a criação e identifica os campos necessários

#### Scenario: Rascunho existente é editado

- **WHEN** a pessoa autorizada abre uma versão em rascunho
- **THEN** o sistema mantém o nome da definição somente para leitura e permite alterar o objetivo e os critérios pelos endpoints versionados publicados

### Requirement: Sugestão e revisão humana de critérios

O sistema SHALL permitir solicitar sugestões de critérios a partir do objetivo e SHALL exigir revisão humana antes do teste ou da publicação. Cada critério MUST permitir editar descrição, severidade, polaridade e demais propriedades expostas pelo contrato.

#### Scenario: Sugestões recebidas

- **WHEN** o backend gera critérios para um rascunho
- **THEN** o sistema os apresenta como sugestões editáveis e não como decisão já publicada

#### Scenario: Sugestão falha

- **WHEN** a geração não pode ser concluída
- **THEN** o sistema preserva os critérios existentes e permite edição manual

### Requirement: Teste controlado da avaliação

O sistema SHALL permitir executar uma avaliação em rascunho com conteúdo de teste e SHALL mostrar a resposta estruturada, os critérios aplicados e os dados técnicos permitidos pelo backend antes da publicação.

#### Scenario: Teste concluído

- **WHEN** a pessoa envia conteúdo de teste válido
- **THEN** o sistema apresenta o resultado sem alterar uma submissão real ou o estado de qualquer processo

#### Scenario: Teste não pode ser executado

- **WHEN** o rascunho ainda não possui critérios válidos
- **THEN** o sistema bloqueia a execução e indica a configuração pendente

### Requirement: Publicação e versionamento imutável

O sistema SHALL publicar uma versão somente após validação e confirmação. Uma versão publicada MUST permanecer imutável; mudanças posteriores MUST originar novo rascunho e nova versão para preservar a rastreabilidade histórica.

#### Scenario: Versão publicada

- **WHEN** a pessoa confirma a publicação de uma avaliação válida
- **THEN** o sistema apresenta o número da versão publicada e remove ações de edição dessa versão

#### Scenario: Edição posterior solicitada

- **WHEN** a pessoa deseja alterar uma versão publicada
- **THEN** o sistema cria ou abre um novo rascunho sem modificar a versão já usada em execuções anteriores

### Requirement: Associação entre avaliações e campos

O sistema SHALL permitir associar somente versões publicadas a campos existentes do formulário. Uma atualização do conjunto de associações MUST preservar as ligações válidas não alteradas e MUST pedir resolução explícita para referências órfãs antes de removê-las.

#### Scenario: Avaliação publicada associada

- **WHEN** a pessoa escolhe uma versão publicada para um campo válido e salva
- **THEN** o sistema atualiza o conjunto de associações e confirma a versão efetivamente vinculada

#### Scenario: Avaliação em rascunho selecionada

- **WHEN** a pessoa tenta associar uma versão não publicada
- **THEN** o sistema impede a operação e informa que a publicação é necessária

#### Scenario: Associação órfã detectada

- **WHEN** o conjunto atual contém uma referência a campo ou avaliação que deixou de existir
- **THEN** o sistema identifica a referência e solicita confirmação antes de excluí-la da atualização

### Requirement: Controle de acesso às avaliações

O sistema SHALL usar `ai_evaluations.read` para leitura e `ai_evaluations.manage` para criação, alteração, teste, publicação e associação. Todas as operações do navegador MUST passar por rotas internas autenticadas.

#### Scenario: Acesso somente para leitura

- **WHEN** a sessão possui `ai_evaluations.read`, mas não `ai_evaluations.manage`
- **THEN** o sistema apresenta biblioteca e versões sem controles de mutação

#### Scenario: Mutação sem autorização

- **WHEN** uma sessão sem `ai_evaluations.manage` solicita uma operação de alteração
- **THEN** a rota interna não a executa e não devolve dados protegidos adicionais

### Requirement: Integração com avaliações configuráveis publicadas

O sistema SHALL usar os contratos publicados sob `/ai-evaluations` e os endpoints de associações para reproduzir a biblioteca, sugestão, teste, publicação e vínculos demonstrados no protótipo. A aplicação MUST preservar o modelo versionado e MUST NOT implementar uma rota de avaliação imediata fora desse fluxo.

#### Scenario: Fluxo configurável é executado

- **WHEN** uma pessoa autorizada cria, testa, publica ou associa uma avaliação
- **THEN** o sistema usa a operação publicada correspondente e apresenta somente o resultado confirmado pela API

#### Scenario: Operação configurável falha

- **WHEN** uma operação de avaliação é rejeitada ou não pode ser concluída
- **THEN** o sistema preserva o rascunho aplicável, comunica a falha e não simula publicação, versão ou associação
