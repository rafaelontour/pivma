## Context

A área autenticada atual concentra o shell, a sessão, a navegação e a gestão de usuários em `authenticated-home.tsx`. Ainda não existe domínio de processos no frontend. A API externa publicada oferece `GET /processes` com paginação por `page` e `size` de até 100 registros e retorna, para cada processo, `id`, `code`, `title`, `status`, `template_key`, `version_number` e datas de início e encerramento. Também oferece consulta individual em `GET /processes/{id}`.

O contrato publicado define `status` apenas como texto livre e não oferece um catálogo ordenado de estados. Isso é suficiente para agrupar processos já existentes, mas exige uma configuração de apresentação no frontend para manter rótulos e ordem estáveis. O Kanban não altera estados: atividades e decisões do fluxo continuam sendo as únicas responsáveis por essas mudanças. Veja `proposal.md` e os requisitos em `specs/process-kanban/spec.md`.

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

### Colunas orientadas por uma configuração de apresentação

A ordem, o rótulo e a aparência das colunas serão definidos por uma configuração de apresentação baseada nos valores de `status` conhecidos do backend. Essa configuração não contém regras de transição e não altera o workflow. Valores não reconhecidos serão preservados numa coluna de contingência, usando o texto recebido da API, para que nenhum processo desapareça do quadro.

Antes da implementação visual, os valores de estado atualmente produzidos pelo fluxo deverão ser confirmados para definir os rótulos e a ordem inicial das colunas. O quadro continuará tratando valores novos de forma segura sem depender de atualização simultânea do frontend.

Alternativa considerada: ordenar alfabeticamente apenas os estados encontrados na resposta. Isso faria as colunas aparecerem e mudarem de posição conforme o conjunto consultado, prejudicando a leitura operacional.

### Revalidação periódica por snapshot completo

Depois da carga inicial, o cliente repetirá periodicamente a consulta de todas as páginas enquanto o documento estiver visível. Cada ciclo será montado separadamente e substituirá o quadro de forma atômica somente após obter o conjunto completo. Ao detectar mudança no `status`, a renderização reposicionará o cartão; processos novos ou que deixaram de ser acessíveis também serão reconciliados.

O intervalo ficará centralizado como configuração da interface. A sincronização será pausada quando o documento estiver oculto e retomada com uma nova consulta completa ao voltar, evitando tráfego contínuo sem benefício. Uma ação manual de atualização ficará disponível para recuperação imediata.

Alternativa considerada: atualizar os cartões individualmente. O endpoint atual lista processos por página e não oferece versão ou feed incremental; um snapshot completo evita combinar estados obtidos em momentos incompatíveis.

### Cartões semanticamente não arrastáveis

Cada cartão será implementado como conteúdo consultável com uma ação explícita para abrir detalhes. Não serão aplicados atributos draggable, alças, cursores de arraste ou bibliotecas de drag-and-drop. Alterações de coluna usarão a identidade estável do processo durante a reconciliação para evitar que a atualização seja interpretada como uma operação do usuário.

Alternativa considerada: manter suporte de drag desabilitado para uso futuro. Mesmo inativo, esse código comunicaria uma possibilidade de edição que não pertence ao produto e adicionaria dependência sem necessidade.

### Colunas fluidas sem rolagem horizontal

O quadro usará uma grade com uma fração igual por coluna e largura mínima zero nos painéis e conteúdos. O contêiner não terá `overflow-x-auto`, as colunas não terão largura fixa e textos longos poderão quebrar linha. A rolagem vertical interna continuará limitada a cada coluna.

Alternativa considerada: manter colunas fixas com rolagem lateral. Isso exige navegação horizontal constante e impede enxergar o fluxo completo de uma vez, contrariando a necessidade operacional atual.

### Autorização orientada por permissões

O item Processos e todas as consultas do quadro usarão a permissão de leitura de processos publicada pelo backend. Ocultar o item no cliente é apenas uma melhoria de interface; Route Handlers e API externa continuam responsáveis pela autorização efetiva.

Alternativa considerada: verificar apenas um nome de perfil BraCVAM. Perfis podem mudar e reunir permissões diferentes; códigos de permissão expressam melhor a capacidade efetiva da sessão.

## Risks / Trade-offs

- [A API não publica um catálogo de estados] → Confirmar os valores conhecidos para configurar rótulos e ordem e manter uma coluna de contingência para qualquer valor novo.
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
