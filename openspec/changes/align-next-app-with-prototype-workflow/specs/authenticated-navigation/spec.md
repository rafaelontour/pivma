## ADDED Requirements

### Requirement: Acesso à configuração de formulários e IA

O sistema SHALL apresentar o acesso à configuração de formulários e avaliações por IA somente para sessões autorizadas a administrar esses recursos. Os destinos MUST reutilizar o shell autenticado e indicar sua localização ativa.

#### Scenario: Pessoa autorizada configura formulários

- **WHEN** a sessão possui a capacidade administrativa exigida pela API
- **THEN** a navegação apresenta o acesso ao editor de formulários e à biblioteca de avaliações

#### Scenario: Pessoa sem autorização não vê configuração

- **WHEN** a sessão não possui a capacidade administrativa exigida
- **THEN** a navegação não apresenta os itens administrativos e as páginas recusam consultas diretas sem revelar dados

### Requirement: Acesso à triagem BraCVAM

O sistema SHALL apresentar o item Triagem para sessões com a permissão `triage.review`. O item MUST ter nome e ícone acessíveis e indicar quando a área de triagem estiver ativa.

#### Scenario: Integrante BraCVAM acessa triagem

- **WHEN** a sessão possui `triage.review`
- **THEN** a barra lateral apresenta Triagem e permite abrir sua fila de trabalho

#### Scenario: Pessoa não autorizada tenta acessar triagem

- **WHEN** uma sessão sem `triage.review` solicita a página ou seus dados
- **THEN** o sistema não exibe propostas, pareceres ou pré-avaliações e comunica que o acesso não é permitido

### Requirement: Acesso à observabilidade administrativa

O sistema SHALL apresentar os itens de observabilidade operacional e de IA somente para uma sessão reconhecida pela integração como administradora. A ocultação no menu MUST NOT substituir a autorização efetiva das rotas internas e externas.

#### Scenario: Administrador acessa observabilidade

- **WHEN** a sessão possui acesso administrativo aos logs
- **THEN** a navegação apresenta os destinos de observabilidade com estado ativo acessível

#### Scenario: Pessoa comum solicita observabilidade

- **WHEN** uma sessão sem acesso administrativo solicita os dados de observabilidade
- **THEN** o sistema retorna acesso negado e não transmite eventos ou payloads

### Requirement: Navegação sem recursos de demonstração

A área autenticada MUST apresentar os fluxos como módulos do produto e MUST NOT oferecer login rápido com credenciais de seed, inspetor genérico de respostas da API ou atalhos exclusivos das páginas HTML de demonstração.

#### Scenario: Módulo do protótipo é incorporado

- **WHEN** uma pessoa abre um dos novos módulos no frontend Next.js
- **THEN** a interface usa a sessão existente, o shell compartilhado e mensagens orientadas à tarefa sem expor utilitários da demo
