## Context

O frontend já possui uma página de composição, integrações de participantes e convites e normalização de tarefas e escopos. A revisão desta change altera, porém, o ator e o formato da jornada: a composição inicial passa a ser conduzida pela BraCVAM logo após a aprovação e deve aparecer como uma linha do tempo extensível, limitada agora ao grupo gestor e ao patrocinador.

O OpenAPI e chamadas somente de leitura realizadas em 18/11/2026 confirmaram:

- `assign_group_manager` e `assign_sponsor` existem, mas são tarefas `READY` atribuídas a `proponent`;
- BraCVAM e Administrador conseguem usar `GET /users`, enquanto a sessão Proponente recebe `403` por não possuir `users.read`;
- uma designação direta aceita `user_id`, e o convite aceita `email`, `role_key` e `channel: email`;
- o convite informa `pending`, `accepted` ou `revoked` e expõe a entrega mais recente como `pending`, `sent`, `failed` ou `cancelled`;
- o aceite atual exige sessão autenticada e não existe uma operação de cadastro por convite;
- participantes ativos fornecem `user.full_name`, `assigned_at` e `role_key`, mas nenhum contrato fornece foto de perfil.

## Goals / Non-Goals

**Goals:**

- Modelar uma jornada retomável e extensível, com grupo gestor antes do patrocinador.
- Permitir que a BraCVAM selecione contas existentes ou convide pessoas por e-mail.
- Representar vários integrantes do grupo gestor como participantes locais `group_manager` do mesmo processo.
- Manter participantes ativos e convites pendentes como estados distintos e reconciliados com a API.
- Exibir somente dados de perfil efetivamente disponíveis.
- Preservar integrações server-only, autorização repetida no servidor e internacionalização obrigatória.

**Non-Goals:**

- Criar uma entidade, conta ou plataforma própria para o grupo gestor.
- Implementar a interface usada pela pessoa convidada para criar a conta ou aceitar o convite.
- Definir estatístico, laboratórios, gerente de estudo ou outros cargos posteriores.
- Criar ou editar contas pelo fluxo de composição.
- Inventar foto, biografia, contato ou qualquer informação não publicada pela API.
- Alterar manualmente estado, fase ou tarefa do processo no navegador.

## Decisions

### 1. Página única com linha do tempo extensível

A implementação manterá `/processos/[processId]/composicao` como destino da composição. Ao concluir com sucesso a aprovação, a interface da BraCVAM navegará para essa página, que apresentará etapas ordenadas e estados de pendência, andamento e conclusão.

A primeira etapa será `group_manager` e aceitará múltiplas pessoas. A segunda será `sponsor` e tratará uma designação ativa. Novos cargos poderão virar novas etapas posteriormente, sem fazer parte dos contratos desta entrega.

### 2. A BraCVAM conduz a composição inicial

Route Handlers internos exigirão uma sessão BraCVAM com a capacidade publicada pelo backend para consultar e alterar a composição do processo. O backend precisa alinhar as tarefas e a autorização, pois atualmente `assign_group_manager` e `assign_sponsor` são atribuídas ao `proponent`.

O frontend não contornará essa divergência usando credencial administrativa técnica, simulando conclusão ou aceitando somente o nome do perfil. Até o contrato autoritativo ser ajustado, a divergência será tratada como dependência externa.

### 3. Grupo gestor é um conjunto de participantes locais

Cada integrante terá uma designação própria no processo com `role_key: group_manager`. Não haverá identificador coletivo, conta compartilhada ou novo tipo de usuário. A etapa listará todas as designações ativas e todos os convites pendentes desse papel.

A etapa só poderá ser concluída quando existir ao menos um integrante ativo e a API aceitar a conclusão do papel. Adicionar outra pessoa não substituirá integrantes já ativos.

### 4. Dois caminhos explícitos para adicionar pessoas

Para contas existentes, a página pesquisará o diretório autorizado e enviará uma designação direta com o `user_id` persistido. Texto digitado não será aceito como identidade sem seleção de um resultado.

Para pessoas não localizadas, uma ação separada abrirá o formulário de convite. O envio usará `channel: email`, e a interface exibirá tanto o estado funcional do convite quanto a situação de entrega informada pela API. A interface não tentará descobrir por respostas diferentes se um e-mail possui conta.

### 5. Convite pendente não é participante ativo

Convites e participantes serão consultados separadamente. Um convite continuará pendente até o backend registrar seu aceite e publicar a designação ativa correspondente. A interface não converterá o convite localmente nem concluirá a etapa apenas porque o e-mail foi enviado.

O onboarding de uma pessoa sem conta depende de uma operação transacional ainda ausente que derive o e-mail do token, crie a conta, aceite o convite, atribua o papel e estabeleça a sessão. Essa interface será especificada posteriormente, mas a pendência será visível nesta entrega.

### 6. Modal de participante usa um modelo mínimo

Ao selecionar um participante ativo, a página abrirá um modal com nome, `assigned_at` localizado e rótulo localizado de `role_key`. Outros campos só poderão ser adicionados quando vierem de um contrato autorizado.

Como a API não fornece foto, a entrega atual não mostrará foto nem reservará um dado fictício. Convites pendentes não abrirão o mesmo modal de participante, pois ainda não representam uma conta vinculada.

### 7. Snapshot reconciliado depois de mutações

O workspace carregará processo, tarefas, usuários pesquisados sob demanda, participantes e convites. Depois de uma designação direta, criação de convite ou conclusão de etapa, repetirá as consultas autoritativas. Se a mutação for aceita e a reconsulta falhar, comunicará estado possivelmente desatualizado sem repetir o POST automaticamente.

### 8. Integrações permanecem server-only

Tipos de domínio ficarão em `types/`; serviços server-only encapsularão o diretório, participantes e convites; Route Handlers validarão sessão, processo, UUID, e-mail, papel permitido e entradas obrigatórias. O navegador não receberá URL externa, cookie da API, token de convite ou respostas administrativas desnecessárias.

## Risks / Trade-offs

- **[As tarefas atuais pertencem ao proponente]** → alinhar workflow e autorização no backend antes de considerar a jornada integrada; não elevar privilégios no frontend.
- **[O cadastro por convite não existe]** → manter o convite pendente e tratar o onboarding como dependência de backend e entrega posterior.
- **[O envio pode ser aceito, mas falhar na entrega]** → mostrar separadamente estado do convite e estado de entrega, permitindo ação posterior sem afirmar que o e-mail chegou.
- **[Múltiplas pessoas podem ser adicionadas simultaneamente]** → bloquear apenas a mutação local em voo, tratar conflitos e reconciliar a coleção completa.
- **[O diretório pode expor dados além do necessário]** → pesquisar no servidor, aplicar paginação e devolver à composição somente campos necessários para identificar e selecionar a conta.
- **[A API não fornece foto]** → omitir o campo até existir contrato autorizado, em vez de inventar conteúdo.

## Migration Plan

1. Alinhar no backend o ator das tarefas, a autorização BraCVAM e a conclusão sequencial das duas etapas.
2. Ajustar tipos, serviços e Route Handlers para seleção direta, convite por e-mail e snapshot da linha do tempo.
3. Publicar a linha do tempo e o modal mínimo sem remover designações já existentes.
4. Ligar o sucesso da aprovação à nova página somente após a autorização integrada estar validada.
5. Em rollback, retirar o redirecionamento e os novos controles; participantes e convites já persistidos permanecem válidos na API.
