## 1. Contratos e alinhamento do backend

- [x] 1.1 Ler a documentação instalada do Next.js 16.3.3 aplicável a páginas dinâmicas autenticadas, Route Handlers, cookies e carregamento de dados antes de alterar o código.
- [x] 1.2 Confrontar o OpenAPI e a API real com os contratos de usuários, tarefas, participantes, convites, entrega de e-mail e perfil mínimo.
  - Em 18/11/2026 foram confirmados `GET /users`, `GET/POST /processes/{process_id}/participants`, `GET/POST /processes/{process_id}/participants/invites`, estados do convite e da entrega, `assigned_at` e `role_key`. BraCVAM possui `users.read`; Proponente recebe `403`. Não existem cadastro por convite nem foto de perfil.
- [x] 1.3 Confirmar na API publicada que novas tarefas `assign_group_manager` e `assign_sponsor` são atribuídas a `bracvam` e retornam `can_act: true`; processos antigos foram excluídos do escopo conforme orientação do usuário.
- [ ] 1.4 Confirmar que o backend permite várias designações ativas `group_manager`, exige ao menos uma para concluir a etapa e mantém uma única designação ativa `sponsor`.
- [x] 1.5 Registrar que o contrato não oferece cadastro transacional por convite e definir o fluxo recuperável `prévia → cadastro/login → retorno → aceite explícito` usando as operações atuais.

## 2. Domínio e integração protegida

- [x] 2.1 Revisar os tipos em `types/` para representar linha do tempo, múltiplos integrantes do grupo gestor, resultado de busca de usuários, designação direta, convite, entrega e modal mínimo, sem tipos locais.
- [x] 2.2 Ajustar os serviços server-only para pesquisar usuários de forma paginada, criar designação por `user_id`, criar convite com `channel: email` e reconciliar participantes, convites e tarefas.
- [x] 2.3 Revisar o autorizador interno para exigir a capacidade BraCVAM alinhada pelo backend em todas as leituras e mutações da composição.
- [x] 2.4 Revisar os Route Handlers internos para busca de usuários, snapshot, designação direta, convite e conclusão das etapas, validando UUID, e-mail, papel e processo.
- [x] 2.5 Restringir as respostas internas aos campos necessários e garantir que `401`, `403`, `404`, `409`, `422` e falhas de entrega não exponham origem, cookie ou existência indevida de conta; tokens do canal `link` só podem aparecer na criação e na URL interna compartilhada.

## 3. Linha do tempo pós-aprovação

- [x] 3.1 Ajustar `/processos/[processId]/composicao` para apresentar uma linha do tempo retomável com **Definir grupo gestor** antes de **Definir patrocinador**.
- [x] 3.2 Fazer o sucesso da aprovação pela BraCVAM abrir a composição do mesmo processo sem alterar manualmente fase ou tarefa no cliente.
- [x] 3.3 Exibir estados pendente, em andamento e concluído de cada etapa conforme tarefas, participantes e convites retornados pela API.
- [x] 3.4 Permitir concluir a etapa do grupo gestor somente com ao menos um integrante ativo e liberar o patrocinador conforme o estado autoritativo da API.
- [x] 3.5 Manter a estrutura visual extensível para cargos futuros sem adicionar estatístico, laboratórios ou outras etapas nesta entrega.

## 4. Grupo gestor e patrocinador

- [x] 4.1 Implementar pesquisa paginada e seleção persistida de contas existentes para adicionar vários integrantes `group_manager`.
- [x] 4.2 Impedir confirmação baseada somente em texto livre, duplicidade evidente ou conta inativa e repetir a validação no servidor.
- [x] 4.3 Implementar a seleção de uma conta existente ou o convite por e-mail para a designação `sponsor`.
- [x] 4.4 Reconciliar a coleção após cada designação sem substituir integrantes existentes nem simular conclusão da etapa.
- [x] 4.5 Deixar claro na interface que o grupo gestor é formado por usuários comuns vinculados ao processo, sem área ou conta coletiva separada.
- [x] 4.6 Encerrar o estado de carregamento da busca em troca de consulta, cancelamento ou demora, e informar resultados vazios e falhas.
- [x] 4.7 Localizar contas ativas pelo nome completo em toda busca, mesmo quando a pesquisa remota retornar coincidências por nome de acesso ou e-mail.
- [x] 4.8 Não filtrar os resultados da busca por perfil, cargo local ou participação existente; validar a designação somente na confirmação pela API.
- [x] 4.9 Conectar o seletor à rota interna `/api/users` comprovada com uma consulta autenticada por nome na API real.
- [x] 4.10 Mostrar as contas retornadas logo abaixo da caixa de busca para que os resultados não dependam de abrir um seletor fechado.
- [x] 4.11 Organizar o modo de inclusão e campos auxiliares à esquerda e a pesquisa, os cartões de pessoas e a confirmação à direita, com resultados visuais mais claros.
- [x] 4.12 Reduzir a largura da coluna de modo e expandir a coluna de pesquisa e resultados.
- [x] 4.13 Abrir o formulário no modo de busca de conta existente para exibir a pesquisa imediatamente.
- [x] 4.14 Limpar consulta, seleção e resultados ao alternar o modo de convite/designação.
- [x] 4.15 Remover borda, fundo e recuo extra do seletor de modo para alinhar o texto ao formulário.
- [x] 4.16 Organizar grupo gestor e patrocinador em abas numeradas, exibindo uma etapa por vez e permitindo alternância acessível entre elas.
- [x] 4.17 Informar ao proponente que a BraCVAM está definindo a composição e só liberar sua consulta quando as tarefas de grupo gestor e patrocinador estiverem concluídas.
- [x] 4.18 Encaminhar ao backend de convites a origem HTTP(S) do site que iniciou a solicitação, em vez da origem da própria API.
- [x] 4.19 Adicionar aos detalhes dos processos em andamento um botão para abrir o histórico da submissão.
- [x] 4.20 Encaminhar à designação direta o cookie autenticado e a origem HTTP(S) da interface ao chamar a API externa.
- [x] 4.21 Permitir manutenção do grupo gestor após a conclusão da tarefa inicial para sessões BraCVAM com `process.participants.manage`, sem reabrir a tarefa.
- [x] 4.22 Encaminhar a origem HTTP(S) da interface na revogação de designações de participantes.

## 5. Convites e consulta de participantes

- [x] 5.1 Implementar o formulário separado de convite por e-mail com `channel: email`, preservação da entrada em falha e prevenção de envio concorrente.
- [x] 5.2 Mostrar convites pendentes separadamente dos participantes ativos e apresentar a situação de entrega sem afirmar que a mensagem chegou quando estiver pendente ou falhar.
- [x] 5.3 Atualizar o estado somente após aceite e designação publicados pela API, mantendo pendente a pessoa que ainda não possui conta ou não aceitou o convite.
- [x] 5.4 Implementar modal acessível de participante com somente nome, data de entrada localizada e cargo localizado; omitir foto e demais dados ausentes.
- [x] 5.5 Tratar convite aceito, expirado, revogado, duplicado e falha de reconciliação sem repetir automaticamente uma mutação aceita.
- [x] 5.6 Permitir à BraCVAM criar convite com `channel: link`, copiar a URL interna gerada uma única vez e manter o token fora de listagens, histórico e observabilidade.
- [x] 5.7 Criar a prévia pública interna do convite e o aceite autenticado, cobrindo pessoa já logada, com conta desconectada e sem conta.
- [x] 5.8 Preservar um destino interno validado durante cadastro e login, retornar à prévia e exigir confirmação explícita antes do aceite.
- [x] 5.9 Manter patrocinador e grupo gestor pendentes enquanto houver convites vigentes aguardando aceite, bloquear conclusão manual nesse estado e destacar a conclusão somente após tarefa concluída pela API e participante ativo.
- [x] 5.10 Destacar a pessoa convidada como patrocinador na etapa de definição e reorganizar os estados de efetividade, conflito e as ações de conflito/revogação do participante ativo.
- [x] 5.11 Reconciliar convites aceitos com `accepted_by` e participantes ativos do mesmo cargo; manter o convite visível como aguardando vínculo e não promovê-lo ao grupo gestor/patrocinador antes da designação ativa publicada pela API.
- [x] 5.12 Manter a edição do grupo gestor concluído disponível para a BraCVAM com `process.participants.manage`, inclusive após revogar o último integrante, sem reabrir a tarefa e permitindo inclusões sucessivas.
- [x] 5.13 Destacar a ação explícita **Concluir definição do grupo gestor**, permitindo inclusões sucessivas enquanto a tarefa estiver acionável e sem concluir após a primeira designação.

## 6. Navegação, consulta e internacionalização

- [x] 6.1 Permitir que a BraCVAM retome composições pendentes pelo shell e pelos detalhes do Kanban, preservando estados aberto, recolhido e móvel.
- [x] 6.2 Atualizar Submissões e Kanban para refletir grupo gestor, patrocinador, convites e etapas sem oferecer controles a sessões não autorizadas.
- [x] 6.3 Adicionar simultaneamente aos dicionários `pt-BR` e `en` títulos, etapas, cargos, campos, estados de convite e entrega, validações, toasts e nomes acessíveis.
- [x] 6.4 Preservar nomes e e-mails recebidos do backend e localizar datas, contagens e rótulos de cargos conforme o locale ativo.
- [x] 6.5 Identificar nos cartões da listagem de composição o proponente ativo retornado pela API, sem inferir ou inventar uma pessoa quando a designação estiver ausente.

## 7. Acessibilidade e verificação

- [ ] 7.1 Validar teclado, foco e restauração de foco do modal, layout estreito, troca de idioma com entrada preservada e anúncios de carregamento, sucesso e erro.
- [ ] 7.2 Exercitar `aprovação BraCVAM → grupo gestor com vários usuários → convite pendente → aceite → patrocinador`, incluindo duplicidade, concorrência, entrega falha e negação de autorização.
- [x] 7.3 Confirmar por inspeção de rede que o navegador usa somente rotas internas e não recebe origem externa, cookie ou dados administrativos desnecessários; no canal `link`, restringir o token à resposta imediata de criação e à URL interna compartilhável.
- [ ] 7.4 Executar `pnpm i18n:check`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `git diff --check` e `openspec validate add-post-approval-participant-assignments --strict`.

## 8. Continuidade operacional após a composição inicial

- [ ] 8.1 Usar as contas de demonstração BraCVAM, grupo gestor, grupo de seleção, estatístico, patrocinador, colaboradores e laboratórios para observar a API e registrar as `activity_key`, atores, permissões e estados reais publicados para cada designação e tarefa da tabela operacional.
- [ ] 8.2 Confirmar se a BraCVAM pode designar grupo de seleção de amostras, laboratório líder, laboratórios participantes, estatístico, colaboradores/observadores e especialistas temáticos ad hoc, incluindo cardinalidade, convites e conflitos.
- [ ] 8.3 Confirmar na API a dependência do grupo gestor para designar grupo de seleção, laboratório líder, laboratórios participantes e estatístico; verificar se colaboradores/observadores e especialistas ad hoc têm pré-requisitos.
- [ ] 8.4 Mapear as tarefas locais do grupo de seleção para definir/preparar amostras, do estatístico para plano estatístico e de cada laboratório para confirmação de recebimento, verificando isolamento por processo, cargo e laboratório.
- [ ] 8.5 Confirmar quais atividades da fase 2 bloqueiam a homologação da estrutura e como a API comunica a disponibilidade da tarefa BraCVAM.
- [ ] 8.6 Confirmar o contrato que, após o registro de não conformidade por um laboratório, cria ou disponibiliza a tarefa de resolução ao grupo de seleção e preserva o histórico da ocorrência e decisão.
- [ ] 8.7 Atualizar tipos, serviços server-only, Route Handlers, interface, autorização e dicionários pt-BR/en para as etapas confirmadas, sem simular transições no cliente.
- [ ] 8.8 Validar ponta a ponta designações, tarefas locais, bloqueio/liberação da homologação, recebimento por laboratórios distintos e resolução de não conformidades com as contas de demonstração.
