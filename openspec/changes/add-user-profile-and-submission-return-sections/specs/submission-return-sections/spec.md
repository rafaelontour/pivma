## Purpose

Separar as submissões do proponente por situação de trabalho para tornar claras as pendências devolvidas pela BraCVAM e os itens enviados para análise.

## ADDED Requirements

### Requirement: Seções de submissões enviadas e retornadas
O sistema SHALL apresentar, na aba Submissões, seções selecionáveis para Enviados e Retornados pelo BraCVAM. Cada seção MUST explicar brevemente seu significado e exibir sua contagem em um badge circular colorido.

#### Scenario: Proponente abre a seção de enviados
- **WHEN** o proponente seleciona Enviados
- **THEN** o sistema exibe somente submissões que não aguardam correção e uma descrição localizada da seção

#### Scenario: Proponente abre a seção de retornados
- **WHEN** o proponente seleciona Retornados pelo BraCVAM
- **THEN** o sistema exibe somente submissões devolvidas pela BraCVAM e uma descrição localizada da seção

### Requirement: Identificação de devolução da BraCVAM
O sistema SHALL classificar como retornada pelo BraCVAM uma submissão que possua uma devolução de origem de triagem, mesmo que seu estado resumido de correção esteja indisponível ou desatualizado.

#### Scenario: Devolução de triagem é identificada
- **WHEN** a submissão possui uma devolução aberta pela triagem da BraCVAM
- **THEN** ela é exibida na seção Retornados pelo BraCVAM

### Requirement: Transição para rascunho ao iniciar correção
O sistema SHALL mover uma submissão devolvida para Rascunhos quando o proponente iniciar a correção. A submissão MUST deixar de aparecer em Retornados pelo BraCVAM enquanto a correção estiver em andamento.

#### Scenario: Proponente inicia uma correção
- **WHEN** o proponente confirma a ação Iniciar correção para uma submissão devolvida
- **THEN** o sistema atualiza a listagem para exibir a submissão em Rascunhos e removê-la de Retornados pelo BraCVAM
