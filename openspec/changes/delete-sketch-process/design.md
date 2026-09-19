## Context

Veja [proposal.md](./proposal.md) para a motivação. A especificação principal já descreve exclusão confirmada de rascunho, mas a change ampla `align-next-app-with-prototype-workflow` removeu temporariamente a integração porque o endpoint ainda não estava publicado. O OpenAPI consultado em 19/09/2026 agora publica `DELETE /processes/{id}` com resposta `204` e expõe `available_actions` nos detalhes listados do processo.

A página de submissões já filtra processos `SUBMISSION` pelos escopos em que a sessão possui o papel local `proponent`, usa somente `/api/*` no navegador e possui padrões de diálogo acessível e feedback Sonner. O arquivo do Kanban contém uma edição local na marcação do detalhe do processo; o reparo precisa preservar as demais mudanças do usuário e o comportamento somente leitura.

## Goals / Non-Goals

**Goals:**

- Autorizar a apresentação da ação pelo valor de `available_actions` devolvido para cada processo.
- Aplicar defesa em profundidade na rota interna, confirmando sessão e vínculo proponente antes de encaminhar a exclusão.
- Tratar o `204` sem tentar interpretar um corpo JSON e manter o último estado confirmado quando houver falha.
- Preservar foco, prevenção de concorrência e comunicação acessível durante a confirmação.
- Restaurar compilação e marcação válida do detalhe do Kanban sem descartar alterações locais alheias.

**Non-Goals:**

- Permitir apagar submissões que já avançaram para avaliação, triagem, planejamento ou encerramento.
- Expor a ação no Kanban administrativo ou transformar o quadro em uma interface mutável.
- Implementar arquivamento, desfazer exclusão ou exclusão em lote.
- Alterar as regras de autorização mantidas pelo backend.

## Decisions

### 1. `available_actions` decide a visibilidade, e o backend decide o resultado

`ProcessInstance` passará a aceitar uma lista tipada de ações disponíveis. O cartão só exibirá Apagar quando a lista contiver `DELETE`; estado `SUBMISSION` isolado não será tratado como autorização. A rota interna ainda verificará que o processo aparece nos escopos `proponent` da sessão, e a API externa continuará sendo a autoridade final.

Alternativa considerada: mostrar o botão para todo processo `SUBMISSION`. Foi rejeitada porque ignora restrições contextuais que o backend já representa explicitamente.

### 2. A integração reutiliza `/api/submissions/[processId]`

O Route Handler existente receberá um método `DELETE`. Ele validará UUID e sessão, recusará processos fora do escopo proponente e chamará uma operação server-only em `services/Submissao.ts`. Sucesso externo `204` será propagado como resposta interna sem corpo; erros manterão os status seguros já normalizados pelo projeto.

Alternativa considerada: criar `/api/submissions/[processId]/delete`. Foi rejeitada porque o recurso já possui rota interna própria e o método HTTP distingue a operação sem inventar uma subrota de ação.

### 3. A lista é reconciliada somente depois do sucesso

O catálogo manterá o rascunho selecionado para exclusão e um identificador da operação em andamento. Após `204`, filtrará o item da coleção confirmada, fechará o diálogo e emitirá sucesso. Qualquer resposta negativa ou falha de rede preservará o cartão e o diálogo para nova tentativa.

Alternativa considerada: remover o cartão antes da resposta e restaurá-lo em erro. Foi rejeitada porque produz sucesso visual temporário para uma operação destrutiva ainda não confirmada.

### 4. A confirmação reutiliza o padrão acessível do projeto

O diálogo terá título e descrição associados, contenção de foco, Escape, restauração do foco disparador e ações explícitas. A confirmação nativa do navegador não será usada. As propriedades e estados do componente permanecerão em `types/Submissao.ts`.

### 5. O reparo do Kanban será mínimo e verificado antes da feature

A marcação do bloco de detalhes será tornada internamente consistente, mantendo os elementos de rótulo e valor semanticamente compatíveis com seu contêiner. O arquivo será validado isoladamente e depois junto da aplicação; nenhuma lógica de carga, polling ou agrupamento será alterada.

## Risks / Trade-offs

- [Sessão possuir escopo antigo depois de uma alteração concorrente] → O backend revalida a exclusão e sua recusa é preservada; a UI não remove o cartão.
- [Resposta `204` ser tratada como JSON] → O cliente não chama `response.json()` no caminho de sucesso da exclusão.
- [Clique duplo disparar exclusões repetidas] → Um identificador em estado e referência bloqueia a operação concorrente antes da primeira espera assíncrona.
- [Rascunho desaparecer no backend entre listagem e confirmação] → O erro externo é apresentado e a lista pode ser recarregada explicitamente sem declarar exclusão local.
- [Reparo sobrescrever trabalho local no Kanban] → O diff atual será inspecionado e a alteração ficará restrita à marcação inválida.

## Migration Plan

1. Publicar o frontend após a versão da API que oferece `DELETE /processes/{id}` e `available_actions`.
2. Verificar um rascunho com e outro sem a ação `DELETE`, além de sucesso `204`, recusa e falha de rede.
3. Em rollback, remover apenas o método interno e a ação visual; os rascunhos existentes continuam íntegros no backend.
