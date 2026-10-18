## ADDED Requirements

### Requirement: Acesso à composição dos próprios processos

O sistema SHALL disponibilizar uma entrada autenticada para a composição de processos às pessoas que possuam tarefa acionável ou papel local aplicável em ao menos um processo. O destino MUST filtrar os processos pela sessão e MUST indicar estado ativo na navegação aberta, recolhida e móvel.

#### Scenario: Grupo gestor encontra seus processos

- **WHEN** a sessão possui o papel local `group_manager` em um processo
- **THEN** a navegação oferece acesso à composição e o destino lista somente processos visíveis à sessão

#### Scenario: Proponente possui tarefa pós-aprovação

- **WHEN** a sessão possui uma tarefa acionável de definição do patrocinador ou grupo gestor
- **THEN** a pessoa consegue abrir a composição pelo acompanhamento da submissão e pela entrada autenticada correspondente

#### Scenario: Sessão sem processo aplicável

- **WHEN** a sessão não possui tarefa acionável nem papel local relacionado à composição
- **THEN** o sistema não apresenta uma entrada de navegação sem utilidade e recusa o acesso direto a dados protegidos

