## MODIFIED Requirements

### Requirement: Exclusão confirmada de rascunho

O sistema SHALL oferecer uma ação Apagar em cada rascunho próprio somente quando o backend incluir `DELETE` em `available_actions` para o processo. Antes de enviar a exclusão, o sistema MUST solicitar confirmação em um diálogo próprio e acessível, MUST impedir exclusões e aberturas concorrentes do mesmo conjunto de rascunhos e MUST remover o item da lista somente após sucesso da API.

#### Scenario: Rascunho permite exclusão

- **WHEN** a pessoa visualiza um rascunho próprio cuja lista `available_actions` contém `DELETE`
- **THEN** o sistema apresenta a ação Apagar junto da ação de retomar a edição

#### Scenario: Rascunho não permite exclusão

- **WHEN** a pessoa visualiza um rascunho que não contém `DELETE` em `available_actions`
- **THEN** o sistema não apresenta a ação Apagar nem tenta inferir a autorização apenas pelo estado do processo

#### Scenario: Abertura da confirmação

- **WHEN** a pessoa aciona Apagar em um rascunho autorizado
- **THEN** o sistema abre um diálogo que identifica o rascunho, move o foco para a confirmação e oferece Cancelar e Apagar rascunho

#### Scenario: Exclusão cancelada

- **WHEN** a pessoa cancela, pressiona Escape ou fecha o diálogo
- **THEN** o sistema não envia a exclusão, restaura o foco e mantém o rascunho na lista

#### Scenario: Exclusão confirmada com sucesso

- **WHEN** a pessoa confirma e o backend responde com sucesso à exclusão
- **THEN** o sistema fecha o diálogo, remove o rascunho e atualiza a contagem antes de confirmar a operação

#### Scenario: Exclusão rejeitada

- **WHEN** a pessoa confirma e o backend não conclui a exclusão
- **THEN** o sistema mantém o diálogo e o rascunho, informa a falha sem simular sucesso e permite nova tentativa

#### Scenario: Exclusão em andamento

- **WHEN** a exclusão de um rascunho está em andamento
- **THEN** o sistema desabilita as ações conflitantes até a operação terminar
