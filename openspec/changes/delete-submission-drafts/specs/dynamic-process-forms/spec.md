## MODIFIED Requirements

### Requirement: Exclusão confirmada de rascunho

O sistema SHALL tratar como rascunho excluível cada processo cujo formulário indique `is_submitted: false`, no qual a API indique `DELETE` em `available_actions` e a sessão autenticada possua o papel local `proponent`. Para esses processos, o sistema SHALL oferecer uma ação Excluir e MUST solicitar confirmação em um modal próprio da aplicação antes de enviar a exclusão. O sistema MUST NOT usar a caixa de confirmação nativa do navegador, MUST remover o item da lista somente após sucesso da API e MUST NOT oferecer nem executar a exclusão de submissões enviadas, mesmo que a API ainda anuncie `DELETE`.

#### Scenario: Formulário salvo permanece em rascunhos

- **WHEN** o proponente salva o formulário sem enviá-lo e `is_submitted` permanece falso
- **THEN** o processo aparece somente em Rascunhos e pode oferecer a ação Excluir

#### Scenario: Envio move o processo para submissões

- **WHEN** o proponente envia o formulário e `is_submitted` passa a verdadeiro
- **THEN** o processo deixa Rascunhos, aparece em Submissões e não oferece a ação Excluir

#### Scenario: Abertura da confirmação

- **WHEN** a pessoa aciona Excluir em um rascunho
- **THEN** o sistema abre um modal que identifica o rascunho e oferece Cancelar e Excluir rascunho

#### Scenario: Exclusão cancelada

- **WHEN** a pessoa cancela ou fecha o modal
- **THEN** o sistema não envia a exclusão e mantém o rascunho na lista

#### Scenario: Exclusão confirmada com sucesso

- **WHEN** a pessoa confirma, ainda possui o papel `proponent`, o processo ainda oferece `DELETE` em `available_actions` e a API exclui o rascunho
- **THEN** o sistema fecha o modal, remove o rascunho da lista e confirma a operação

#### Scenario: Exclusão rejeitada

- **WHEN** a pessoa confirma e a exclusão não pode ser concluída
- **THEN** o sistema mantém o modal e o rascunho, informando a falha sem simular sucesso

#### Scenario: Processo enviado não oferece exclusão

- **WHEN** a pessoa consulta um processo cujo formulário indica `is_submitted: true`
- **THEN** o sistema não apresenta ação de exclusão na interface do proponente

#### Scenario: Tentativa direta de excluir processo enviado

- **WHEN** uma requisição de exclusão referencia um processo com `is_submitted: true`, ainda que `DELETE` esteja presente em `available_actions`
- **THEN** o sistema rejeita a operação sem encaminhar a exclusão à API externa

#### Scenario: Tentativa de excluir rascunho de outra pessoa

- **WHEN** uma requisição de exclusão referencia um processo no qual a sessão não possui papel local `proponent`
- **THEN** o sistema rejeita a operação sem consultar ou excluir o processo
