## Context

O frontend já normaliza escopos locais em `session.access.scopes`, lista tarefas correntes e acompanha processos do proponente, mas não possui tipos ou integrações para participantes e instituições. Depois da aprovação real da submissão, a API publicou simultaneamente `assign_sponsor` e `assign_group_manager` para o papel `proponent`; a criação dessas designações e das designações de laboratório é feita pelos endpoints de participantes e convites.

O contrato atual exige `user_id` para uma designação direta e exige `user_id` mais `laboratory_id` para `participating_laboratory`. Como a sessão do proponente recebe `403` em `/users`, a interface não pode depender do diretório administrativo. A API oferece convites por e-mail com os mesmos papéis, permitindo compor o processo sem ampliar `users.read`. A listagem de laboratórios também recusou a sessão proponente; a implementação deverá confirmar que o papel local efetivo `group_manager` recebe acesso ao catálogo antes de considerar o fluxo integrado concluído.

## Goals / Non-Goals

**Goals:**

- Modelar uma única jornada de composição retomável, dirigida pelas tarefas e escopos retornados pela API.
- Autorizar cada operação pelo papel local do processo, além da validação autoritativa do backend.
- Reutilizar convites por e-mail quando o ator não puder consultar usuários.
- Reconciliar tarefas, participantes e convites depois de cada mutação sem simular avanço local.
- Preservar os limites server-only e a internacionalização obrigatória do projeto.

**Non-Goals:**

- Criar ou administrar usuários, instituições ou laboratórios.
- Definir laboratório líder, gerente de estudo, estatístico ou outros papéis posteriores.
- Aceitar convites dentro desta entrega; o aceite segue o mecanismo publicado pela API.
- Revogar participantes, reenviar convites ou declarar conflitos, embora os contratos externos já ofereçam essas operações.
- Alterar manualmente estado, fase, atividade ou tarefa do processo.

## Decisions

### 1. Página única de composição por processo

A implementação usará `/processos/[processId]/composicao` como destino compartilhado pelo proponente e pelo grupo gestor. A página resolve a sessão no servidor e delega a interação a um workspace cliente, permitindo abrir o mesmo processo a partir de Submissões, da navegação autenticada e dos detalhes do Kanban.

Uma página separada mantém a composição independente do popup extenso da submissão e do modal de triagem. A alternativa de incorporar todos os controles no cartão de Submissões aumentaria o acoplamento e não atenderia bem a entrada posterior do grupo gestor.

### 2. Autorização por escopo local e tarefa acionável

Os Route Handlers carregarão a sessão e localizarão o escopo cujo `process_id` corresponde à URL. Operações iniciais exigirão o papel `proponent` e a tarefa acionável correspondente; laboratórios exigirão `group_manager`. A renderização do menu poderá considerar a existência do papel em qualquer escopo, mas cada leitura e mutação repetirá a autorização no servidor.

Perfis globais com nome semelhante não serão usados como substitutos. O backend continuará realizando a validação final de papel, tarefa e transição.

### 3. Convite como operação principal de atribuição

Patrocinador e grupo gestor serão definidos por `POST /processes/{process_id}/participants/invites`, com `email`, `role_key` e canal suportado pela API. O mesmo mecanismo será usado para a pessoa responsável por um laboratório, incluindo `laboratory_id`. Isso evita expor o diretório administrativo e funciona para identidades ainda não cadastradas.

A interface listará separadamente `/participants` e `/participants/invites`. Ela não inferirá pelo e-mail se a pessoa já existe e não converterá convite pendente em participante ativo localmente.

### 4. Laboratório é uma designação pessoa-laboratório

O seletor mostrará apenas laboratórios ativos retornados pelo catálogo institucional. A confirmação exigirá laboratório e e-mail, enviando `role_key: participating_laboratory` com `laboratory_id`. Participantes e convites já existentes serão usados para impedir repetições evidentes na interface, sem substituir a proteção de concorrência do backend.

Não será criado um conceito frontend de laboratório participante sem responsável, pois ele seria incompatível com `ParticipantAssignmentCreate` e `InviteCreate`.

### 5. Snapshot reconciliado depois de mutações

O workspace carregará em conjunto processo, tarefas correntes filtradas por `process_id`, participantes ativos, convites e, quando autorizado, laboratórios. Depois de criar um convite, repetirá as consultas do snapshot. Se a mutação for aceita e a reconsulta falhar, a interface comunicará estado possivelmente desatualizado e não repetirá o POST automaticamente.

O avanço de `assign_sponsor`, `assign_group_manager` e das etapas seguintes será reconhecido apenas pelas tarefas e pelo estado devolvidos pela API.

### 6. Integrações server-only por assunto

Os contratos ficarão em um novo arquivo de domínio em `types/`, e serviços server-only encapsularão participantes, convites e laboratórios. Route Handlers internos usarão respostas com códigos estáveis, validarão UUID, e-mail, papel permitido e associação obrigatória do laboratório antes de chamar a API externa.

O navegador não receberá a origem externa, cookies ou respostas administrativas completas. Novos textos e nomes acessíveis serão adicionados aos dois dicionários e validados com `pnpm i18n:check`.

## Risks / Trade-offs

- **[O papel local `group_manager` pode não autorizar o catálogo institucional]** → verificar o endpoint com uma sessão realmente designada antes de concluir a integração; se a API mantiver `403`, registrar a dependência de backend em vez de ampliar permissões ou usar credencial administrativa no frontend.
- **[Convite pendente pode não concluir imediatamente a tarefa]** → mostrar separadamente pendência e participação ativa e dirigir a UI pelos dados atuais da API.
- **[Duas pessoas podem compor o mesmo processo simultaneamente]** → bloquear somente operações locais em voo, tratar `409`/`422` e reconciliar o snapshot após a resposta.
- **[A navegação baseada em escopos pode mudar após convite ou aceite]** → recarregar a sessão ao entrar no workspace e após ações que alterem a participação do usuário atual.
- **[Catálogos e participantes podem ocupar várias páginas]** → percorrer paginação server-side antes de apresentar um conjunto completo, limitando requisições sequenciais e tratando falha parcial como erro do snapshot.

## Migration Plan

1. Publicar os tipos, serviços e Route Handlers sem expor entrada de navegação.
2. Disponibilizar o workspace ao proponente e validar `assign_sponsor` e `assign_group_manager` no processo já aprovado.
3. Validar o login da pessoa convidada como `group_manager` e o acesso ao catálogo de laboratórios.
4. Habilitar a navegação e a composição dos laboratórios participantes somente depois dessa validação.
5. Em rollback, remover as entradas e o workspace; designações já persistidas permanecem válidas na API e não exigem migração de dados.
