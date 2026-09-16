## MODIFIED Requirements

### Requirement: Acesso às submissões do proponente

O sistema SHALL apresentar o item Submissões na navegação de todas as pessoas com sessão autenticada válida, sem restringir a exibição a perfis específicos como proponente. O item MUST possuir nome e ícone acessíveis e indicar quando a página de submissões estiver ativa. A página de submissões MUST permanecer acessível para qualquer usuário autenticado.

#### Scenario: Pessoa autenticada acessa submissões

- **WHEN** uma pessoa possui uma sessão autenticada válida
- **THEN** o sistema apresenta o item Submissões na barra lateral e permite acessar o catálogo de submissões

#### Scenario: Item Submissões está ativo

- **WHEN** a pessoa está na página de submissões
- **THEN** a barra lateral identifica Submissões como a localização atual
