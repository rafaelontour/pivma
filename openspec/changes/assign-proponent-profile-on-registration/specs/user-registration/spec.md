## MODIFIED Requirements

### Requirement: Criação da conta

O sistema SHALL criar a identidade pelo serviço de usuários do pi*VMA, SHALL atribuir à nova conta o perfil global ativo `Proponente` e MUST comunicar o resultado do pedido sem expor a senha, credenciais administrativas ou cookies de sessão. O cadastro MUST ser confirmado somente depois que identidade e perfil estiverem disponíveis.

#### Scenario: Cadastro concluído com perfil Proponente

- **WHEN** o serviço cria a identidade e confirma a atribuição do perfil `Proponente`
- **THEN** o sistema exibe uma confirmação, orienta a pessoa a entrar com as novas credenciais e a conta encontra o módulo de submissões após o login

#### Scenario: Cadastro recusado antes da criação

- **WHEN** os dados são recusados ou a infraestrutura administrativa necessária não está disponível antes da criação da identidade
- **THEN** o sistema mantém os dados não sensíveis no formulário, informa que a conta não foi criada e não revela detalhes que permitam enumerar contas existentes

#### Scenario: Atribuição falha depois da criação

- **WHEN** a identidade é criada, mas a API não confirma a atribuição do perfil `Proponente`
- **THEN** o sistema não confirma o cadastro e tenta desativar a identidade recém-criada para evitar uma conta ativa parcialmente provisionada

## ADDED Requirements

### Requirement: Provisionamento mínimo do perfil Proponente

O sistema SHALL reutilizar um perfil ativo chamado `Proponente` ou SHALL provisioná-lo de forma idempotente quando ele ainda não existir. Enquanto a API não publicar uma permissão global de submissão, o perfil provisionado MUST possuir uma lista vazia de permissões globais, MUST NOT receber capacidades administrativas e SHALL servir como classificação global para acesso ao módulo; a autorização de cada processo continuará vinculada ao papel local `proponent` concedido pela API ao criador.

#### Scenario: Perfil compatível já existe

- **WHEN** o cadastro encontra um perfil ativo `Proponente` sem permissões administrativas
- **THEN** o sistema atribui esse perfil à nova identidade sem criar outro perfil

#### Scenario: Perfil ainda não existe

- **WHEN** não existe um perfil ativo chamado `Proponente`
- **THEN** o sistema cria um único perfil customizado com esse nome, descrição institucional e nenhuma permissão global e o atribui à nova identidade

#### Scenario: Cadastros concorrentes tentam criar o perfil

- **WHEN** duas solicitações de cadastro não encontram o perfil e concorrem para criá-lo
- **THEN** o sistema resolve o conflito consultando novamente o perfil persistido e não mantém perfis duplicados como resultado aceito

#### Scenario: Perfil homônimo concede capacidades incompatíveis

- **WHEN** existe um perfil `Proponente` que contém permissões administrativas
- **THEN** o sistema recusa o provisionamento automático e não atribui esse perfil à nova identidade

### Requirement: Credencial administrativa protegida

O sistema MUST manter a credencial usada no provisionamento exclusivamente no servidor, MUST limitar seu uso ao fluxo de cadastro e MUST encerrar sua sessão administrativa ao final da operação. A senha administrativa, o cookie privilegiado, a origem externa e detalhes sensíveis de falha MUST NOT ser enviados ao navegador, registrados nos dicionários ou versionados no repositório.

#### Scenario: Navegador solicita cadastro

- **WHEN** a pessoa envia dados válidos pela rota interna de cadastro
- **THEN** somente o servidor autentica a credencial técnica e o navegador recebe apenas o resultado seguro e localizado da operação

#### Scenario: Configuração administrativa está ausente

- **WHEN** a credencial técnica server-only não está completamente configurada
- **THEN** o sistema recusa o cadastro antes de criar a identidade e retorna uma falha segura de indisponibilidade

#### Scenario: Fluxo administrativo termina

- **WHEN** o cadastro termina com sucesso ou falha depois da autenticação técnica
- **THEN** o sistema solicita o encerramento da sessão administrativa e descarta localmente sua credencial temporária

