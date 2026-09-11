## Purpose

Dar a administradores visibilidade operacional e técnica sobre eventos do sistema e execuções de IA, com histórico, atualização ao vivo e proteção dos dados sensíveis da plataforma.

## ADDED Requirements

### Requirement: Histórico de eventos operacionais

O sistema SHALL apresentar eventos operacionais autorizados em ordem temporal, com filtros por período, nível, componente, correlação e texto, respeitando limites de consulta definidos pela API.

#### Scenario: Eventos encontrados

- **WHEN** a pessoa autorizada aplica filtros válidos
- **THEN** o sistema apresenta os eventos correspondentes com instante, nível, origem, mensagem e correlação disponíveis

#### Scenario: Nenhum evento encontrado

- **WHEN** a consulta não encontra eventos
- **THEN** o sistema apresenta um estado vazio e mantém os filtros ajustáveis

### Requirement: Atualização ao vivo dos eventos operacionais

O sistema SHALL consumir um fluxo SSE pela origem interna da aplicação, indicar o estado da conexão e incorporar novos eventos sem duplicar entradas já recebidas.

#### Scenario: Evento ao vivo recebido

- **WHEN** a conexão está ativa e um novo evento compatível chega
- **THEN** o sistema o inclui na posição temporal apropriada sem recarregar toda a página

#### Scenario: Conexão interrompida

- **WHEN** o fluxo SSE é interrompido
- **THEN** o sistema informa a desconexão, tenta restabelecer de forma controlada e mantém o histórico já carregado

### Requirement: Histórico das execuções de IA

O sistema SHALL agrupar por correlação as execuções e etapas de IA autorizadas, apresentando estado, duração, modelo, custo e consumo quando esses dados forem devolvidos pelo backend.

#### Scenario: Execução expandida

- **WHEN** a pessoa abre uma correlação de IA
- **THEN** o sistema apresenta suas etapas ordenadas e os dados técnicos disponíveis sem inventar métricas ausentes

#### Scenario: Etapa falhou

- **WHEN** uma etapa registra falha
- **THEN** o sistema diferencia a falha de uma conclusão negativa do conteúdo avaliado

### Requirement: Detalhes técnicos de entrada e saída

O sistema SHALL permitir inspecionar os payloads técnicos que a API explicitamente autorizar, mantendo-os recolhidos por padrão e distinguindo entrada, saída e erro.

#### Scenario: Payload autorizado

- **WHEN** a pessoa expande uma etapa e o backend devolve detalhes
- **THEN** o sistema apresenta o conteúdo estruturado de forma legível sem transformá-lo em HTML executável

#### Scenario: Payload não disponibilizado

- **WHEN** o backend omite detalhes sensíveis
- **THEN** o sistema indica que o conteúdo não está disponível e não tenta recuperá-lo por outra rota do navegador

### Requirement: Atualização ao vivo das execuções de IA

O sistema SHALL consumir eventos SSE de IA pela origem interna, reconciliando atualizações de uma mesma correlação e permitindo recuperar o histórico após reconexão.

#### Scenario: Etapa é atualizada

- **WHEN** o fluxo informa nova situação para uma etapa conhecida
- **THEN** o sistema atualiza a entrada existente sem criar uma execução duplicada

#### Scenario: Fluxo é restabelecido

- **WHEN** a conexão retorna após interrupção
- **THEN** o sistema reconsulta o histórico aplicável e continua incorporando eventos novos

### Requirement: Proteção da observabilidade administrativa

As páginas, consultas e fluxos de observabilidade SHALL ser restritos a sessões administrativas autorizadas. O navegador MUST acessar somente rotas internas; essas rotas MUST encerrar o fluxo quando o cliente desconectar e MUST NOT expor URL externa, credenciais ou segredos de infraestrutura.

#### Scenario: Sessão administrativa válida

- **WHEN** uma pessoa autorizada abre o histórico ou inicia o fluxo ao vivo
- **THEN** a rota interna mantém a autenticação no servidor e entrega somente os eventos permitidos

#### Scenario: Sessão sem acesso

- **WHEN** uma sessão ausente ou não administrativa solicita histórico ou SSE
- **THEN** o sistema recusa a operação antes de transmitir qualquer evento protegido

#### Scenario: Cliente encerra a conexão

- **WHEN** a página é fechada ou o fluxo do navegador é abortado
- **THEN** a rota interna encerra a conexão externa correspondente e libera seus recursos

### Requirement: Falha operacional segura

O sistema SHALL tratar falhas de consulta ou streaming sem apagar o histórico já carregado nem apresentar a conexão como ativa. A aplicação MUST NOT incluir credenciais rápidas, chamadas diretas à API externa ou inspetores genéricos dos demos.

#### Scenario: Histórico ou streaming falha

- **WHEN** a consulta histórica ou a conexão SSE não pode ser concluída
- **THEN** a página comunica a falha, mantém os dados confirmados disponíveis e oferece reconexão ou nova tentativa conforme a operação
