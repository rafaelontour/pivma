## Purpose

Permitir a definição segura e auditável das substâncias e amostras de um processo, preservando o cegamento e restringindo a classificação de referência aos papéis autorizados.

## ADDED Requirements

### Requirement: Workspace contextual de amostras
O sistema SHALL disponibilizar um workspace por processo com o conjunto autoritativo de substâncias, a tarefa relacionada e as ações permitidas para a sessão.

#### Scenario: Tarefa acionável
- **WHEN** a sessão pode agir na definição de amostras do processo
- **THEN** o sistema apresenta edição e conclusão juntamente com o estado atual

#### Scenario: Consulta sem edição
- **WHEN** a sessão pode consultar o processo, mas não definir amostras
- **THEN** o sistema oculta as mutações e apresenta somente os campos autorizados

### Requirement: Cadastro completo de substâncias
O sistema SHALL permitir criar e atualizar substâncias com os campos exigidos pela API e MUST validar obrigatoriedade, limites, enumerações, datas, quantidades e coerência das temperaturas antes do envio.

#### Scenario: Substância válida
- **WHEN** a pessoa informa todos os campos obrigatórios e confirma
- **THEN** o sistema persiste uma única mutação e reconcilia a lista

#### Scenario: Temperaturas incoerentes
- **WHEN** a temperatura mínima é maior que a máxima
- **THEN** o sistema não envia a mutação e apresenta validação localizada

### Requirement: Remoção confirmada
O sistema SHALL exigir confirmação antes de remover uma substância e MUST atualizar o workspace somente depois que a API aceitar a operação.

#### Scenario: Remoção recusada
- **WHEN** a API recusa a remoção por estado ou dependência
- **THEN** a substância permanece visível e o código do backend é apresentado

### Requirement: Sigilo da classificação de referência
O sistema MUST apresentar `reference_classification` somente a sessões autorizadas pela API e MUST NOT incluir esse valor em estados, mensagens ou downloads destinados a laboratórios cegos.

#### Scenario: Laboratório participante consulta amostras
- **WHEN** uma sessão de laboratório sem autorização de gabarito abre o workspace
- **THEN** nenhuma classificação de referência é exposta no navegador

### Requirement: Documento de segurança da substância
O sistema SHALL permitir anexar, substituir e baixar a SDS de uma substância conforme as restrições publicadas, preservando o arquivo selecionado quando uma tentativa de upload falhar.

#### Scenario: Upload aceito
- **WHEN** a pessoa seleciona um arquivo válido e a API aceita o upload
- **THEN** o sistema apresenta os metadados autoritativos da SDS

### Requirement: Códigos cegos, etiquetas e consulta
O sistema SHALL apresentar códigos cegos e etiquetas apenas aos papéis autorizados, oferecer QR code e consulta por código conforme os endpoints publicados e MUST preservar o cegamento em todas as respostas.

#### Scenario: Download de etiqueta
- **WHEN** a sessão autorizada solicita uma etiqueta ou QR code
- **THEN** o arquivo é entregue por rota interna sem expor credenciais ou origem externa

### Requirement: Conclusão autoritativa das amostras
O sistema SHALL permitir concluir a definição somente após confirmação explícita e MUST reconhecer o avanço apenas pela resposta e pelas tarefas retornadas pela API.

#### Scenario: Conjunto incompleto
- **WHEN** a API recusa a conclusão por pendências nas substâncias ou códigos
- **THEN** o workspace permanece editável e apresenta o código e as pendências devolvidas

### Requirement: Internacionalização e conteúdo científico
Rótulos, validações, estados e nomes acessíveis SHALL existir em português e inglês. Nomes químicos, lotes, classificações e textos informados por pessoas MUST NOT ser traduzidos automaticamente.

#### Scenario: Troca de idioma durante edição
- **WHEN** a pessoa alterna o idioma com um formulário parcialmente preenchido
- **THEN** os rótulos mudam e os dados científicos permanecem intactos
