## Context

O shell autenticado concentra sessão, perfil ativo, idioma, navegação e logout em um único componente cliente. Não há tipos, serviço ou Route Handlers de alerts, nem rota interna para consultar uma tarefa individual; a API de tarefas atual fornece somente a listagem usada pelo Kanban. As telas de destino são especializadas por módulo: submissões para proponente, acompanhamento para patrocinador, grupo para grupo gestor, Kanban para perfis administrativos e workspaces próprios para amostras.

O contrato temporário da Spec 047 do backend oferece listagem paginada com contador global, leitura individual idempotente, leitura coletiva e targets abstratos. Ele também declara como UTC timestamps ISO sem offset, formato que o construtor `Date` interpreta como horário local. As escritas autenticadas por cookie exigem `Origin` autorizado. Veja `proposal.md` para a motivação e os specs desta change para o comportamento observável.

## Goals / Non-Goals

**Goals:**

- Integrar alerts sem permitir chamadas diretas do navegador à API externa.
- Manter uma única fonte para contador, lista, mutações e reconciliação dentro do shell.
- Resolver targets para os workspaces atuais sem duplicar autorização no cliente.
- Aceitar novos `kind` sem quebrar a lista e recusar estruturas inseguras ou targets irresolvíveis.
- Tornar o painel utilizável em todos os módulos, idiomas e tamanhos de tela suportados.

**Non-Goals:**

- Implementar push, WebSocket, lembretes de prazo, preferências, exclusão ou arquivamento.
- Alterar os eventos que geram alerts ou o envio de e-mails no backend.
- Inferir permissões, fases ou transições a partir do alert.
- Traduzir automaticamente nomes, títulos ou conteúdo escrito por pessoas.
- Criar uma tela genérica que reúna todos os detalhes possíveis de um processo.

## Decisions

### 1. Painel responsivo no shell, sem nova rota pública

O sininho e a central serão um componente cliente do shell. Em telas largas, a central se apresenta como painel sobreposto alinhado ao header; em telas estreitas, ocupa um diálogo lateral ou de tela inteira com o mesmo conteúdo e gerenciamento de foco. O shell continuará responsável pela sessão, enquanto o componente de alerts manterá apenas estado de consulta e interação.

Uma página dedicada foi considerada, mas adicionaria uma nova entrada ao modelo de `activePage`, afastaria a pessoa do contexto atual e ainda exigiria o mesmo contador no shell. O painel permite consultar, filtrar e paginar sem perder a tela de origem.

### 2. Contrato de domínio tolerante a extensões, com normalização estrita da estrutura

Os tipos ficarão em `types/Alerta.ts` e separarão códigos conhecidos dos valores futuros. `kind` e `target.type` desconhecidos serão preservados como strings para permitir fallbacks; campos estruturais, UUIDs, paginação, datas e tipos de parâmetros continuarão validados. O normalizador aceitará em `params` somente string, número, booleano ou `null`, sem promover conteúdo a HTML.

Rejeitar todo alert ao encontrar um `kind` novo foi descartado porque contradiz a compatibilidade progressiva pedida pelo backend. Aceitar qualquer objeto sem normalização também foi descartado por transformar dados externos em estado confiável do cliente.

### 3. Fachada interna por Route Handlers

Será criado `services/Alerta.ts`, marcado como server-only, para chamar os endpoints externos. As rotas internas serão:

- `GET /api/alerts` para `page`, `per_page` e `unread`;
- `POST /api/alerts/[alertId]/read` para leitura individual;
- `POST /api/alerts/read-all` para leitura coletiva;
- `GET /api/tasks/[taskId]` para resolver targets de tarefa.

Os Route Handlers obterão o token somente do cookie HttpOnly, validarão UUIDs e filtros e usarão o padrão existente de respostas internas. Os POSTs exigirão `getRequestOrigin(request)` e encaminharão esse valor ao backend. Códigos externos serão preservados para localização, mas mensagens externas não serão exibidas quando puderem revelar detalhes.

Repassar o cookie diretamente do navegador ao backend foi descartado porque exporia a URL externa e quebraria a fronteira server-only do projeto.

### 4. Duas cadências de consulta

O shell buscará `GET /api/alerts?per_page=1` ao concluir a sessão, após navegação relevante e a cada intervalo entre 60 e 120 segundos enquanto a aba estiver visível. Abrir o painel buscará uma página de 20 itens. A consulta periódica será suspensa quando o documento estiver oculto e retomada ao recuperar visibilidade, evitando tráfego sem benefício.

Um polling da lista inteira foi descartado porque o envelope já fornece `unread_count` independentemente da paginação. Tempo real foi descartado por não existir no contrato atual.

### 5. Atualização otimista com reconciliação

Ao abrir um item não lido, a interface reduz o contador local, atualiza a aparência e dispara a leitura sem bloquear a navegação. Se a mutação falhar, uma consulta posterior restaura o estado confirmado. A leitura coletiva desabilita ações concorrentes, zera o contador de forma otimista e, em falha, restaura o snapshot anterior e apresenta toast localizado. Toda resposta bem-sucedida substitui o estado otimista pelos valores normalizados do servidor.

Esperar cada leitura antes de navegar foi descartado por tornar o alert um bloqueio de acesso ao destino. Ignorar falhas foi descartado porque deixaria o contador permanentemente divergente.

### 6. Resolvedor central de destinos

Uma função tipada receberá `target`, alert e módulo ativo e retornará somente rotas internas conhecidas:

- `task`: consulta `/api/tasks/{id}` e mapeia `activity_key`; triagem abre `/triagem` com o processo selecionável, devolução abre `/submissoes` com o processo, designações abrem `/processos/{processId}/composicao`, homologação abre `/processos/{processId}/amostras`, resolução de recebimento abre o workspace de amostras e as demais atividades usam o contexto de processo do módulo;
- `process`: proponente abre `/submissoes?processId=...`, patrocinador abre `/acompanhamento/{processId}`, grupo gestor abre `/grupo/{processId}` e os demais módulos abrem `/processos?processId=...`;
- `sample_receipt`: abre `/processos/{processId}/recebimento-amostras?vialId=...`.

As telas que recebem query deverão tentar abrir ou destacar o objeto, mas continuar funcionais se ele não estiver na página atual. Respostas `404` serão convertidas na mensagem indistinguível de indisponibilidade exigida pelo spec. Um target desconhecido não produzirá URL por concatenação.

Uma nova página genérica de processo foi considerada, mas não há hoje um contrato de conteúdo comum adequado a todos os perfis. O resolvedor por módulo reutiliza as superfícies autorizadas já existentes.

### 7. Catálogo de mensagens por código, não por texto do backend

As chaves de i18n serão organizadas por `alerts.kinds`, `alerts.activities`, ações, estados e acessibilidade. Mensagens específicas usarão `kind`, `activity_key`, `run_number`, `status`, `role_key` e `vial_status`; `activity_name` será fallback de conteúdo institucional quando não houver chave estável conhecida. Os dicionários pt-BR e en terão as mesmas chaves e interpolações. Cargo e situação de frasco reutilizarão os rótulos semânticos existentes quando forem equivalentes.

Usar `activity_name` como frase completa foi descartado porque ele não garante o locale ativo. Traduzir valores recebidos foi descartado pelas regras de internacionalização do projeto.

### 8. Adaptador temporário para timestamps UTC sem offset

O normalizador de datas reconhecerá ISO 8601 sem `Z` ou offset somente nos campos documentados do contrato de alerts e acrescentará semanticamente UTC antes da conversão. Valores com offset serão mantidos; valores inválidos serão omitidos. A apresentação usará `Intl.DateTimeFormat` pelo helper de i18n com locale ativo e fuso do navegador.

Interpretar a string diretamente com `new Date(value)` foi descartado por mudar o instante conforme o fuso da máquina. O adaptador ficará isolado para ser removido quando o backend publicar offsets inequívocos.

## Risks / Trade-offs

- [O PR do backend ainda está em evolução] → Validar o OpenAPI publicado antes da implementação e manter normalizadores concentrados no serviço.
- [Mapeamentos de `activity_key` podem crescer] → Usar uma tabela exaustiva para chaves conhecidas e fallback seguro por módulo, com testes por destino.
- [Polling multiplica chamadas para perfis BraCVAM] → Consultar um único item, suspender em aba oculta e usar intervalo mínimo de sessenta segundos.
- [Atualização otimista pode piscar após falha] → Preservar snapshot, reconciliar com o servidor e anunciar falha sem impedir navegação.
- [Header já é denso em telas estreitas] → Priorizar os três controles operacionais, ocultar elementos decorativos conforme necessário e validar sem sobreposição.
- [Data sem offset é um contrato ambíguo] → Manter conversão UTC coberta por teste e registrar a remoção quando o backend passar a incluir `Z` ou offset.
- [Destino existe, mas perdeu autorização] → Tratar `404` de modo indistinguível e não remover o alert do histórico.

## Migration Plan

1. Confirmar no OpenAPI da versão com Spec 047 os schemas, códigos e requisito de `Origin`.
2. Publicar tipos, serviço e rotas internas sem expor ainda o controle no shell.
3. Adicionar o painel e o contador atrás da disponibilidade bem-sucedida do endpoint; uma falha mantém o restante do shell operacional.
4. Habilitar resolvedores e parâmetros de destaque tela a tela, validando cada perfil com contas de demonstração.
5. Em rollback, remover o componente do shell e as rotas internas; alerts já persistidos permanecem íntegros no backend e e-mails não são afetados.
