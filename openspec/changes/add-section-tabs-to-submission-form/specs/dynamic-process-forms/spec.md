## ADDED Requirements

### Requirement: Preenchimento por seções em abas

O sistema SHALL agrupar os campos do formulário dinâmico por seção e SHALL apresentar uma aba para cada seção, exibindo somente o painel da aba ativa. As seções MUST seguir a ordem do primeiro campo de cada grupo após a ordenação por `order_index`, e campos sem seção válida MUST pertencer à seção `Geral`.

#### Scenario: Formulário com várias seções

- **WHEN** a pessoa abre ou retoma um formulário que possui campos distribuídos em várias seções
- **THEN** o sistema ativa a primeira seção, apresenta as abas na ordem definida e mostra somente os campos da seção ativa

#### Scenario: Campo sem seção definida

- **WHEN** um campo não possui nome de seção ou possui somente espaços nesse atributo
- **THEN** o sistema agrupa o campo na aba `Geral` sem descartá-lo

#### Scenario: Navegação preserva o preenchimento

- **WHEN** a pessoa muda de seção e depois retorna a uma seção anterior
- **THEN** os valores digitados durante a interação permanecem preenchidos mesmo que ainda não tenham sido salvos como rascunho

#### Scenario: Seleção acessível da aba

- **WHEN** a pessoa navega pelas abas usando teclado ou tecnologia assistiva
- **THEN** o sistema identifica a aba selecionada, associa cada aba ao seu painel e oferece ordem de foco previsível

#### Scenario: Rolagem vertical de uma seção extensa

- **WHEN** a pessoa rola verticalmente os campos de uma seção dentro do modal
- **THEN** a barra de abas permanece fixa no topo da área rolável e continua permitindo rolagem horizontal quando não couber na largura disponível

#### Scenario: Largura dos modais de formulário

- **WHEN** a pessoa abre um formulário por Nova submissão, Submissões ou Rascunhos
- **THEN** o modal ocupa 90% da largura da viewport sem limitar o conteúdo à largura compacta

#### Scenario: Consulta de formulário enviado

- **WHEN** a pessoa aciona a visualização de uma submissão já enviada
- **THEN** o sistema abre o formulário no modal compartilhado, identifica-o como submissão e mantém todos os campos em modo somente leitura

### Requirement: Navegação progressiva entre seções

O sistema SHALL apresentar controles de navegação no fim da seção ativa. A primeira seção MUST oferecer `Avançar`, se houver seção posterior; seções intermediárias MUST oferecer `Voltar` e `Avançar`; a última seção MUST oferecer `Voltar`, se houver seção anterior, e `Enviar para análise`. `Salvar rascunho` MUST permanecer disponível como uma ação independente da etapa ativa.

#### Scenario: Avanço com seção válida

- **WHEN** a pessoa aciona `Avançar` e todos os campos da seção atual passam pela validação simples
- **THEN** o sistema ativa a próxima seção e posiciona o foco em seu contexto inicial

#### Scenario: Avanço com seção inválida

- **WHEN** a pessoa tenta avançar e um ou mais campos da seção atual são inválidos
- **THEN** o sistema permanece na seção, apresenta os erros de todos os campos inválidos e direciona o foco para o primeiro erro

#### Scenario: Retorno para seção anterior

- **WHEN** a pessoa aciona `Voltar` ou seleciona uma aba anterior
- **THEN** o sistema ativa a seção escolhida sem exigir que a seção abandonada esteja válida

#### Scenario: Seleção direta de uma aba posterior

- **WHEN** a pessoa seleciona diretamente uma aba posterior
- **THEN** o sistema valida as seções anteriores à aba de destino e ativa a primeira seção inválida ou, se todas forem válidas, a seção escolhida

#### Scenario: Formulário com uma única seção

- **WHEN** o formulário possui somente uma seção editável
- **THEN** o sistema não apresenta `Voltar` nem `Avançar` e disponibiliza `Enviar para análise` nessa seção

#### Scenario: Salvamento de rascunho em qualquer seção

- **WHEN** a pessoa aciona `Salvar rascunho` em qualquer seção
- **THEN** o sistema mantém a seção ativa e aplica o comportamento de salvamento parcial definido para o formulário

### Requirement: Validação simples dos campos por seção

Enquanto a validação baseada em schemas não estiver implementada, o sistema SHALL validar manualmente todos os campos suportados antes do avanço e do envio. Campos obrigatórios MUST possuir valor, e campos opcionais preenchidos MUST respeitar as verificações básicas publicadas e já suportadas de tipo, número inteiro, intervalo numérico, comprimento de texto, opção selecionável, extensão e tamanho de arquivo.

#### Scenario: Campo obrigatório vazio

- **WHEN** uma seção contém um campo obrigatório sem valor válido
- **THEN** o sistema associa ao campo uma mensagem de obrigatoriedade e considera a seção inválida

#### Scenario: Campo opcional vazio

- **WHEN** um campo opcional permanece vazio
- **THEN** o sistema não cria erro apenas pela ausência de valor

#### Scenario: Campo preenchido viola restrição básica

- **WHEN** um campo preenchido viola uma restrição suportada recebida em sua definição
- **THEN** o sistema associa ao campo uma mensagem que identifica a correção necessária

#### Scenario: Correção de campo inválido

- **WHEN** a pessoa corrige um valor que possuía erro e tenta novamente a navegação ou o envio
- **THEN** o sistema reavalia o campo e remove a indicação que deixou de ser aplicável

#### Scenario: Envio encontra erro em outra seção

- **WHEN** a pessoa aciona `Enviar para análise` e qualquer seção contém campos inválidos
- **THEN** o sistema não inicia o envio, ativa a primeira seção inválida, apresenta todos os erros dessa validação e direciona o foco para o primeiro campo inválido

#### Scenario: Todas as seções são válidas

- **WHEN** a pessoa aciona `Enviar para análise` e todos os campos de todas as seções passam pela validação simples
- **THEN** o sistema inicia o fluxo existente de conclusão do formulário
