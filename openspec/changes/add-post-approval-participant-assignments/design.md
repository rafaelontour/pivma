## Context

O frontend já possui uma página de composição, integrações de participantes e convites e normalização de tarefas e escopos. A composição inicial é conduzida pela BraCVAM após a aprovação. A tabela operacional recebida também identifica etapas posteriores e seus responsáveis; esse fluxo deve ser documentado agora e validado com a API antes da implementação. A ordem relativa entre patrocinador e grupo gestor não define as dependências das atividades posteriores.

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
- Permitir convite por link para pessoas autenticadas, desconectadas ou ainda sem conta, preservando o retorno durante login e cadastro.
- Representar vários integrantes do grupo gestor como participantes locais `group_manager` do mesmo processo.
- Manter participantes ativos e convites pendentes como estados distintos e reconciliados com a API.
- Exibir somente dados de perfil efetivamente disponíveis.
- Preservar integrações server-only, autorização repetida no servidor e internacionalização obrigatória.
- Preparar a continuação do fluxo com dependências explícitas entre designações globais da BraCVAM e tarefas locais dos cargos designados.

**Non-Goals:**

- Criar uma entidade, conta ou plataforma própria para o grupo gestor.
- Tornar cadastro e aceite uma única transação ou aceitar um convite automaticamente ao abrir a URL.
- Implementar as atividades posteriores sem antes confirmar contratos, atribuições, permissões e dependências na API.
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

O onboarding de uma pessoa sem conta usa o cadastro comum e o login antes de retornar ao convite. Como o backend não fornece uma operação transacional, cadastro e aceite permanecem etapas separadas; falha ou abandono em uma delas não pode ser apresentado como designação concluída.

### 6. Modal de participante usa um modelo mínimo

Ao selecionar um participante ativo, a página abrirá um modal com nome, `assigned_at` localizado e rótulo localizado de `role_key`. Outros campos só poderão ser adicionados quando vierem de um contrato autorizado.

Como a API não fornece foto, a entrega atual não mostrará foto nem reservará um dado fictício. Convites pendentes não abrirão o mesmo modal de participante, pois ainda não representam uma conta vinculada.

### 7. Snapshot reconciliado depois de mutações

O workspace carregará processo, tarefas, usuários pesquisados sob demanda, participantes e convites. Depois de uma designação direta, criação de convite ou conclusão de etapa, repetirá as consultas autoritativas. Se a mutação for aceita e a reconsulta falhar, comunicará estado possivelmente desatualizado sem repetir o POST automaticamente.

### 8. Integrações permanecem server-only

Tipos de domínio ficarão em `types/`; serviços server-only encapsularão o diretório, participantes e convites; Route Handlers validarão sessão, processo, UUID, e-mail, papel permitido e entradas obrigatórias. O navegador não receberá URL externa, cookie da API ou respostas administrativas desnecessárias. No canal `link`, o token bearer será devolvido uma única vez à interface BraCVAM para construir uma URL interna e depois existirá somente nessa URL durante a prévia e o aceite; listagens, histórico, logs e observabilidade nunca o reproduzirão.

### 9. Retorno ao convite depois da autenticação

A aplicação terá `/convites/[token]` fora do shell autenticado. A página consultará uma Route Handler interna de prévia, que encaminhará o token à API externa sem exigir sessão e devolverá somente cargo, processo, e-mail mascarado, validade e expiração. Se já houver sessão, a página permitirá o aceite explícito. Sem sessão, oferecerá entrada e cadastro usando um destino interno validado, nunca uma URL arbitrária.

O login aceitará apenas destinos internos reconhecidos e retornará à mesma página após autenticar. O cadastro preservará esse destino, conduzirá ao login quando a conta for criada e manterá o convite até a autenticação. O aceite será feito por outra Route Handler interna autenticada e a interface só mostrará a designação concluída após a resposta autoritativa.

### 10. Continuidade operacional após a composição inicial

O fluxo a investigar e implementar em uma etapa futura é:

1. A BraCVAM define o grupo de seleção de amostras, o laboratório líder, os laboratórios participantes, o estatístico, colaboradores/observadores e especialistas temáticos ad hoc. A tabela indica dependência do grupo gestor para o grupo de seleção, laboratórios e estatístico; as outras designações aparecem sem pré-requisito explícito.
2. O grupo de seleção executa a definição e preparação das amostras; o estatístico prepara o plano estatístico; cada laboratório participante confirma o recebimento em sua própria tarefa.
3. A homologação da estrutura do estudo é da BraCVAM e só abre quando as demais atividades requeridas da fase 2 terminarem.
4. Quando um laboratório registra um problema no recebimento, o sistema cria uma tarefa para o grupo de seleção de amostras resolver a não conformidade.

Essas relações são uma leitura da tabela fornecida e precisam ser confirmadas com tarefas reais, estados, permissões e contratos da API. Não inferir `activity_key`, regra de conclusão, cardinalidade ou condição exata de homologação antes dessa validação.

## Risks / Trade-offs

- **[As tarefas atuais pertencem ao proponente]** → alinhar workflow e autorização no backend antes de considerar a jornada integrada; não elevar privilégios no frontend.
- **[O cadastro e o aceite não são transacionais]** → preservar o destino entre cadastro e login, manter o convite pendente até o aceite explícito e permitir retomada segura em caso de falha.
- **[O token do link é uma credencial bearer]** → apresentá-lo somente na criação e na URL interna compartilhada, aplicar política de referência restritiva e impedir sua inclusão em listagens, logs e observabilidade.
- **[O envio pode ser aceito, mas falhar na entrega]** → mostrar separadamente estado do convite e estado de entrega, permitindo ação posterior sem afirmar que o e-mail chegou.
- **[Múltiplas pessoas podem ser adicionadas simultaneamente]** → bloquear apenas a mutação local em voo, tratar conflitos e reconciliar a coleção completa.
- **[O diretório pode expor dados além do necessário]** → pesquisar no servidor, aplicar paginação e devolver à composição somente campos necessários para identificar e selecionar a conta.
- **[A API não fornece foto]** → omitir o campo até existir contrato autorizado, em vez de inventar conteúdo.

## Migration Plan

1. Alinhar no backend o ator das tarefas, a autorização BraCVAM e a conclusão da composição inicial.
2. Ajustar tipos, serviços e Route Handlers para seleção direta, convite por e-mail e snapshot da linha do tempo.
3. Publicar a linha do tempo e o modal mínimo sem remover designações já existentes.
4. Validar com as contas de demonstração a atribuição das tarefas posteriores e confirmar cada dependência na API.
5. Especificar e implementar atividades locais, condições de homologação, recebimentos e resolução de não conformidades em fatias próprias.
6. Ligar o sucesso da aprovação à página de composição somente após a autorização integrada estar validada.
7. Em rollback, retirar os novos controles; participantes e convites já persistidos permanecem válidos na API.
