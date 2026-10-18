## Purpose

Permitir que pessoas autorizadas consultem e administrem, de forma auditável, os vínculos entre contas existentes e laboratórios ativos do catálogo institucional.

## ADDED Requirements

### Requirement: Acesso à gestão de membros por laboratório
O sistema SHALL disponibilizar a ação **Gerenciar membros** em cada laboratório ativo para sessões com `institutional.affiliations.manage`. A página e todas as operações internas MUST repetir a autorização no servidor e MUST NOT conceder acesso com base somente no nome de um perfil.

#### Scenario: Administrador ou BraCVAM autorizado
- **WHEN** uma sessão possui `institutional.affiliations.manage` e abre a gestão de um laboratório ativo
- **THEN** o sistema apresenta os membros atuais e os controles de inclusão e desativação de vínculo

#### Scenario: Sessão sem permissão
- **WHEN** uma sessão sem `institutional.affiliations.manage` tenta acessar a interface ou uma rota interna de afiliações
- **THEN** o sistema recusa a operação sem revelar os membros do laboratório

### Requirement: Listagem autoritativa dos membros
O sistema SHALL consultar de forma paginada as afiliações ativas do laboratório selecionado e SHALL identificar cada membro por sua conta, instituição e laboratório. A consulta MUST usar uma operação de backend filtrada pelo laboratório e MUST NOT varrer o diretório inteiro consultando as afiliações de cada usuário individualmente.

#### Scenario: Laboratório com membros
- **WHEN** a API retorna afiliações ativas para o laboratório selecionado
- **THEN** o sistema lista nome, nome de usuário ou e-mail seguro de cada pessoa e identifica o laboratório correspondente

#### Scenario: Laboratório sem membros
- **WHEN** a consulta autoritativa não retorna afiliações ativas
- **THEN** o sistema apresenta um estado vazio e mantém disponível a ação para adicionar uma pessoa

#### Scenario: Consulta por laboratório indisponível
- **WHEN** o backend ainda não publica uma listagem ou filtro de afiliações por laboratório
- **THEN** a funcionalidade permanece indisponível com estado seguro e não substitui a consulta por uma varredura N+1 de usuários

### Requirement: Seleção de usuário existente
O sistema SHALL permitir localizar contas ativas pelo diretório autorizado e selecionar uma identidade persistida antes de criar um vínculo. O sistema MUST NOT criar usuário implicitamente, MUST NOT usar somente texto livre como identidade e MUST NOT permitir confirmação sem usuário válido.

#### Scenario: Seleção válida
- **WHEN** a pessoa autorizada pesquisa e seleciona uma conta ativa existente
- **THEN** o sistema associa a seleção ao identificador persistido do usuário e habilita a confirmação somente quando os demais campos estiverem válidos

#### Scenario: Usuário ausente ou inativo
- **WHEN** nenhum usuário foi selecionado ou a conta selecionada deixou de estar ativa
- **THEN** o sistema mantém a confirmação desabilitada e não envia a mutação

### Requirement: Criação de afiliação laboratorial
O sistema SHALL criar uma afiliação para a conta selecionada usando a instituição do laboratório e o próprio laboratório. A instituição e o laboratório MUST existir, estar ativos e corresponder entre si; valores ausentes, nulos, malformados ou divergentes MUST ser recusados no cliente e no servidor.

#### Scenario: Inclusão aceita
- **WHEN** usuário, instituição e laboratório ativos estão completos e a pessoa confirma
- **THEN** o sistema cria a afiliação, reconcilia a lista autoritativa e apresenta o novo membro

#### Scenario: Dados incompletos
- **WHEN** usuário, instituição ou laboratório estiver ausente, nulo ou inválido
- **THEN** a confirmação permanece desabilitada e nenhuma chamada de criação é realizada

#### Scenario: Vínculo duplicado ou concorrente
- **WHEN** já existe uma afiliação ativa equivalente ou outra sessão a cria simultaneamente
- **THEN** o sistema não duplica o vínculo, informa o conflito com segurança e atualiza a listagem antes de permitir nova tentativa

### Requirement: Desativação auditável de vínculo
O sistema SHALL permitir desativar uma afiliação mediante confirmação própria que identifique a pessoa e o laboratório. A operação MUST NOT ser apresentada como exclusão física e MUST NOT oferecer reativação enquanto o backend não publicar essa capacidade.

#### Scenario: Desativação confirmada
- **WHEN** a pessoa autorizada confirma a desativação de uma afiliação ativa
- **THEN** o sistema envia somente a desativação solicitada, reconcilia a lista e retira o vínculo dos membros ativos

#### Scenario: Desativação cancelada
- **WHEN** a pessoa fecha ou cancela a confirmação
- **THEN** o sistema mantém a afiliação sem realizar mutação

### Requirement: Afiliação não concede participação em processo
O sistema MUST tratar a afiliação laboratorial como vínculo institucional e MUST NOT criar perfil, convite ou papel em processo como efeito colateral. Uma pessoa afiliada somente participará de um processo quando o fluxo de participantes criar uma designação própria.

#### Scenario: Pessoa adicionada ao laboratório
- **WHEN** uma afiliação laboratorial é criada com sucesso
- **THEN** a conta passa a constar como membro institucional sem receber automaticamente `participating_laboratory` ou qualquer outro papel de processo

### Requirement: Segurança de integração, internacionalização e acessibilidade
O navegador MUST acessar somente Route Handlers internos para consultar ou alterar afiliações. Todo conteúdo controlado pela aplicação MUST existir em português do Brasil e inglês; nomes de pessoas, instituições e laboratórios MUST permanecer inalterados. Diálogos e controles MUST possuir foco inicial, contenção e restauração de foco, Escape, navegação por teclado e nomes acessíveis.

#### Scenario: Operação pela interface
- **WHEN** a pessoa consulta, adiciona ou desativa um membro
- **THEN** origem externa, cookies e credenciais permanecem no servidor e a interface apresenta textos no locale ativo

#### Scenario: Mutação em andamento
- **WHEN** uma criação ou desativação está sendo processada
- **THEN** ações conflitantes permanecem desabilitadas e a interface não repete automaticamente a mutação
