## ADDED Requirements

### Requirement: Acesso às submissões do proponente

O sistema SHALL apresentar o item Submissões na navegação de pessoas autenticadas que possam iniciar processos como proponente. O item MUST possuir nome e ícone acessíveis e indicar quando a página estiver ativa.

#### Scenario: Pessoa autenticada acessa submissões

- **WHEN** uma pessoa autenticada pode criar uma submissão
- **THEN** o sistema apresenta o item Submissões e permite abrir o catálogo de templates

#### Scenario: Item Submissões está ativo

- **WHEN** a pessoa está na página de submissões
- **THEN** a barra lateral identifica Submissões como a localização atual
