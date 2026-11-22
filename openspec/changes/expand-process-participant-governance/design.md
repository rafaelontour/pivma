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

### 7. Identidade visual derivada da sessão

O shell usará o catálogo fechado dos doze cargos para resolver uma única identidade visual determinística. Associações locais diferentes de `proponent` e `sponsor` têm precedência e seguem a ordem canônica de `PROCESS_PARTICIPANT_ROLES`; portanto, uma pessoa associada ao laboratório líder ou ao grupo gestor recebe o módulo, o badge e o tema desse cargo, mesmo que também possua perfil institucional. Em seguida vêm os perfis explícitos Administração, BraCVAM e Proponente. O papel local `sponsor` só define o módulo quando nenhum desses cargos ou perfis prioritários estiver presente, impedindo que um vínculo auxiliar de patrocínio restrinja uma conta institucional ou outro participante do processo. O papel local `proponent` é considerado depois de `sponsor` e dos perfis, impedindo que um escopo auxiliar faça uma conta BraCVAM aparecer como Proponente. Sem perfil nem cargo reconhecido, o shell usa o módulo geral em escala cinza; capacidades técnicas isoladas não definem tema. Cargos associativos não são perfis de permissão e não são inferidos por username. Cor, ícone e descrição identificam o módulo, mas não participam de autorização. BraCVAM usa verde, Proponente usa azul e Administração usa roxo. Grupo Gestor usa laranja; Laboratório Líder usa ciano; os demais cargos locais distribuem coral, rosa, dourado, turquesa, índigo e matizes complementares.

### 8. Navegação contextual do grupo gestor

O item **Grupo** reutiliza o índice protegido de composição, ampliado com as designações `group_manager` já normalizadas por processo. O item **Processos** reutiliza o quadro de processos e suas tarefas, liberando leitura para sessões que possuam escopos locais. Controles de mutação continuam condicionados às capacidades e ações publicadas; em especial, exclusão só aparece quando `available_actions` contém `DELETE`.

### 9. Shell autenticado persistente em layout compartilhado

As páginas autenticadas do route group `(paginas)` fornecem somente o conteúdo específico da rota. Um layout compartilhado resolve `activePage` pelo caminho e mantém uma única instância de `AuthenticatedShell` durante a navegação com `next/link`. Dessa forma, sessão, header e barra lateral permanecem montados; a raiz e `/login` atravessam o layout sem receber o shell autenticado.

### 10. Submissões como entrada no papel Proponente

O item **Submissões** aparece no módulo geral para permitir o primeiro envio e permanece disponível no módulo Proponente. Ele não aparece para Administração, BraCVAM ou cargos associativos. Após uma submissão aceita, a interface emite um evento local de reconciliação e consulta `/api/auth/me` uma vez; quando a API publica `proponent`, o shell persistente troca o badge e o tema sem recarregar a página inteira.

Quando a identidade efetiva resolvida pelo shell for Proponente, uma allowlist de páginas limitará a interface a `/inicio` e à árvore `/submissoes`. A barra lateral omitirá Designações, Processos e todos os demais módulos. Como o layout compartilhado já mantém a sessão durante a navegação, ele também atuará como barreira de página: após resolver a sessão, não renderizará o conteúdo de uma rota fora da allowlist e substituirá o caminho por `/inicio`. A precedência existente da identidade efetiva permanece autoritativa, de modo que Administração, BraCVAM ou um cargo associativo com papel auxiliar `proponent` não recebe essa restrição. A barreira de página complementa, sem substituir, a autorização server-side das rotas internas e da API externa.

### 11. Módulos derivados de associações, não de contas

`/api/auth/me` normaliza somente perfis e cargos realmente publicados pelo backend. O frontend não infere laboratório, grupo ou cargo pelo username e não cria variantes cromáticas por pessoa. Pessoas associadas ao mesmo cargo compartilham o módulo e o tema; quando a associação muda, a sessão reconciliada passa a resolver o novo módulo.

### 12. Acompanhamento do patrocinador separado do Kanban

O módulo efetivo Patrocinador usa `/acompanhamento` e `/acompanhamento/[processId]`; não recebe o item **Processos** nem renderiza o quadro Kanban. O índice será montado no servidor a partir dos escopos `sponsor` da sessão e, para cada identificador, reconciliará o processo com sua composição autorizada. A composição fornece o participante `proponent`, a designação ativa `sponsor` e seu `assigned_at`, evitando inferências por nome, convite ou ordem da resposta. Datas serão formatadas no locale ativo sem alterar os identificadores técnicos.

O detalhe reutilizará somente dados de leitura já autorizados do processo, das tarefas atuais e da composição, mas terá apresentação própria para o patrocinador. `PLANNING` será apresentado como projeto em elaboração; depois dessa etapa, fase, atividade, marcos e resultados aparecerão apenas quando estiverem publicados nos contratos consultados. O shell aplicará uma allowlist equivalente à do Proponente: quando o módulo efetivo for `sponsor`, permitirá Início e a árvore `/acompanhamento`, redirecionando acessos diretos ao Kanban ou a páginas operacionais para `/acompanhamento`. Um papel `sponsor` auxiliar não restringirá Administração, BraCVAM ou outro cargo associativo que tenha precedência como módulo efetivo.

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
