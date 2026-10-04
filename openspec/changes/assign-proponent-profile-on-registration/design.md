## Context

Veja [proposal.md](./proposal.md) para a motivação. O `POST /users` é público e cria somente a identidade. O OpenAPI atual publica dois perfis oficiais (`Administrador` e `BraCVAM`), treze permissões exclusivamente administrativas e nenhuma permissão global de submissão. `POST /processes` exige sessão, cria o vínculo local `proponent` para o autor e não declara uma capacidade global adicional.

O perfil necessário pode ser criado apenas como customizado (`official: false`) por uma sessão com gestão de RBAC. O frontend já possui serviços server-only para usuários, autenticação e perfis, e o navegador já usa `POST /api/auth/register` como única entrada de cadastro.

## Goals / Non-Goals

**Goals:**

- Entregar uma conta recém-cadastrada com a classificação global mínima necessária para a navegação de submissões.
- Manter a operação privilegiada no servidor e restrita ao identificador retornado pela criação feita na mesma solicitação.
- Evitar confirmação de sucesso quando a conta ficar parcialmente provisionada.
- Tornar a descoberta/criação do perfil tolerante à concorrência.

**Non-Goals:**

- Incorporar credenciais administrativas ao bundle, ao Git ou à sessão da pessoa cadastrada.
- Conceder ao proponente permissões de usuários, RBAC, catálogos, formulários, IA ou triagem.
- Inventar uma permissão de submissão que não existe no catálogo da API.
- Alterar a regra da API que concede e verifica o papel local `proponent` por processo.
- Transformar um perfil customizado em oficial, operação que o contrato atual não oferece.

## Decisions

### Orquestração server-only com credencial configurada

A rota interna validará os dados e delegará a um serviço server-only uma operação única de cadastro de proponente. O serviço lerá usuário e senha técnicos de variáveis próprias, autenticará na API, conservará o cookie apenas em memória e solicitará logout em um bloco de finalização.

As credenciais fornecidas para desenvolvimento não serão escritas no `.env` versionado nem usadas como constantes. A implantação deverá definir `PIVMA_REGISTRATION_ADMIN_USERNAME` e `PIVMA_REGISTRATION_ADMIN_PASSWORD` em seu cofre/ambiente server-only.

Alternativa considerada: armazenar no código as credenciais fornecidas. Isso exporia poder administrativo a todo clone e impediria rotação segura.

Alternativa considerada: atribuir o perfil pelo navegador depois do login. Isso exporia uma operação administrativa e permitiria escolher arbitrariamente usuário ou perfil.

### Perfil customizado mínimo e idempotente

Depois de autenticar, o serviço listará todas as páginas de perfis e buscará `Proponente` por comparação Unicode sem diferença de maiúsculas. Um perfil ativo compatível será reutilizado. Na ausência, será criado com descrição controlada e `permission_codes: []`. Em conflito de criação, o serviço repetirá a listagem e aceitará somente o perfil único compatível persistido.

Um perfil homônimo com permissões administrativas, inativo ou uma resposta ambígua não será alterado nem atribuído automaticamente. A falha será segura para evitar escalada de privilégio.

Alternativa considerada: copiar permissões de `Administrador` ou `BraCVAM`. Todas as permissões publicadas são administrativas e violariam o menor privilégio; a criação de processo já é autorizada a sessões autenticadas e produz o escopo local necessário.

### Preparação administrativa antes da identidade

O fluxo autenticará a conta técnica e resolverá o perfil antes de chamar `POST /users`. Assim, configuração ausente, credencial inválida ou falha de provisionamento do perfil não deixam uma nova identidade parcial.

Depois da criação, o serviço atribuirá o perfil exclusivamente ao `user.id` recém-retornado. Em falha persistente da atribuição, tentará `DELETE /users/{id}` com a mesma sessão para desativar a identidade. A resposta pública não confirmará a conta, independentemente do resultado da compensação; uma falha de compensação deverá ser distinguível em código interno para observação operacional, sem detalhes sensíveis no cliente.

Alternativa considerada: criar a identidade primeiro e pedir intervenção manual quando a atribuição falhar. Isso contradiz a promessa de que cadastro concluído está pronto para submeter e bloqueia nova tentativa por conflito de usuário/e-mail.

### Resultado e mensagens localizadas

A rota retornará `201` somente após a atribuição confirmada. Falhas terão códigos estáveis distintos para configuração indisponível, provisionamento recusado e falha do serviço, mas o formulário exibirá mensagens seguras provenientes dos dicionários `pt-BR` e `en`. A criação continuará sem login automático.

### Navegação decidida pelo perfil global

O shell comparará o nome normalizado do perfil com `proponente`. O papel local `proponent` será removido da decisão do menu porque ele descreve participação em um processo e também pode aparecer em sessões administrativas. A autorização efetiva das operações continuará na API e nas rotas internas.

## Risks / Trade-offs

- [Uma rota pública passa a acionar uma sessão privilegiada] → Restringir a operação a criar a identidade enviada, resolver um perfil de menor privilégio e atribuí-lo somente ao ID recém-criado; nunca aceitar IDs ou permission codes do cliente.
- [Credencial administrativa ampla pode vazar] → Usar somente variáveis server-only, não registrar payloads/cookies, descartar o cookie e sempre solicitar logout.
- [Dois cadastros podem criar o perfil ao mesmo tempo] → Tratar conflito como sinal para reler o catálogo e exigir um único perfil compatível.
- [Compensação de usuário pode falhar] → Não confirmar sucesso, retornar código seguro e deixar evidência operacional suficiente no servidor para reconciliação administrativa.
- [A API futura introduzir permissão própria de submissão] → Atualizar explicitamente o contrato e o conjunto mínimo; não incorporá-la por inferência automática.
- [Perfil customizado não é oficial] → Usar o nome estável como classificação temporária e migrar para um perfil oficial quando a API oferecer provisionamento próprio.

## Migration Plan

1. Configurar as duas variáveis administrativas server-only no ambiente, sem reutilizar variáveis públicas.
2. Publicar o serviço e a rota atualizados; o primeiro cadastro provisionará o perfil customizado idempotentemente.
3. Verificar que uma conta nova recebe `Proponente`, vê Submissões após login e cria um processo com escopo local `proponent`.
4. Verificar que contas administrativas sem `Proponente` deixam de ver o item Submissões.
5. Para rollback, restaurar o fluxo anterior de criação simples e remover as variáveis do ambiente. O perfil customizado já atribuído permanece inofensivo por não possuir permissões globais e pode ser desativado posteriormente por decisão administrativa.
