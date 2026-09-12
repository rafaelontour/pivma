## ADDED Requirements

### Requirement: Validação dinâmica durante o preenchimento

O sistema SHALL interpretar as regras dos campos retornados pela instância do formulário para oferecer validação imediata durante o preenchimento. A validação local MUST melhorar a correção antes da requisição, mas MUST NOT substituir nem enfraquecer a validação autoritativa do backend.

#### Scenario: Restrição exibida junto ao campo

- **WHEN** um campo possui uma restrição suportada, como comprimento, intervalo, opção, extensão ou tamanho de arquivo
- **THEN** a interface representa a restrição no controle correspondente e a comunica em linguagem compreensível

#### Scenario: Tentativa localmente inválida

- **WHEN** a pessoa tenta salvar ou concluir com um valor que viola as regras recebidas
- **THEN** a interface mantém os valores, destaca todos os campos inválidos e não inicia a requisição até que as violações locais sejam corrigidas

#### Scenario: Backend rejeita valores aceitos localmente

- **WHEN** o backend retorna erros estruturados para uma tentativa que passou pela validação local
- **THEN** a interface preserva o preenchimento e associa cada erro ao campo indicado, apresentando separadamente eventuais erros globais

#### Scenario: Tipo futuro ainda desconhecido

- **WHEN** a instância contém um `field_type` que a versão atual da interface não reconhece
- **THEN** o sistema mantém o campo identificável, informa a incompatibilidade e impede uma conclusão que poderia omitir ou corromper seu valor

#### Scenario: Retomada conserva as regras originais

- **WHEN** a pessoa retoma um rascunho criado com uma versão anterior do template
- **THEN** a interface renderiza e valida os valores conforme a definição retornada para aquela instância

