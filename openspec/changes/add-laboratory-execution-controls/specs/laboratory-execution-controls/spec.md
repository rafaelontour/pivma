## Purpose

Oferecer à BraCVAM controles auditáveis para dispensar um laboratório de uma fase e reabrir uma execução laboratorial quando a operação exigir correção ou repetição.

## ADDED Requirements

### Requirement: Contexto da execução laboratorial
O sistema SHALL identificar processo, fase, atividade, rodada e laboratório antes de oferecer qualquer controle. Valores ausentes ou divergentes MUST impedir a mutação.

#### Scenario: Execução selecionada
- **WHEN** a BraCVAM abre uma execução de laboratório válida
- **THEN** o sistema apresenta o contexto e somente as ações compatíveis com seu estado

### Requirement: Dispensa de laboratório por fase
O sistema SHALL permitir registrar uma dispensa para o laboratório e a fase selecionados com justificativa válida e confirmação explícita.

#### Scenario: Dispensa aceita
- **WHEN** a BraCVAM confirma uma dispensa válida
- **THEN** tarefas e estado da fase são recarregados a partir da resposta da API

#### Scenario: Dispensa incompatível
- **WHEN** a fase ou o laboratório não aceita mais a dispensa
- **THEN** o sistema preserva o estado anterior e apresenta o código retornado

### Requirement: Reabertura de atividade por laboratório
O sistema SHALL permitir reabrir uma atividade laboratorial concluída ou devolvida quando a API autorizar, exigindo motivo e confirmação.

#### Scenario: Reabertura aceita
- **WHEN** a BraCVAM confirma a reabertura com um motivo válido
- **THEN** o sistema apresenta a nova execução ou rodada autoritativa sem editar a anterior

### Requirement: Autorização administrativa
Somente a BraCVAM ou outra sessão explicitamente autorizada pela API MUST poder dispensar ou reabrir. Participantes locais SHALL consultar o resultado apenas quando seus escopos permitirem.

#### Scenario: Laboratório tenta reabrir a própria atividade
- **WHEN** uma sessão sem autoridade administrativa envia a mutação
- **THEN** a rota interna recusa a operação sem alterar a tarefa

### Requirement: Reconciliação e rastreabilidade
O sistema MUST atualizar tarefas, processo e Kanban depois de uma mutação aceita e MUST NOT substituir eventos históricos por estado local fabricado.

#### Scenario: Mutação aceita e reconsulta falha
- **WHEN** a API aceita a operação, mas a reconciliação posterior falha
- **THEN** o sistema informa possível desatualização e não repete o POST automaticamente

### Requirement: Localização e códigos externos
Confirmações, justificativas, estados e nomes acessíveis SHALL existir em `pt-BR` e `en`. Erros externos MUST apresentar o código devolvido pelo backend.

#### Scenario: Backend recusa a reabertura
- **WHEN** a API devolve um código estável
- **THEN** a interface apresenta esse código junto ao feedback localizado
