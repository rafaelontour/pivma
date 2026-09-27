## MODIFIED Requirements

### Requirement: Header da área autenticada

O sistema SHALL apresentar um header horizontal de altura fixa de 72 pixels no topo da área autenticada, acima da barra lateral e do conteúdo principal. O header MUST conter o controle de recolher ou expandir a barra lateral e a marca da plataforma, com o controle posicionado à esquerda da marca, além do botão global de alternância de idioma e da ação para encerrar a sessão posicionados no canto direito. O conteúdo rolável e a barra lateral MUST ocupar o espaço disponível abaixo dele.

#### Scenario: Área inicial apresenta o header

- **WHEN** uma pessoa autenticada abre a página de Início
- **THEN** o sistema apresenta um header de 72 pixels acima da barra lateral e do conteúdo principal, com o controle de menu à esquerda da marca e o botão de idioma junto às ações globais

#### Scenario: Idioma muda sem alterar a navegação

- **WHEN** uma pessoa autenticada aciona o botão de idioma no header
- **THEN** o sistema traduz a navegação e mantém os mesmos destinos, permissões, item ativo e estado de expansão da barra lateral
