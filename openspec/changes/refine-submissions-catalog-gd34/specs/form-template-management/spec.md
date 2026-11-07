## ADDED Requirements

### Requirement: Vinculação de formulário aos tipos de submissão

O sistema SHALL permitir que pessoas autorizadas do BraCVAM associem uma versão vigente do formulário de submissão a cada tipo ativo do catálogo. A configuração MUST preservar um identificador estável para o tipo, apresentar nomes e descrições institucionais localizados nos idiomas suportados, impedir publicação de um tipo sem formulário obrigatório e manter a versão de formulário utilizada em cada processo já criado.

#### Scenario: Tipo vinculado a formulário vigente

- **WHEN** a equipe BraCVAM configura um tipo e seleciona uma versão de formulário publicada
- **THEN** novas submissões desse tipo carregam exatamente essa versão e os processos anteriores preservam a versão originalmente vinculada

#### Scenario: Publicação sem formulário

- **WHEN** a equipe tenta ativar um tipo que exige formulário sem possuir uma versão publicada vinculada
- **THEN** o sistema bloqueia a ativação e identifica a configuração ausente

#### Scenario: Atualização do formulário

- **WHEN** a equipe publica uma nova versão de um formulário já vinculado
- **THEN** novas submissões usam a nova versão e processos existentes continuam ligados à versão usada em sua criação

#### Scenario: Tipo removido do catálogo

- **WHEN** a equipe desativa um tipo de submissão
- **THEN** ele deixa de ser oferecido para novas submissões e os rascunhos e processos enviados anteriormente continuam acessíveis conforme seus escopos
