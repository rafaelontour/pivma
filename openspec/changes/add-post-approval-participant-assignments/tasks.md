## 1. Contratos e preparação

- [x] 1.1 Ler a documentação instalada do Next.js 16.3.3 aplicável a páginas dinâmicas autenticadas, Route Handlers, cookies e carregamento de dados antes de alterar o código.
- [x] 1.2 Registrar e confrontar com o OpenAPI atual os contratos de tarefas, participantes, convites e laboratórios, incluindo paginação, respostas de conflito e papéis `sponsor`, `group_manager` e `participating_laboratory`.
  - Confirmados `GET /processes/{process_id}/participants`, `GET/POST /processes/{process_id}/participants/invites`, `GET /tasks?process_id=...` e `GET /institutional/laboratories`. `InviteCreate` aceita `email`, `role_key`, `laboratory_id` opcional e `channel`; `InviteCreatedResponse` inclui token, que o serviço server-only remove da resposta interna.
- [ ] 1.3 Validar com sessões reais que o proponente pode criar convites para patrocinador e grupo gestor e que uma pessoa com papel local efetivo `group_manager` pode listar laboratórios; registrar como dependência externa qualquer `403` incompatível sem introduzir credencial administrativa.

## 2. Domínio e integração protegida

- [x] 2.1 Criar em `types/` os contratos de participantes, convites, laboratórios, snapshot da composição, entradas de mutação e estados da interface, sem tipos locais em páginas, componentes, rotas ou serviços.
- [x] 2.2 Implementar serviços server-only paginados para consultar participantes, convites e laboratórios e para criar convites de designação, normalizando estritamente as respostas publicadas.
- [x] 2.3 Criar um autorizador interno por escopo de processo que diferencie `proponent` e `group_manager` e possa confirmar as tarefas acionáveis exigidas para as designações iniciais.
- [x] 2.4 Criar Route Handlers internos para carregar o snapshot da composição e criar convites, validando sessão, UUID, e-mail, papel permitido, laboratório ativo e autorização local antes de chamar a API.
- [x] 2.5 Garantir que paginação incompleta, `401`, `403`, `409`, `422` e respostas externas inválidas produzam códigos seguros e não exponham origem, cookie, existência de conta ou detalhes administrativos.

## 3. Composição pelo proponente

- [x] 3.1 Criar `/processos/[processId]/composicao` no shell autenticado com estados de carregamento, acesso negado, erro recuperável e snapshot retomável.
- [x] 3.2 Apresentar separadamente patrocinador e grupo gestor, distinguindo tarefa acionável, convite pendente e participante ativo.
- [x] 3.3 Implementar os formulários de convite por e-mail para `sponsor` e `group_manager`, com confirmação acessível, prevenção de envio concorrente e preservação da entrada em falhas.
- [x] 3.4 Reconciliar tarefas, participantes e convites após cada resposta aceita sem simular conclusão ou avanço de fase no cliente.
- [x] 3.5 Adicionar ao cartão da submissão aprovada o próximo passo e o acesso à composição, mantendo o processo visível após a conclusão das duas tarefas.

## 4. Laboratórios pelo grupo gestor

- [x] 4.1 Carregar para o grupo gestor apenas laboratórios ativos e apresentar instituição e nome sem traduzir conteúdo cadastrado no backend.
- [x] 4.2 Implementar a atribuição de laboratório participante exigindo laboratório e e-mail da pessoa responsável e enviando `participating_laboratory` com `laboratory_id`.
- [x] 4.3 Identificar participantes ativos e convites pendentes por laboratório, bloquear duplicidades evidentes e tratar concorrência com reconsulta autoritativa.
- [x] 4.4 Ocultar controles de laboratório de quem não possui papel local `group_manager` e confirmar que o acesso direto à rota e aos Route Handlers também é recusado.

## 5. Navegação e consulta administrativa

- [x] 5.1 Adicionar a entrada localizada de composição ao shell somente quando a sessão possuir tarefa ou papel local aplicável, preservando estados aberto, recolhido e móvel.
- [x] 5.2 Listar no destino apenas processos presentes nos escopos autorizados da sessão e permitir que o grupo gestor retome diretamente sua composição.
- [x] 5.3 Ampliar os detalhes somente leitura do Kanban para mostrar patrocinador, grupo gestor, laboratórios e pendências, sem adicionar alteração manual de estado.
- [x] 5.4 Garantir que revalidações de Submissões e Kanban reflitam o avanço produzido pela API depois das designações.

## 6. Internacionalização, acessibilidade e verificação

- [x] 6.1 Adicionar simultaneamente aos dicionários `pt-BR` e `en` todos os títulos, papéis, rótulos, estados, validações, confirmações, erros seguros e nomes acessíveis do fluxo.
- [ ] 6.2 Validar navegação por teclado, foco, layout estreito, troca de idioma com formulário parcialmente preenchido e anúncios de carregamento, sucesso e erro.
- [ ] 6.3 Exercitar de ponta a ponta `aprovação → definir patrocinador → definir grupo gestor → login do grupo gestor → atribuir laboratório participante`, incluindo retomada, convites pendentes, duplicidade, conflito concorrente e negações de autorização.
- [ ] 6.4 Confirmar por inspeção de rede que o navegador usa somente rotas internas e que nenhuma operação altera diretamente estado, fase, atividade ou tarefa.
- [x] 6.5 Executar `pnpm i18n:check`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `git diff --check` e `openspec validate add-post-approval-participant-assignments --strict`.
  - `i18n:check`, lint, TypeScript, `git diff --check` e OpenSpec passaram. O build foi executado no sandbox e fora dele, mas o Turbopack falhou ao tentar abrir uma porta local durante o processamento de `app/globals.css` (`Operation not permitted`).
