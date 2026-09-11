# form-template-management Specification

## Purpose

Permitir a gestão administrativa dos formulários de processos da plataforma, oferecendo uma listagem ampla dos formulários disponíveis e um workspace de edição em largura total, com terminologia amigável e sem o termo técnico "template".

## Requirements

### Requirement: Listagem inicial de formulários de processo

O sistema SHALL apresentar, no acesso inicial à página `/formularios`, uma listagem completa e ampla dos formulários vinculados aos processos da plataforma, ocupando toda a largura útil e sem reservar espaço lateral para o editor. Cada item listado MUST exibir o nome do formulário, o processo associado, o resumo ou contagem de campos e um controle para abrir a configuração. A interface do usuário MUST NOT utilizar o termo técnico "template" ou "templates" em títulos, botões ou textos explicativos voltados para a pessoa usuária.

#### Scenario: Acesso inicial apresenta a listagem de formulários
- **WHEN** uma pessoa autorizada acessa a página de formulários
- **THEN** o sistema exibe a listagem dos formulários disponíveis em visão de catálogo amplo, sem exibir a coluna de edição simultaneamente

#### Scenario: Lista sem formulários disponíveis
- **WHEN** não há formulários cadastrados ou retornados pelo serviço
- **THEN** o sistema exibe mensagem amigável comunicando a ausência de formulários para configuração

### Requirement: Workspace de configuração em largura total

Ao selecionar um formulário na listagem, o sistema SHALL transicionar a tela para um workspace de configuração dedicado que ocupa 100% da largura útil da página. O sistema MUST ocultar a listagem/catálogo lateral nessa visualização, dedicando todo o espaço horizontal para a organização de seções, ordenação de campos, regras de preenchimento e configuração de avaliações de IA.

#### Scenario: Seleção de formulário abre editor em largura total
- **WHEN** a pessoa clica para configurar um formulário específico
- **THEN** o sistema oculta a listagem e exibe exclusivamente o editor do formulário selecionado ocupando toda a área principal

#### Scenario: Acessibilidade e foco ao abrir o editor
- **WHEN** o workspace de configuração é aberto
- **THEN** o foco inicial e os elementos interativos de edição permanecem acessíveis via teclado com indicação visual clara

### Requirement: Navegação de retorno para a listagem

O sistema SHALL disponibilizar uma ação visível e acessível de retorno ("Voltar para a lista de formulários") no topo do workspace de configuração. Ao ser acionada, o sistema MUST reconduzir a pessoa para a listagem inicial de formulários. Caso existam alterações não salvas no editor, o sistema MUST alertar a pessoa para evitar perda acidental de dados.

#### Scenario: Retorno seguro para a lista
- **WHEN** a pessoa aciona a ação de retorno no editor sem alterações pendentes
- **THEN** o sistema fecha o editor e reapresenta a listagem de formulários

#### Scenario: Retorno com alterações não salvas
- **WHEN** a pessoa tenta retornar tendo feito modificações não salvas no formulário
- **THEN** o sistema solicita confirmação antes de descartar as alterações e retornar à lista

### Requirement: Terminologia amigável de domínio

O sistema SHALL adotar terminologia alinhada ao domínio nas telas do configurador de formulários, substituindo qualquer ocorrência de "template" por expressões como "Formulário", "Formulários de processo" ou "Modelo de processo".

#### Scenario: Rótulos e mensagens sem o termo template
- **WHEN** a pessoa visualiza os títulos, cartões, botões e mensagens do módulo
- **THEN** a interface não exibe a palavra "template" em nenhum elemento textual
