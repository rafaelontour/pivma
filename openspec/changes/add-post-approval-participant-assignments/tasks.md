## 1. Contratos e alinhamento do backend

- [x] 1.1 Ler a documentação instalada do Next.js 16.3.3 aplicável a páginas dinâmicas autenticadas, Route Handlers, cookies e carregamento de dados antes de alterar o código.
- [x] 1.2 Confrontar o OpenAPI e a API real com os contratos de usuários, tarefas, participantes, convites, entrega de e-mail e perfil mínimo.
  - Em 18/11/2026 foram confirmados `GET /users`, `GET/POST /processes/{process_id}/participants`, `GET/POST /processes/{process_id}/participants/invites`, estados do convite e da entrega, `assigned_at` e `role_key`. BraCVAM possui `users.read`; Proponente recebe `403`. Não existem cadastro por convite nem foto de perfil.
- [x] 1.3 Confirmar na API publicada que novas tarefas `assign_group_manager` e `assign_sponsor` são atribuídas a `bracvam` e retornam `can_act: true`; processos antigos foram excluídos do escopo conforme orientação do usuário.
- [ ] 1.4 Confirmar que o backend permite várias designações ativas `group_manager`, exige ao menos uma para concluir a etapa e mantém uma única designação ativa `sponsor`.
- [ ] 1.5 Especificar no backend o cadastro transacional por convite para uma pessoa sem conta, sem bloquear a documentação e a interface de pendência desta entrega.

## 2. Domínio e integração protegida

- [x] 2.1 Revisar os tipos em `types/` para representar linha do tempo, múltiplos integrantes do grupo gestor, resultado de busca de usuários, designação direta, convite, entrega e modal mínimo, sem tipos locais.
- [x] 2.2 Ajustar os serviços server-only para pesquisar usuários de forma paginada, criar designação por `user_id`, criar convite com `channel: email` e reconciliar participantes, convites e tarefas.
- [x] 2.3 Revisar o autorizador interno para exigir a capacidade BraCVAM alinhada pelo backend em todas as leituras e mutações da composição.
- [x] 2.4 Revisar os Route Handlers internos para busca de usuários, snapshot, designação direta, convite e conclusão das etapas, validando UUID, e-mail, papel e processo.
- [x] 2.5 Restringir as respostas internas aos campos necessários e garantir que `401`, `403`, `404`, `409`, `422` e falhas de entrega não exponham origem, cookie, token de convite ou existência indevida de conta.

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

## 5. Convites e consulta de participantes

- [x] 5.1 Implementar o formulário separado de convite por e-mail com `channel: email`, preservação da entrada em falha e prevenção de envio concorrente.
- [x] 5.2 Mostrar convites pendentes separadamente dos participantes ativos e apresentar a situação de entrega sem afirmar que a mensagem chegou quando estiver pendente ou falhar.
- [x] 5.3 Atualizar o estado somente após aceite e designação publicados pela API, mantendo pendente a pessoa que ainda não possui conta ou não aceitou o convite.
- [x] 5.4 Implementar modal acessível de participante com somente nome, data de entrada localizada e cargo localizado; omitir foto e demais dados ausentes.
- [x] 5.5 Tratar convite aceito, expirado, revogado, duplicado e falha de reconciliação sem repetir automaticamente uma mutação aceita.

## 6. Navegação, consulta e internacionalização

- [x] 6.1 Permitir que a BraCVAM retome composições pendentes pelo shell e pelos detalhes do Kanban, preservando estados aberto, recolhido e móvel.
- [x] 6.2 Atualizar Submissões e Kanban para refletir grupo gestor, patrocinador, convites e etapas sem oferecer controles a sessões não autorizadas.
- [x] 6.3 Adicionar simultaneamente aos dicionários `pt-BR` e `en` títulos, etapas, cargos, campos, estados de convite e entrega, validações, toasts e nomes acessíveis.
- [x] 6.4 Preservar nomes e e-mails recebidos do backend e localizar datas, contagens e rótulos de cargos conforme o locale ativo.
- [x] 6.5 Identificar nos cartões da listagem de composição o proponente ativo retornado pela API, sem inferir ou inventar uma pessoa quando a designação estiver ausente.

## 7. Acessibilidade e verificação

- [ ] 7.1 Validar teclado, foco e restauração de foco do modal, layout estreito, troca de idioma com entrada preservada e anúncios de carregamento, sucesso e erro.
- [ ] 7.2 Exercitar `aprovação BraCVAM → grupo gestor com vários usuários → convite pendente → aceite → patrocinador`, incluindo duplicidade, concorrência, entrega falha e negação de autorização.
- [x] 7.3 Confirmar por inspeção de rede que o navegador usa somente rotas internas e não recebe origem externa, cookie, token de convite ou dados administrativos desnecessários.
- [ ] 7.4 Executar `pnpm i18n:check`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `git diff --check` e `openspec validate add-post-approval-participant-assignments --strict`.
