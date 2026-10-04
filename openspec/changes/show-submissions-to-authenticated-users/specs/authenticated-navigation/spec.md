## MODIFIED Requirements

### Requirement: Acesso às submissões do proponente

O sistema SHALL apresentar o item Submissões a toda pessoa com sessão autenticada válida, sem exigir perfil global, permissão administrativa ou participação prévia em um processo. O item MUST possuir nome e ícone acessíveis, MUST direcionar para o catálogo de templates e MUST indicar quando a página estiver ativa. Depois que um processo for criado, o sistema MUST continuar usando o papel local `proponent` devolvido pela API para limitar a consulta e as ações às submissões pertencentes à pessoa.

#### Scenario: Conta recém-cadastrada acessa submissões

- **WHEN** uma pessoa entra com uma conta ativa sem perfis globais e sem escopos de processo
- **THEN** o sistema apresenta o item Submissões e permite abrir o catálogo de templates

#### Scenario: Outra conta autenticada acessa submissões

- **WHEN** uma pessoa possui uma sessão válida, independentemente de seus perfis administrativos
- **THEN** o sistema apresenta o item Submissões e mantém a API como autoridade para aceitar ou recusar a criação do processo

#### Scenario: Item Submissões está ativo

- **WHEN** a pessoa está na página de submissões
- **THEN** a barra lateral identifica Submissões como a localização atual

#### Scenario: Pessoa sem sessão não acessa submissões

- **WHEN** não existe uma sessão autenticada válida
- **THEN** o sistema não apresenta a área autenticada nem entrega o catálogo ou os dados de submissões

