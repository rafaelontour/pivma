## Context

A composição atual usa uma página por processo, escopos locais da sessão e convites para três papéis. O contrato externo agora publica doze cargos, criação direta por `user_id`, ciclo completo de convites, conflitos, revogação, histórico e conclusão de cargo. A listagem agregada de processos está instável, portanto a navegação também precisa funcionar a partir de escopos e tarefas.

## Goals / Non-Goals

**Goals:**

- Evoluir o workspace existente sem criar uma segunda fonte de verdade para participantes.
- Centralizar autorização por processo, papel e tarefa em código server-only.
- Preservar a separação entre afiliação institucional e designação local.

**Non-Goals:**

- Criar usuários ou afiliações institucionais.
- Alterar manualmente fase, tarefa ou estado do processo.
- Automatizar revogação de processo quando uma afiliação for removida.

## Decisions

### 1. Ampliar o workspace de composição existente

`/processos/[processId]/composicao` continuará como ponto único. Seções serão dirigidas pelas tarefas e pelos cargos publicados, evitando páginas independentes por papel.

### 2. Catálogo fechado de cargos no domínio

Os doze identificadores atuais serão tipados em `types/`, com metadados localizados de apresentação. Valores desconhecidos poderão ser exibidos em leitura, mas não serão enviados por controles de mutação até serem incorporados ao contrato frontend.

### 3. Mutação direta e convite são caminhos distintos

Usuários selecionáveis serão atribuídos por `user_id` somente quando a sessão puder consultar o diretório. Nos demais casos, será usado convite por e-mail. O cliente não inferirá se o e-mail já possui conta.

### 4. Revogação nunca será cascata implícita

Afiliações e participantes continuarão separados. A interface poderá alertar sobre uma designação potencialmente inconsistente e oferecer a revogação explícita quando autorizada.

### 5. Snapshot após toda mutação

Participantes, convites, histórico, tarefas e processo serão reconciliados. Em falha posterior a um POST ou DELETE aceito, não haverá repetição automática.

### 6. Erros externos preservam o código da API

Serviços extrairão `detail.code` e `detail.message`; Route Handlers manterão o status externo quando houver uma resposta válida do backend.

## Risks / Trade-offs

- [Matriz de autorização não está descrita integralmente no OpenAPI] → dirigir controles por tarefas e escopos e confirmar cada papel com sessões reais.
- [Histórico e participantes podem ocupar várias páginas] → percorrer paginação no servidor e rejeitar snapshots parciais.
- [Listagem agregada de processos permanece instável] → derivar descoberta por escopos e tarefas, usando detalhes por ID como recuperação.
- [Mudanças futuras no catálogo de cargos] → manter fallback somente leitura para identificadores desconhecidos.

## Migration Plan

1. Ampliar tipos e normalizadores sem mudar a interface publicada.
2. Adicionar rotas de leitura, histórico e capacidades.
3. Habilitar mutações por grupos de cargo após validar autorização.
4. Publicar descoberta para todos os participantes locais.
5. Em rollback, ocultar os novos controles; dados já registrados permanecem na API.
