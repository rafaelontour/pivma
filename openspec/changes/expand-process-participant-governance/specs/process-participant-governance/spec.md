## Purpose

Governar todos os cargos locais de um processo com autorização por escopo, histórico auditável e separação explícita entre participação, convite e afiliação institucional.

## ADDED Requirements

### Requirement: Composição dirigida pelos cargos e tarefas publicados
O sistema SHALL apresentar os cargos locais suportados pela API e MUST permitir uma atribuição somente quando a sessão e a tarefa atual autorizarem a operação. Identificadores técnicos de cargo MUST permanecer inalterados nos payloads.

#### Scenario: Cargo acionável
- **WHEN** uma tarefa de atribuição está acionável para um papel efetivo da sessão
- **THEN** o sistema apresenta o cargo, as designações atuais e o controle de atribuição permitido

#### Scenario: Cargo sem autorização
- **WHEN** uma pessoa acessa um cargo que não pode atribuir naquele processo
- **THEN** o sistema apresenta somente os dados que ela pode consultar e não envia mutação

### Requirement: Ciclo de vida de convites
O sistema SHALL permitir criar, listar, reenviar e revogar convites conforme os endpoints publicados. Convites pendentes, aceitos, expirados e revogados MUST ser distinguidos de participantes ativos.

#### Scenario: Reenvio autorizado
- **WHEN** uma pessoa autorizada confirma o reenvio de um convite pendente
- **THEN** o sistema executa uma única mutação e reconcilia o convite com a API

#### Scenario: Convite revogado
- **WHEN** a API confirma a revogação
- **THEN** o convite deixa de ser apresentado como caminho válido de ingresso sem apagar seu histórico

### Requirement: Revogação e substituição explícitas
O sistema SHALL permitir revogar uma designação ativa mediante confirmação e MUST tratar uma substituição como revogação e nova atribuição autoritativas. Remover uma afiliação institucional MUST NOT revogar silenciosamente uma participação de processo.

#### Scenario: Participante deixa o processo
- **WHEN** a BraCVAM ou outro ator autorizado confirma a revogação de uma designação
- **THEN** o sistema atualiza a composição após a resposta da API e preserva o evento no histórico

#### Scenario: Afiliação ao laboratório é removida
- **WHEN** uma pessoa deixa de ser afiliada ao laboratório, mas mantém designação ativa no processo
- **THEN** o sistema não simula a revogação e sinaliza a necessidade de tratar a designação separadamente

### Requirement: Conflitos e efetividade
O sistema SHALL permitir registrar a declaração de conflito publicada pela API e MUST diferenciar designação ativa de designação efetiva. Uma pessoa com conflito vigente MUST NOT ser apresentada como apta a agir quando a API indicar o contrário.

#### Scenario: Conflito declarado
- **WHEN** a API registra uma declaração de conflito para a designação
- **THEN** o sistema atualiza o indicador de conflito e a efetividade sem remover o histórico da pessoa

### Requirement: Conclusão da atribuição de cargo
O sistema SHALL oferecer a conclusão explícita de um cargo quando a API exigir essa operação e MUST bloquear a confirmação enquanto existirem pendências publicadas para o cargo.

#### Scenario: Cargo completo
- **WHEN** todas as designações necessárias estão válidas e a pessoa confirma a conclusão
- **THEN** o sistema chama a conclusão do cargo e recarrega tarefas, participantes e processo

### Requirement: Histórico auditável
O sistema SHALL apresentar o histórico paginado das participações com ator, cargo, laboratório, situação e datas disponíveis, sem converter eventos históricos em estado atual.

#### Scenario: Designação revogada no histórico
- **WHEN** uma designação antiga não está mais ativa
- **THEN** o sistema mantém o evento consultável e o identifica como histórico

### Requirement: Descoberta por escopo local
O sistema SHALL permitir que patrocinador, grupo gestor e demais participantes encontrem os processos presentes em seus escopos, respeitando as capacidades de cada papel. A BraCVAM SHALL poder localizar os processos que administra.

#### Scenario: Patrocinador autenticado
- **WHEN** a sessão possui `sponsor` em um processo
- **THEN** o processo fica acessível em modo de leitura conforme os dados autorizados pela API

### Requirement: Integração protegida e localizada
O navegador MUST usar somente rotas internas, e erros externos MUST preservar o código publicado pelo backend. Todo conteúdo controlado pela aplicação SHALL existir em `pt-BR` e `en`.

#### Scenario: Backend recusa uma mutação
- **WHEN** a API retorna um código de erro para uma operação de participante
- **THEN** a interface apresenta esse código com feedback localizado e não inventa conclusão local
