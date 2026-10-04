## MODIFIED Requirements

### Requirement: Retomada dos próprios rascunhos

O sistema SHALL apresentar uma seção Meus rascunhos com processos no estado inicial de elaboração em que a sessão autenticada possui o papel local `proponent`. A integração MUST aceitar o objeto aninhado `template` publicado pela API, normalizá-lo para o contrato interno e MUST NOT converter uma resposta válida em indisponibilidade. Cada item MUST permitir carregar o formulário persistido e retomar sua edição.

#### Scenario: Rascunhos disponíveis

- **WHEN** a pessoa possui processos em elaboração como proponente e a API devolve `template.key` e `template.version`
- **THEN** o sistema normaliza e lista esses processos com identificação suficiente e uma ação Retomar edição

#### Scenario: Retomada da edição

- **WHEN** a pessoa aciona Retomar edição em um rascunho
- **THEN** o sistema abre o formulário correspondente preenchido com os valores persistidos

#### Scenario: Nenhum rascunho próprio

- **WHEN** a pessoa não possui processos em elaboração como proponente
- **THEN** a seção informa que ainda não existem rascunhos salvos

#### Scenario: Processo de outra pessoa

- **WHEN** a listagem externa contém um processo que não pertence ao escopo proponente da sessão
- **THEN** o sistema não inclui esse processo em Meus rascunhos

#### Scenario: Falha ao consultar rascunhos

- **WHEN** os rascunhos não podem ser consultados ou a resposta externa não corresponde ao contrato publicado
- **THEN** o sistema comunica a falha e oferece uma ação para tentar novamente
