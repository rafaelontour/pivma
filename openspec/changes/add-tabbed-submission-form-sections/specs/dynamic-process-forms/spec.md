## ADDED Requirements

### Requirement: Navegação do formulário por seções

O sistema SHALL apresentar como abas as seções de um formulário dinâmico quando a definição possuir mais de uma seção e MUST exibir somente os campos da seção ativa. A navegação MUST preservar os valores mantidos na interface, respeitar a ordem das seções derivada dos campos e oferecer estado selecionado e operação por teclado acessíveis.

#### Scenario: Formulário com várias seções

- **WHEN** a pessoa abre um formulário cuja definição possui campos distribuídos em várias seções
- **THEN** o popup apresenta uma aba para cada seção na ordem definida e exibe inicialmente os campos da primeira seção

#### Scenario: Troca de seção

- **WHEN** a pessoa seleciona outra aba por clique ou teclado
- **THEN** o popup exibe somente os campos da seção escolhida e mantém os valores já preenchidos nas demais seções

#### Scenario: Formulário com uma seção

- **WHEN** a definição possui somente uma seção efetiva
- **THEN** o popup apresenta diretamente seus campos sem adicionar uma navegação de abas desnecessária

#### Scenario: Campo inválido em outra seção

- **WHEN** a pessoa tenta enviar o formulário e o primeiro campo inválido pertence a uma seção diferente da ativa
- **THEN** o sistema ativa a aba correspondente e move o foco para esse campo sem descartar os demais valores

#### Scenario: Seção sem nome

- **WHEN** um campo não possui nome de seção configurado
- **THEN** o sistema o agrupa na seção geral localizada no idioma ativo

#### Scenario: Proposta com várias seções no modal de análise

- **WHEN** a equipe BraCVAM abre para análise uma proposta com campos distribuídos em várias seções
- **THEN** o modal apresenta uma aba para cada seção na ordem definida e exibe somente os campos da seção ativa
