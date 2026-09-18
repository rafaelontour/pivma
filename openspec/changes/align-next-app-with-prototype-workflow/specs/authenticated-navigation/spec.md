## MODIFIED Requirements

### Requirement: Acesso às submissões do proponente

O sistema SHALL apresentar o item Submissões na navegação de sessões com o perfil global oficial `Proponente`. Enquanto a integração devolver uma conta proponente sem perfis nem permissões globais, o sistema MAY reconhecer como compatibilidade a presença do papel local `proponent`; essa compatibilidade MUST NOT ser aplicada a uma sessão que possua outro perfil ou permissão global. O item MUST possuir nome e ícone acessíveis e indicar quando a página estiver ativa. Um papel local `proponent` vinculado à participação em um processo MUST NOT, isoladamente, apresentar esse destino para uma conta de outro perfil.

#### Scenario: Perfil Proponente acessa submissões

- **WHEN** a sessão possui o perfil global oficial `Proponente`
- **THEN** o sistema apresenta o item Submissões e permite abrir o catálogo de templates

#### Scenario: Administrador não acumula o perfil Proponente

- **WHEN** a sessão possui somente o perfil global `Administrador`, ainda que participe de um processo com o papel local `proponent`
- **THEN** o sistema não apresenta o item Submissões na navegação administrativa

#### Scenario: Conta proponente ainda não possui perfil global

- **WHEN** a sessão não possui perfil nem permissão global e possui o papel local `proponent`
- **THEN** o sistema apresenta o item Submissões pela regra de compatibilidade

#### Scenario: Pessoa acumula os dois perfis

- **WHEN** a sessão possui os perfis globais `Proponente` e `Administrador`
- **THEN** o sistema apresenta Submissões junto aos módulos autorizados pelas permissões administrativas

#### Scenario: Item Submissões está ativo

- **WHEN** a pessoa com perfil Proponente está na página de submissões
- **THEN** a barra lateral identifica Submissões como a localização atual

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

### Requirement: Ocupação integral da área de conteúdo

O shell autenticado SHALL disponibilizar toda a largura e toda a altura úteis entre o cabeçalho, a barra lateral e os limites da viewport para o conteúdo variável de cada módulo. A área compartilhada MUST NOT aplicar limites máximos de largura diferentes entre páginas.

#### Scenario: Módulo autenticado ocupa o espaço disponível

- **WHEN** uma pessoa abre qualquer módulo dentro do shell autenticado
- **THEN** o cabeçalho da página, o conteúdo variável e o rodapé usam toda a largura disponível, e o conteúdo variável pode crescer para preencher a altura restante

### Requirement: Persistência da barra lateral

O shell autenticado SHALL preservar no navegador a preferência explícita da pessoa por manter a barra lateral expandida ou recolhida. Na ausência de preferência salva, o estado inicial SHALL acompanhar o tamanho da viewport.

#### Scenario: Navegação preserva menu recolhido

- **WHEN** a pessoa recolhe a barra lateral e abre outro item de menu ou atualiza a página
- **THEN** o novo shell restaura a barra lateral recolhida

#### Scenario: Primeira abertura usa o tamanho da tela

- **WHEN** a pessoa abre a área autenticada sem possuir uma preferência salva
- **THEN** a barra lateral inicia expandida no desktop e recolhida em uma viewport menor
