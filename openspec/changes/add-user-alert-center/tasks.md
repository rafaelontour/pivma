## 1. Contrato e fundação de domínio

- [x] 1.1 Ler a documentação instalada do Next.js 16.3.3 aplicável a Route Handlers, cookies, parâmetros dinâmicos, cache e navegação cliente antes de alterar o shell ou as rotas internas.
- [x] 1.2 Confirmar no OpenAPI da versão que contém a Spec 047 os schemas e códigos de `/alerts`, `/alerts/{alert_id}/read`, `/alerts/read-all` e `/tasks/{id}`, incluindo paginação, requisito de `Origin` e representação UTC das datas.
- [x] 1.3 Criar em `types/Alerta.ts` os tipos de alerts conhecidos e extensíveis, targets, parâmetros escalares, envelopes de paginação, filtros, estados do painel, resolvedor de destino e propriedades de componentes, sem declarar tipos locais na implementação.
- [x] 1.4 Implementar normalizadores estritos para item, lista, paginação e respostas de mutação, preservando `kind` e `target.type` futuros, recusando estruturas inseguras e cobrindo a compatibilidade UTC de timestamps sem offset.

## 2. Fachada server-only e rotas internas

- [x] 2.1 Implementar `services/Alerta.ts` como serviço server-only para listar alerts, marcar um item e marcar todos como lidos, preservando status e códigos seguros do backend.
- [x] 2.2 Ampliar o serviço de tarefas para consultar e normalizar uma tarefa individual por ID sem alterar o comportamento da listagem atual.
- [x] 2.3 Criar `GET /api/alerts` com sessão obrigatória e validação de `page`, `per_page` e `unread`, retornando somente o envelope normalizado.
- [x] 2.4 Criar `POST /api/alerts/[alertId]/read` com UUID e origem validados, resposta idempotente e tratamento indistinguível para item inexistente ou pertencente a outra pessoa.
- [x] 2.5 Criar `POST /api/alerts/read-all` com origem validada e resposta normalizada da quantidade alterada.
- [x] 2.6 Criar `GET /api/tasks/[taskId]` com sessão e UUID validados, mantendo a autorização efetiva no backend e convertendo indisponibilidade em resposta segura.

## 3. Internacionalização e apresentação dos alerts

- [x] 3.1 Adicionar em `pt-BR` e `en` chaves equivalentes para painel, filtros, paginação, estados, ações, acessibilidade, toasts, erros, indisponibilidade e fallback de tipo ou target desconhecido.
- [x] 3.2 Adicionar mensagens localizadas para todos os `kind` documentados e para as variações de `task_opened`, reutilizando rótulos existentes de cargos e situações de frasco sem traduzir nomes ou títulos recebidos.
- [x] 3.3 Implementar a composição tipada de mensagens por `kind`, `activity_key`, `run_number`, `status`, `role_key` e `vial_status`, omitindo parâmetros opcionais ausentes e usando fallback seguro para códigos futuros.
- [x] 3.4 Formatar criação e prazo pelo locale e fuso do navegador, preservando instantes com offset e tratando datas inválidas sem quebrar o item.

## 4. Central de alerts e estado de leitura

- [x] 4.1 Implementar o botão de sininho com nome acessível, selo de contagem, estado sem pendências e anúncio conciso das mudanças confirmadas.
- [x] 4.2 Implementar o painel responsivo com foco contido e restaurado, fechamento por teclado, abas Não lidos e Todos, lista ordenada, estados de carregamento/erro/vazio e paginação de 20 itens.
- [x] 4.3 Implementar leitura individual otimista sem bloquear a navegação, preservando `read_at` já existente e reconciliando contador e lista após sucesso ou falha.
- [x] 4.4 Implementar Marcar todos como lidos com bloqueio de ações concorrentes, rollback do snapshot em falha e comunicação localizada da quantidade atualizada.
- [x] 4.5 Integrar a central ao header de 72 pixels preservando menu, marcas, idioma e logout, com prioridade aos controles operacionais em telas estreitas.

## 5. Atualização periódica e ciclo de sessão

- [x] 5.1 Consultar o contador com `per_page=1` após carregar a sessão e ao mudar de rota, sem fazer a falha de alerts invalidar o restante do shell.
- [x] 5.2 Implementar polling do contador entre 60 e 120 segundos somente com a aba visível, interrompendo timers e requisições ao desmontar ou encerrar a sessão e retomando ao recuperar visibilidade.
- [x] 5.3 Reconciliar contador e página aberta após leituras, troca de filtro, troca de idioma, retorno de visibilidade e respostas concorrentes, impedindo que uma resposta antiga sobrescreva estado mais recente.

## 6. Resolução e preparação dos destinos

- [x] 6.1 Implementar o resolvedor central que aceita somente targets conhecidos e produz rotas internas por `target.type`, `activity_key` e módulo ativo, sem concatenar URLs externas.
- [x] 6.2 Encaminhar targets `process` para Submissões, Acompanhamento, Grupo ou Kanban conforme o módulo, preparando essas telas para localizar o processo recebido por parâmetro sem contornar autorização.
- [x] 6.3 Encaminhar targets `task` após consultar `/api/tasks/{id}`, cobrindo triagem, devolução ao proponente, designações, homologação, resolução de recebimento e fallback seguro para outras atividades.
- [x] 6.4 Encaminhar targets `sample_receipt` ao recebimento do processo e adaptar o workspace para localizar ou destacar `vialId` quando disponível, mantendo a tela utilizável quando o frasco não estiver na página atual.
- [x] 6.5 Tratar `404`, perda de acesso, target futuro e destino malformado com a mesma mensagem localizada de indisponibilidade, preservando o alert no histórico.

## 7. Verificação e validação integrada

- [x] 7.1 Cobrir normalizadores, timestamps UTC com e sem offset, mensagens conhecidas/futuras, parâmetros opcionais, resolvedores e reconciliação otimista com testes proporcionais à infraestrutura disponível no projeto.
- [ ] 7.2 Validar com contas de demonstração os fluxos `envio → task_opened para BraCVAM` e `pedido de revisão → task_opened para proponente`, além de status de submissão, designação, homologação, execução laboratorial e decisão de não conformidade.
- [ ] 7.3 Exercitar filtros, paginação além da última página, leitura repetida, marcar todos com zero ou vários itens, concorrência, sessão expirada, origem inválida, resposta malformada e alert pertencente a outra pessoa.
- [ ] 7.4 Validar todos os destinos com perfis de proponente, BraCVAM, patrocinador, grupo gestor e laboratório, incluindo perda de cargo ou acesso entre a criação e a abertura do alert.
- [ ] 7.5 Validar teclado, restauração de foco, leitor de tela, movimento reduzido, layout estreito, header sem sobreposição, polling em aba oculta e troca de idioma com o painel aberto.
- [ ] 7.6 Confirmar por inspeção de rede que o navegador acessa somente rotas internas, que polling e mutações não vazam cookie, URL externa ou conteúdo sensível e que as escritas encaminham a origem esperada.
- [x] 7.7 Executar `pnpm i18n:check`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `git diff --check` e `openspec validate add-user-alert-center --strict`.

### Evidências desta rodada

- As 12 contas de demonstração autenticaram pela aplicação. Em todas, a lista retornou zero alerts; filtros, contagem e página posterior à última foram verificados. Também passaram os casos de sessão ausente, query inválida, origem inválida e UUID inválido nas rotas internas.
- Como não havia alerts nas contas, não foi possível exercitar leituras reais, concorrência, destinos ou os eventos dos itens 7.2–7.4. O workspace não tem automação/browser disponível, então a inspeção visual, de acessibilidade e de rede dos itens 7.5–7.6 continua pendente.
