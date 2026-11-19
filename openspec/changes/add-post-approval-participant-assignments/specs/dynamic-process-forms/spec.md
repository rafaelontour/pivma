## ADDED Requirements

### Requirement: Transição da aprovação para a composição

O sistema SHALL abrir para a pessoa autorizada da BraCVAM a composição do mesmo processo depois que a API aceitar a aprovação da submissão. O acompanhamento da submissão MUST refletir o andamento da composição sem oferecer ao proponente controles reservados à BraCVAM.

#### Scenario: Aprovação confirmada

- **WHEN** a BraCVAM confirma a aprovação e a API aceita a decisão
- **THEN** o sistema navega para a linha do tempo de composição do processo aprovado

#### Scenario: Aprovação não confirmada

- **WHEN** a API rejeita ou não conclui a aprovação
- **THEN** o sistema mantém a pessoa no contexto da revisão, apresenta o erro seguro e não abre a composição como se estivesse disponível

#### Scenario: Proponente acompanha o processo

- **WHEN** o proponente consulta a submissão depois da aprovação
- **THEN** o sistema apresenta o estado atualizado devolvido pela API sem disponibilizar pesquisa, convite ou designação de participantes
