## Why

Depois que uma submissão é aprovada pela BraCVAM, a equipe precisa iniciar a composição das pessoas que atuarão no processo. Sem uma jornada ordenada para formar o grupo gestor e definir o patrocinador, o processo não consegue avançar de maneira rastreável para as etapas seguintes.

## What Changes

- Levar a pessoa autorizada da BraCVAM, após aprovar a submissão, para uma página de composição do processo apresentada como uma linha do tempo retomável.
- Iniciar a linha do tempo com duas etapas ordenadas: primeiro **Definir grupo gestor** e depois **Definir patrocinador**, mantendo a estrutura preparada para receber futuramente etapas como definição de estatístico sem incluí-las nesta entrega.
- Representar o grupo gestor como uma coleção de usuários da própria plataforma vinculados ao processo com o papel local `group_manager`, sem criar uma conta, entidade ou plataforma separada para o grupo.
- Permitir adicionar ao grupo gestor pessoas que já possuem conta, por pesquisa e seleção no diretório autorizado de usuários.
- Permitir convidar por e-mail uma pessoa ainda não localizada na plataforma, solicitando ao backend o envio do convite e exibindo a designação como pendente até que o convite seja aceito e exista uma conta vinculada.
- Permitir definir o patrocinador por seleção de uma conta existente ou por convite, usando o papel local `sponsor`.
- Exibir separadamente participantes ativos, convites pendentes e a situação de entrega do convite, sem inferir localmente se um e-mail já possui conta.
- Permitir abrir um modal de participante com somente as informações efetivamente publicadas pela API, inicialmente nome, data de entrada no processo e cargo. Foto ou qualquer outro dado ausente não será simulado.
- Manter URL externa, credenciais e cookies exclusivamente no servidor por meio de serviços e Route Handlers internos.
- Criar simultaneamente toda a interface, validação e feedback em português do Brasil e inglês.

## Capabilities

### New Capabilities

- `process-participant-assignments`: composição pós-aprovação, em linha do tempo, do grupo gestor e do patrocinador, incluindo seleção de contas existentes, convites, estados pendentes, consulta dos participantes e retomada do fluxo.

### Modified Capabilities

- `dynamic-process-forms`: a aprovação da submissão pela BraCVAM passa a abrir a composição do processo e o acompanhamento reflete o andamento dessas etapas.
- `authenticated-navigation`: a equipe BraCVAM autorizada pode retomar composições pendentes sem criar uma área separada para integrantes do grupo gestor.
- `process-kanban`: os detalhes do processo passam a apresentar grupo gestor, patrocinador, convites e etapas pendentes sem permitir movimentação manual do quadro.

## Impact

- Revisão da página `/processos/[processId]/composicao`, do desfecho de aprovação da triagem, do shell autenticado e dos detalhes do Kanban.
- Contratos em `types/`, serviços server-only e Route Handlers internos para tarefas, usuários, participantes, convites e perfis mínimos de participantes.
- Uso de `GET /users`, `GET/POST /processes/{process_id}/participants`, `GET/POST /processes/{process_id}/participants/invites` e operações de conclusão de papel publicadas pela API.
- Dependência de alinhamento do backend: em 18/11/2026, as tarefas `assign_group_manager` e `assign_sponsor` são retornadas para `proponent`, embora a jornada definida nesta change seja conduzida pela BraCVAM.
- Dependência de backend para cadastro por convite: o contrato atual permite pré-visualizar e aceitar um convite apenas com sessão autenticada, mas não permite criar a conta e aceitar o convite de forma transacional.
- O contrato atual não publica foto de perfil; a interface não apresentará avatar fotográfico enquanto esse campo não existir.
- Laboratórios participantes, estatístico e demais cargos posteriores ficam fora desta entrega.
