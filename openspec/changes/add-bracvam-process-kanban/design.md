## Context

A área autenticada atual concentra o shell, a sessão, a navegação e a gestão de usuários em `authenticated-home.tsx`. A API externa publicada oferece `GET /processes` e `GET /tasks`, paginados em até 100 registros. O processo informa o ciclo de vida `OPEN`, `CLOSED`, `CANCELLED` ou `ARCHIVED`; a tarefa informa atividade, rodada, fase, papel responsável, possibilidade de ação e estado `READY`, `COMPLETED` ou `CANCELLED`.

O ciclo de vida não identifica sozinho a posição operacional: submissão, triagem, correção e execução permanecem `OPEN`. O Kanban deverá compor o snapshot de processos com as tarefas correntes e projetar quatro macroetapas de apresentação. O Kanban não altera estados: atividades e decisões do fluxo continuam sendo as únicas responsáveis pelas mudanças.

## Goals / Non-Goals

**Goals:**

- Introduzir um domínio de processos tipado e isolado das definições de formulários.
- Reutilizar o shell autenticado sem ampliar o componente monolítico existente.
- Fazer o quadro representar todos os processos acessíveis e manter a API como fonte de verdade.
- Atualizar automaticamente o posicionamento dos cartões quando novas consultas retornarem mudanças de estado.
- Preservar o limite arquitetural em que o navegador acessa somente Route Handlers internos.

**Non-Goals:**

- Criar ou editar templates e formulários dinâmicos.
- Criar novos processos pelo Kanban.
- Alterar, avançar, retroceder ou reordenar processos pelo Kanban.
- Adicionar drag-and-drop ou outra affordance de edição de estado.
- Implementar atualização em tempo real por WebSocket ou Server-Sent Events.

## Decisions

### Página de Processos e shell autenticado reutilizável

O Kanban ficará em `/processos`, identificado como Processos na barra lateral. Antes de adicionar a página, o shell autenticado será extraído da implementação atual para componentes reutilizáveis de header, sidebar e conteúdo, mantendo a validação de sessão e o comportamento existente de `/inicio` e `/usuarios`.

Alternativa considerada: acrescentar `page: "processes"` e toda a lógica do quadro a `authenticated-home.tsx`. O arquivo já reúne responsabilidades de layout, sessão e RBAC; ampliar essa união tornaria as mudanças seguintes mais arriscadas.

### Tipos e integração separados por domínio

Os contratos de processo e os estados do quadro ficarão em `types/Processo.ts` e `types/Kanban.ts`. `services/Processo.ts` encapsulará exclusivamente as consultas externas necessárias ao quadro e aos detalhes. Route Handlers sob `/api/processes` validarão a sessão, parâmetros e respostas antes de expor dados ao cliente.

Alternativa considerada: declarar tipos junto aos componentes. Isso viola a convenção do projeto e acopla a representação da API ao comportamento visual.

### Carga paginada até completar o conjunto

O cliente solicitará páginas internas de até 100 processos e continuará enquanto o total informado indicar registros pendentes. O quadro manterá um estado explícito de carregamento completo e só exibirá contagens como definitivas depois de concluir todas as páginas. Requisições seguintes poderão ser paralelizadas depois que a primeira página revelar o total, com limite de concorrência para não sobrecarregar a API.

Alternativa considerada: alterar a rota interna para retornar todos os processos em uma única resposta. Isso simplificaria o componente, mas aumentaria o tempo da requisição, o uso de memória no servidor e o risco de timeout sem eliminar a paginação externa.

### Colunas orientadas por uma projeção operacional

A ordem, o rótulo e a aparência serão fixados em Novas submissões, Em revisão, Em andamento e Encerradas. Uma função pura combinará cada processo com suas tarefas correntes. Processos abertos que tenham somente a tarefa inicial `proposal_submission` ainda pronta serão omitidos como rascunhos. A conclusão da submissão inicial ou a existência de qualquer atividade posterior constitui evidência de envio. Estados terminais têm precedência; fases posteriores à primeira indicam Em andamento; retorno ao proponente e rodadas posteriores indicam Em revisão; submissões enviadas sem esses sinais permanecem em Novas submissões.

O subestado de revisão não será tratado como novo estado do backend. Ele será exibido como badge derivado de `activity_key`, `activity_run_number`, `assigned_role`, `status` e `can_act`. O cartão continuará consultável quando aguarda o proponente; somente Analisar ficará indisponível.

Alternativa considerada: usar apenas `process.status`. Isso produziria uma coluna `OPEN` com quase todo o fluxo e já resultou em Estado não mapeado porque a interface esperava estados inexistentes.

### Fase corrente e filtro local

A fase corrente será a fase de maior ordem entre as tarefas correntes não canceladas do processo. O filtro será montado dinamicamente a partir das fases presentes em Em andamento e afetará somente os cartões dessa coluna. Como `TaskSummary.phase` ainda não devolve o nome localizado, o experimento exibirá o número da fase e manterá a chave técnica apenas como identificador.

### Revalidação periódica por snapshot completo

Depois da carga inicial, o cliente repetirá periodicamente a consulta de todas as páginas de processos e tarefas enquanto o documento estiver visível. Cada ciclo será montado separadamente e substituirá o quadro de forma atômica somente após obter os dois conjuntos completos. Mudanças no ciclo de vida ou nas tarefas reposicionarão o cartão; processos novos ou que deixaram de ser acessíveis também serão reconciliados.

O intervalo ficará centralizado como configuração da interface. A sincronização será pausada quando o documento estiver oculto e retomada com uma nova consulta completa ao voltar, evitando tráfego contínuo sem benefício. Uma ação manual de atualização ficará disponível para recuperação imediata.

Alternativa considerada: atualizar os cartões individualmente. O endpoint atual lista processos por página e não oferece versão ou feed incremental; um snapshot completo evita combinar estados obtidos em momentos incompatíveis.

### Cartões semanticamente não arrastáveis

Cada cartão será implementado como conteúdo consultável com uma ação explícita para abrir detalhes. Não serão aplicados atributos draggable, alças, cursores de arraste ou bibliotecas de drag-and-drop. Alterações de coluna usarão a identidade estável do processo durante a reconciliação para evitar que a atualização seja interpretada como uma operação do usuário.

Alternativa considerada: manter suporte de drag desabilitado para uso futuro. Mesmo inativo, esse código comunicaria uma possibilidade de edição que não pertence ao produto e adicionaria dependência sem necessidade.

### Triagem contextual em modal

A ação Analisar abrirá um diálogo acessível com exatamente 85% da largura e da altura da viewport, renderizado por portal diretamente no `body` para não herdar limitações dimensionais do quadro. O componente de triagem existente receberá o processo inicial e um modo incorporado, omitindo a fila lateral redundante, removendo margens e cartões internos desnecessários e carregando diretamente formulário, pré-avaliação e histórico. Em telas amplas, o workspace usará duas colunas e manterá a decisão final Aprovado, Solicitar correção ou Reprovado permanentemente visível em um painel lateral, sem exigir um segundo modal. O diálogo manterá foco contido, fechamento por Escape e restauração de foco. O item Triagem será removido da navegação, mas a rota existente permanecerá disponível para compatibilidade técnica.

Todo cartão classificado em Novas submissões será analisável, inclusive antes de a API materializar `triage_evaluation` ou concluir a pré-avaliação. O bloqueio visual será reservado ao retorno de correção atribuído ao proponente; nos demais subestados de revisão, a tarefa corrente continuará orientando a disponibilidade.

O histórico ficará disponível por uma ação explícita no cabeçalho do workspace, alternando o conteúdo principal do modal entre análise e histórico. Um aviso informativo próximo ao cabeçalho explicará essa alternância. Os eventos serão apresentados como uma linha vertical de pontos conectados, em ordem do mais recente para o mais antigo, com rótulos localizados em vez dos identificadores técnicos, datas destacadas em badges próprios e um pulso concêntrico no ponto mais recente. O bloco de histórico no fim do workspace será removido para evitar rolagem desnecessária.

No fluxo do proponente, o modal de retorno e correção usará aproximadamente 94% da largura e 92% da altura da viewport. Em telas largas, decisão, justificativa e avisos BraCVAM ficarão em uma coluna lateral rolável, enquanto o formulário tabulado ocupará a área principal restante. Em telas menores, as áreas serão empilhadas sem perder acesso aos controles.

O carregamento incorporado manterá a função de consulta estável entre renderizações e reiniciará a requisição quando uma limpeza de efeito a abortar, inclusive na verificação adicional do Strict Mode em desenvolvimento. Um timeout converterá esperas excessivas em erro recuperável com ação de nova tentativa, impedindo que o modal permaneça indefinidamente em “Carregando proposta”.

Alternativa considerada: navegar para `/triagem` com o identificador na URL. Isso rompe o contexto visual do quadro e mantém duas entradas concorrentes para a mesma atividade.

### Detalhes proporcionais ao ciclo de vida

O diálogo de detalhes sempre exibirá os metadados gerais úteis à pessoa usuária, mas não mostrará o identificador técnico do ciclo de vida. Encerramento e motivo serão renderizados apenas quando `status` for `CLOSED`, `CANCELLED` ou `ARCHIVED`, evitando campos irrelevantes em submissões novas ou em andamento. Os cartões também comunicarão somente o subestado operacional compreensível.

### Colunas fluidas sem rolagem horizontal

O quadro usará uma grade com uma fração igual por coluna e largura mínima zero nos painéis e conteúdos. O contêiner não terá `overflow-x-auto`, as colunas não terão largura fixa e textos longos poderão quebrar linha. A rolagem vertical interna continuará limitada a cada coluna.

Alternativa considerada: manter colunas fixas com rolagem lateral. Isso exige navegação horizontal constante e impede enxergar o fluxo completo de uma vez, contrariando a necessidade operacional atual.

### Autorização orientada por permissões

O item Processos e todas as consultas do quadro usarão a permissão de leitura de processos publicada pelo backend. Ocultar o item no cliente é apenas uma melhoria de interface; Route Handlers e API externa continuam responsáveis pela autorização efetiva.

Alternativa considerada: verificar apenas um nome de perfil BraCVAM. Perfis podem mudar e reunir permissões diferentes; códigos de permissão expressam melhor a capacidade efetiva da sessão.

## Risks / Trade-offs

- [A API não publica um estado `IN_PROGRESS` para tarefas] → No experimento, considerar a primeira triagem `READY` como nova e usar rodada posterior, retorno ao proponente e avanço de fase como sinais observáveis de revisão.
- [A API não devolve o nome da fase em `TaskSummary`] → Exibir número da fase no filtro e solicitar ao backend o nome localizado caso o experimento seja aprovado.
- [Muitos processos tornam a carga, a revalidação e o DOM pesados] → Buscar em lotes limitados, pausar consultas com o documento oculto, usar rolagem por coluna e medir o volume real antes de adicionar virtualização.
- [Colunas ficam estreitas em áreas pequenas] → Permitir quebra de texto, usar `min-width: 0` e manter os cartões compactos sem reintroduzir overflow horizontal.
- [Uma atualização reposiciona cartões durante a leitura] → Preservar identidade visual, foco e posição de rolagem sempre que possível e comunicar discretamente o horário da última atualização.
- [Uma página intermediária falha] → Não apresentar o quadro parcial como completo; preservar estado de erro e permitir nova tentativa integral.
- [Extração do shell causa regressão nas telas existentes] → Preservar contratos visuais e validar `/inicio`, `/usuarios`, sidebar e logout antes de incluir o Kanban.
- [A permissão de leitura ainda não está nomeada no frontend] → Confirmar o código no contrato da API antes de implementar a visibilidade do item e proteger as consultas internas.

## Migration Plan

1. Confirmar os valores de estado, seus rótulos, sua ordem de apresentação e o código de permissão de leitura.
2. Extrair o shell autenticado sem alterar as rotas existentes.
3. Publicar as consultas internas e a visualização somente leitura do Kanban.
4. Ativar a revalidação periódica depois de medir o custo da consulta completa no ambiente integrado.
5. Em rollback, remover o item Processos e a nova rota; nenhuma mudança de estado ou alteração de esquema precisa ser revertida.

## Checkpoint de retomada — 2026-10-02

A auditoria do OpenAPI publicado em `https://api.pivma.acerola.dev.br/openapi.json` mostrou que a interface de triagem ainda não está funcional de ponta a ponta, apesar de os campos e controles já estarem presentes:

- `POST /processes/{id}/triage/reviews` aceita `reviews[]` com `field_key`, `status` e `comments`; os estados usados pela tela (`APPROVED`, `NEEDS_REVISION` e `REJECTED`) estão alinhados ao fluxo planejado.
- `GET /processes/{id}/activities/{activity_key}/form` devolve `fields`, `values` e `reviews`. Portanto, a BraCVAM pode consultar os valores submetidos e o proponente pode receber os pareceres por campo sem que regras internas de IA sejam exibidas.
- `POST /processes/{id}/triage/decision` devolve `process_status` e `return_review_run`. O frontend ainda tipa e valida `new_process_status` e `next_activity_run`; assim, uma decisão pode ser persistida externamente e mesmo assim ser apresentada como falha local.
- `process_status` representa apenas o ciclo de vida (`OPEN`, `CLOSED`, `CANCELLED` ou `ARCHIVED`). O frontend não deve esperar `PLANNING` ou `SUBMISSION` nesse campo; avanço, retorno e responsabilidade devem ser confirmados por tarefas, fases e rodadas.
- Quando a decisão for `NEEDS_REVISION`, a API disponibiliza `GET/POST /processes/{id}/return-review`. O proponente deve ver a justificativa e escolher `REVISE`, `CONTEST_AI` ou `WITHDRAW`. O frontend ainda não possui essa integração.
- Em `REVISE`, uma nova rodada de submissão deve ser criada antes de liberar edição e reenvio. A tela atual não apresenta `form.reviews` nem distingue com segurança uma correção de um rascunho inicial para fins de exclusão.

Ordem recomendada para retomar:

1. Corrigir primeiro o contrato da resposta da decisão para impedir falso erro após mutação bem-sucedida.
2. Remover as expectativas de estados legados e confirmar o resultado por ciclo de vida mais tarefas correntes.
3. Implementar as rotas internas, serviço e tipos de `return-review`.
4. Apresentar ao proponente a decisão, justificativa e pareceres por campo, com as três escolhas publicadas pela API.
5. Liberar edição e reenvio somente depois de `REVISE`, mantendo toda submissão previamente enviada não excluível.
6. Validar o ciclo integrado `enviar → triar → solicitar correção → revisar → corrigir → reenviar → reanalisar`, além de aprovação e rejeição.

Na rodada aberta por `REVISE`, o formulário habilita somente os campos cujo parecer preservado seja `NEEDS_REVISION` ou `REJECTED`. Campos aprovados ou sem parecer permanecem visíveis, mas bloqueados, para impedir alterações fora do escopo solicitado pela BraCVAM. Como o contrato atual deixa de devolver os pareceres na nova rodada, a interface preserva o snapshot do retorno na sessão; a aplicação da mesma regra no servidor depende de a API manter os pareceres ou publicar explicitamente as chaves editáveis.
