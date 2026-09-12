## ADDED Requirements

### Requirement: Contrato discriminado de campos dinâmicos

O backend SHALL publicar cada definição de campo como uma variante discriminada por `field_type`. Cada variante MUST declarar de forma explícita o formato de `options` e de `validation_rules` aceito para aquele tipo, e o OpenAPI MUST preservar essa discriminação para os consumidores.

#### Scenario: Campo conhecido no OpenAPI

- **WHEN** um consumidor inspeciona a definição OpenAPI de um formulário
- **THEN** ele consegue distinguir cada tipo de campo suportado por `field_type` e identificar somente as opções e regras válidas para essa variante

#### Scenario: Regra incompatível com o tipo

- **WHEN** um template associa a um campo uma opção ou regra que não pertence à variante indicada por `field_type`
- **THEN** o backend rejeita a definição antes que ela seja disponibilizada para novas instâncias

#### Scenario: Propriedade de regra desconhecida

- **WHEN** uma definição contém uma propriedade de validação que não faz parte do contrato publicado
- **THEN** o backend informa a incompatibilidade em vez de aceitá-la silenciosamente

### Requirement: Tipos do frontend derivados do OpenAPI

O frontend SHALL manter em `types/` os tipos do contrato externo gerados a partir de um snapshot versionado e determinístico do OpenAPI. Componentes, rotas e serviços MUST consumir esses tipos ou tipos de domínio derivados deles, sem redescrever manualmente a união de campos.

#### Scenario: Contrato é atualizado

- **WHEN** o snapshot OpenAPI muda e a geração de tipos é executada
- **THEN** as variantes TypeScript refletem a nova descrição discriminada do backend

#### Scenario: Tipos gerados estão desatualizados

- **WHEN** a verificação automatizada detecta diferença entre o snapshot e o arquivo TypeScript gerado
- **THEN** a integração contínua falha e orienta a regeneração do contrato

#### Scenario: Geração sem acesso ao backend publicado

- **WHEN** a geração ou a verificação roda em ambiente de desenvolvimento ou integração contínua
- **THEN** ela usa o snapshot versionado e não depende da disponibilidade da API externa em tempo de execução

### Requirement: Validação autoritativa de valores dinâmicos

O backend SHALL validar os valores de um formulário contra a definição associada à sua instância. O salvamento de rascunho MUST validar os valores presentes sem exigir o preenchimento completo, enquanto a conclusão MUST validar obrigatoriedade, tipos, opções e todas as restrições aplicáveis.

#### Scenario: Valor presente em rascunho é incompatível

- **WHEN** um rascunho contém um valor presente cujo tipo ou restrição não corresponde ao campo
- **THEN** o backend rejeita esse valor mesmo que outros campos obrigatórios ainda possam permanecer vazios

#### Scenario: Formulário completo é válido

- **WHEN** a conclusão recebe valores que satisfazem a definição da instância
- **THEN** o backend aceita a conclusão do formulário

#### Scenario: Valor booleano falso ou número zero

- **WHEN** um campo obrigatório recebe `false` ou `0` e esse valor é válido para sua variante
- **THEN** o backend considera o campo preenchido e aplica as demais regras sem tratá-lo como ausente

### Requirement: Erros estruturados por campo

O backend SHALL retornar todas as violações detectadas em um formato estruturado que identifique pelo menos `field_key`, código da regra e mensagem segura. A resposta MUST permitir que o frontend associe cada violação ao campo correspondente sem interpretar texto livre.

#### Scenario: Mais de um campo inválido

- **WHEN** uma operação contém violações em campos distintos
- **THEN** a resposta inclui uma entrada para cada violação detectada em uma única tentativa

#### Scenario: Erro não associado a um campo

- **WHEN** a operação viola uma regra global do formulário
- **THEN** a resposta identifica a violação como global sem atribuir uma chave de campo falsa

### Requirement: Validação vinculada à versão da instância

Uma instância de formulário SHALL continuar vinculada à versão ou ao snapshot da definição com que foi criada. Alterações posteriores em um template MUST NOT mudar retroativamente a interpretação ou a validação de um rascunho existente.

#### Scenario: Template muda após a criação do rascunho

- **WHEN** uma nova versão do template altera campos ou regras
- **THEN** um rascunho anterior continua sendo carregado e validado pela definição vinculada à sua instância

#### Scenario: Nova instância após mudança de template

- **WHEN** um formulário é criado a partir da nova versão do template
- **THEN** sua instância usa o novo contrato e suas novas regras

