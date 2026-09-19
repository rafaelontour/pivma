## Purpose

Permitir que a equipe BraCVAM mantenha formulários reutilizáveis e dinâmicos no próprio frontend Next.js, preservando a definição do backend e preparando associações com avaliações por IA.

## ADDED Requirements

### Requirement: Catálogo administrativo de formulários

O sistema SHALL apresentar à equipe autorizada os formulários vinculados aos templates de processo disponíveis, com identificação suficiente para selecionar e editar cada definição sem depender de chaves fixas no frontend.

#### Scenario: Formulários disponíveis

- **WHEN** uma pessoa autorizada abre a gestão de formulários
- **THEN** o sistema apresenta nome, descrição, template de processo e chave de cada formulário retornado pela API

#### Scenario: Nenhum formulário disponível

- **WHEN** a API não retorna formulários administráveis
- **THEN** o sistema apresenta um estado vazio e não fabrica modelos locais

### Requirement: Edição dos metadados do formulário

O sistema SHALL permitir editar nome e descrição do formulário selecionado e MUST preservar sua chave técnica durante a atualização.

#### Scenario: Metadados válidos salvos

- **WHEN** a pessoa altera nome ou descrição e confirma a gravação
- **THEN** o sistema persiste a definição pela integração interna e apresenta os dados confirmados pela API

#### Scenario: Atualização rejeitada

- **WHEN** a API rejeita os metadados
- **THEN** o sistema mantém as alterações locais para correção e não declara que o formulário foi salvo

### Requirement: Composição de seções e campos

O sistema SHALL permitir adicionar, editar, remover e reordenar seções e campos do formulário. Cada campo MUST suportar chave, rótulo, tipo, orientação, obrigatoriedade, opções e regras compatíveis com o contrato publicado.

#### Scenario: Campo adicionado a uma seção

- **WHEN** a pessoa inclui um campo com dados válidos numa seção existente
- **THEN** o editor o posiciona na ordem escolhida e o inclui na próxima gravação da definição

#### Scenario: Reordenação de conteúdo

- **WHEN** a pessoa move uma seção ou campo
- **THEN** o sistema atualiza sua ordem sem alterar chaves ou valores sem relação com a movimentação

#### Scenario: Tipo possui configuração específica

- **WHEN** a pessoa escolhe um tipo que exige opções ou regras adicionais
- **THEN** o editor apresenta somente os controles compatíveis e valida seus valores antes da gravação

### Requirement: Integridade da definição

O sistema SHALL validar chaves, tipos, referências, ordenação e obrigatoriedade antes de salvar a definição completa. As chaves de campos MUST ser únicas no formulário e a atualização MUST ser tratada como uma unidade coerente.

#### Scenario: Chave duplicada

- **WHEN** duas definições de campo possuem a mesma chave
- **THEN** o sistema identifica ambas e impede a gravação até a correção

#### Scenario: Definição válida

- **WHEN** todas as seções e campos são compatíveis
- **THEN** o sistema envia uma única versão coerente da definição e substitui o estado local pela resposta confirmada

### Requirement: Indicação de configuração por IA

O editor SHALL indicar quais campos possuem uma avaliação por IA publicada e SHALL oferecer acesso à associação para pessoas com capacidade de gestão de avaliações.

#### Scenario: Campo possui associação

- **WHEN** um campo está associado a uma versão publicada de avaliação
- **THEN** o editor exibe a identificação da avaliação e sua versão junto ao campo

#### Scenario: Pessoa não pode gerir IA

- **WHEN** a sessão pode editar o formulário, mas não possui a capacidade de gestão de avaliações
- **THEN** o sistema apresenta a associação somente para leitura e não oferece ações de alteração

### Requirement: Integração protegida da gestão de formulários

O navegador MUST usar somente Route Handlers internos para consultar e atualizar templates e formulários pelos contratos publicados. A interface SHALL respeitar as capacidades devolvidas pelo backend e MUST preservar a edição quando uma consulta ou gravação falhar.

#### Scenario: Operação autorizada

- **WHEN** uma pessoa autorizada consulta ou salva um formulário
- **THEN** a requisição do navegador permanece na origem da aplicação e a rota interna encaminha a operação autenticada

#### Scenario: Operação administrativa falha

- **WHEN** a API não conclui uma consulta ou atualização do formulário
- **THEN** o editor preserva os dados aplicáveis, comunica a falha e não simula uma gravação bem-sucedida
