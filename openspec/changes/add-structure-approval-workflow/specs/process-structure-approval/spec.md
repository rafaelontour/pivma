## Purpose

Permitir que a BraCVAM homologue a estrutura completa do processo, devolva pontos específicos para correção e preserve todas as decisões anteriores para auditoria.

## ADDED Requirements

### Requirement: Painel estrutural autoritativo
O sistema SHALL apresentar status, execução atual, bloqueio, pontos estruturais, designações, contagens de amostras e pendências devolvidos pela API.

#### Scenario: Homologação bloqueada
- **WHEN** o painel contém um motivo de bloqueio
- **THEN** o sistema identifica o bloqueio e não habilita uma decisão incompatível

### Requirement: Aprovação confirmada
O sistema SHALL permitir à BraCVAM aprovar a estrutura com justificativa, mediante confirmação, e MUST reconhecer o avanço somente após resposta da API.

#### Scenario: Estrutura aprovada
- **WHEN** a pessoa autorizada confirma a aprovação válida
- **THEN** o sistema atualiza painel, tarefas e Kanban com o estado autoritativo

### Requirement: Rejeição pontual
O sistema SHALL exigir justificativa e ao menos um ponto rejeitado quando o resultado for `REJECTED`. Cada ponto MUST usar os identificadores aceitos pelo contrato.

#### Scenario: Rejeição válida
- **WHEN** a BraCVAM seleciona os pontos inadequados, informa justificativa e confirma
- **THEN** a decisão é registrada e as correções reabertas pela API são refletidas

#### Scenario: Rejeição sem ponto
- **WHEN** a pessoa tenta rejeitar sem identificar o que precisa de correção
- **THEN** o sistema impede o envio e apresenta validação localizada

### Requirement: Histórico de decisões
O sistema SHALL apresentar decisões da mais recente para a mais antiga com resultado, justificativa, pontos rejeitados, ator e datas disponíveis.

#### Scenario: Nova rodada após rejeição
- **WHEN** uma estrutura corrigida retorna para nova homologação
- **THEN** a decisão anterior permanece visível e a rodada atual é distinguida

### Requirement: Retomada das correções
O sistema SHALL direcionar cada responsável autorizado ao workspace correspondente ao ponto reaberto e MUST NOT permitir edição pela BraCVAM em nome do participante quando o contrato exigir atuação local.

#### Scenario: Designação rejeitada
- **WHEN** a API reabre uma atividade de atribuição
- **THEN** o responsável encontra a tarefa e retoma a composição preservando o histórico

### Requirement: Autorização, erros e localização
A decisão MUST ser restrita à BraCVAM, e a leitura SHALL respeitar os escopos publicados. Erros MUST preservar os códigos do backend e todo conteúdo controlado SHALL existir nos dois idiomas.

#### Scenario: Participante tenta decidir
- **WHEN** uma pessoa sem autoridade de homologação envia uma decisão
- **THEN** o servidor recusa a operação e nenhuma alteração é simulada no cliente
