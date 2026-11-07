## Purpose

Registrar a conferência e o recebimento de frascos cegos por laboratório, incluindo evidências e decisões sobre não conformidades sem romper o sigilo das amostras.

## ADDED Requirements

### Requirement: Workspace limitado ao laboratório
O sistema SHALL carregar o recebimento no contexto do processo e do laboratório presente no escopo da sessão. Uma pessoa MUST NOT consultar ou alterar recebimentos de outro laboratório.

#### Scenario: Laboratório correto
- **WHEN** a sessão possui o laboratório exigido para a tarefa
- **THEN** o sistema apresenta somente os frascos e ações autorizados nesse contexto

### Requirement: Verificação prévia do código
O sistema SHALL permitir verificar um código antes de registrar o recebimento e MUST apresentar somente as informações seguras devolvidas pela API.

#### Scenario: Código desconhecido
- **WHEN** a API não reconhece o código informado
- **THEN** o sistema mantém a entrada para correção e apresenta o código de erro recebido

### Requirement: Registro de recebimento
O sistema SHALL permitir registrar o resultado da conferência de um frasco com os campos publicados e MUST bloquear envios concorrentes ou duplicados.

#### Scenario: Frasco recebido
- **WHEN** uma pessoa autorizada confirma dados válidos
- **THEN** o recebimento é persistido uma vez e a lista é reconciliada

#### Scenario: Recebimento concorrente
- **WHEN** outra sessão já registrou o frasco
- **THEN** o sistema recarrega o estado autoritativo e não repete automaticamente a mutação

### Requirement: Evidências fotográficas
O sistema SHALL permitir anexar fotos ao recebimento e consultar as evidências autorizadas, aplicando as restrições de arquivo publicadas pela API.

#### Scenario: Upload falha
- **WHEN** a API rejeita ou não conclui o upload
- **THEN** o sistema preserva a seleção local quando possível e não apresenta a foto como persistida

### Requirement: Não conformidades e decisão
O sistema SHALL listar não conformidades e permitir ao ator autorizado registrar a decisão e a justificativa exigidas pelo contrato.

#### Scenario: Decisão confirmada
- **WHEN** uma não conformidade pendente recebe uma decisão válida
- **THEN** o sistema atualiza o item somente após a resposta da API

### Requirement: Preservação do cegamento
O sistema MUST NOT expor nome químico, classificação de referência ou relação entre código cego e substância quando a sessão não tiver autorização explícita para esses dados.

#### Scenario: Inspeção da resposta no navegador
- **WHEN** um laboratório consulta frascos, fotos ou não conformidades
- **THEN** os payloads internos não contêm o gabarito protegido

### Requirement: Integração interna e localizada
Todas as consultas, uploads e decisões MUST passar por rotas internas. Textos controlados SHALL existir em português e inglês, preservando observações escritas por pessoas.

#### Scenario: Troca de idioma
- **WHEN** a pessoa alterna o idioma durante uma conferência incompleta
- **THEN** os dados preenchidos permanecem e os rótulos são atualizados
