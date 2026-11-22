## MODIFIED Requirements

### Requirement: Header da área autenticada

O sistema SHALL apresentar um header horizontal de altura fixa de 72 pixels no topo da área autenticada, acima da barra lateral e do conteúdo principal. O header MUST conter o controle de recolher ou expandir a barra lateral e a marca da plataforma, com o controle posicionado à esquerda da marca, além de um controle acessível de alerts com indicador de não lidos e uma ação para encerrar a sessão posicionados à direita. O conteúdo rolável e a barra lateral MUST ocupar o espaço disponível abaixo dele.

#### Scenario: Área inicial apresenta o header

- **WHEN** uma pessoa autenticada abre a página de Início
- **THEN** o sistema apresenta um header de 72 pixels acima da barra lateral e do conteúdo principal, com o controle de menu à esquerda da marca

#### Scenario: Header apresenta acesso aos alerts

- **WHEN** uma pessoa autenticada acessa qualquer página que utiliza o shell persistente
- **THEN** o sistema apresenta à direita um controle de alerts com nome acessível e indicação da quantidade não lida quando houver

#### Scenario: Header em tela estreita

- **WHEN** o espaço horizontal não comporta simultaneamente todos os elementos do header
- **THEN** o sistema preserva a operação do menu, dos alerts e do encerramento da sessão sem sobreposição ou perda de nome acessível

