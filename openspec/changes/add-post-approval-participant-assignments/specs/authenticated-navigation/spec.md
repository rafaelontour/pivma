## ADDED Requirements

### Requirement: Retomada da composição pela BraCVAM

O sistema SHALL permitir que pessoas autorizadas da BraCVAM retomem composições pendentes pela área autenticada. O destino MUST limitar os processos conforme a sessão e MUST NOT criar uma área, conta ou navegação separada para o grupo gestor.

#### Scenario: BraCVAM possui composição pendente

- **WHEN** a sessão BraCVAM pode atuar em ao menos uma composição incompleta
- **THEN** a navegação oferece acesso ao destino que lista somente processos autorizados

#### Scenario: Composição aberta após aprovação

- **WHEN** a BraCVAM acabou de aprovar uma submissão
- **THEN** o sistema abre diretamente a composição desse processo sem exigir que a pessoa a encontre novamente no menu

#### Scenario: Integrante do grupo gestor entra na plataforma

- **WHEN** uma pessoa possui o papel local `group_manager` em um processo
- **THEN** ela continua usando sua conta individual e as interfaces autorizadas da plataforma, sem receber uma plataforma coletiva do grupo

#### Scenario: Sessão sem acesso

- **WHEN** a sessão não possui capacidade BraCVAM para consultar a composição
- **THEN** o sistema não apresenta a entrada administrativa e recusa acesso direto aos dados protegidos
