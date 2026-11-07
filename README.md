This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

Useful commands:

```bash
pnpm lint
pnpm build
pnpm start
```

## Decisões arquiteturais e de produto

Esta seção registra decisões relevantes que afetam contratos, autorização ou
fluxos entre frontend e backend. Novas decisões desse tipo devem ser incluídas
aqui na mesma alteração que as introduzir, além de serem detalhadas em
`openspec/` quando fizerem parte de uma funcionalidade planejada.

### Laboratórios e pessoas usuárias

- Um laboratório é um objeto institucional administrado pela BraCVAM. Ele não
  é uma conta de acesso e não possui credenciais próprias.
- A associação administrativa entre uma pessoa usuária e um laboratório é um
  vínculo institucional global, gerenciado nas configurações da BraCVAM. Esse
  vínculo não substitui a participação da pessoa em um processo específico.
- A participação de um laboratório em um processo é uma designação local que
  relaciona processo, laboratório, pessoa responsável e o papel técnico
  `participating_laboratory`.
- Papéis como `proponent`, `sponsor`, `group_manager` e
  `participating_laboratory` são locais ao processo. A mesma pessoa pode exercer
  papéis diferentes em processos distintos.
- Remover ou alterar um vínculo institucional não deve apagar silenciosamente o
  histórico ou uma designação do processo. A API deve tratar cada ciclo de vida
  explicitamente para preservar a rastreabilidade.

### Perfil administrativo de usuários

A página de perfil administrativo localiza os dados de conta pela listagem
autorizada `GET /users` e consulta os perfis globais pelo acesso RBAC. O
contrato atual não fornece a data de atribuição dos perfis globais, nem as
participações locais por processo e suas datas de atribuição. A interface marca
essas informações como indisponíveis; elas devem ser incluídas pelo backend em
um contrato autorizado de perfil antes de serem exibidas.

### Onboarding por convite de processo

- O link enviado por e-mail abre uma página pública de convite com o contexto
  do processo, o papel e o laboratório, quando aplicável.
- Para uma pessoa sem conta, o e-mail vem do próprio convite, aparece preenchido
  e não pode ser alterado. A pessoa informa somente os demais dados necessários
  para criar a conta.
- Criação da conta, aceite do convite, criação da participação e abertura da
  sessão devem formar uma única operação transacional no backend. Após o
  sucesso, a pessoa entra automaticamente somente nesse onboarding e é
  encaminhada ao processo relacionado ao convite.
- O frontend não deve encadear cadastro comum, login e aceite como três
  mutações independentes, pois uma falha intermediária poderia deixar a conta
  criada sem a participação correspondente.
- A sessão deve continuar sendo entregue por cookie seguro `HttpOnly`; tokens
  de acesso ou de convite não devem ser persistidos em armazenamento acessível
  a JavaScript.
- Para contas existentes, a pessoa autentica sua conta e o backend confirma que
  seu e-mail corresponde ao convite antes de aceitá-lo.
- Convites inválidos, expirados, revogados, já aceitos ou destinados a outra
  conta devem produzir respostas seguras, sem revelar dados adicionais.

#### Dependência pendente do backend

O contrato atual oferece a prévia pública `GET /invites/{token}` com e-mail
mascarado e o aceite autenticado `POST /invites/{token}/accept`. Para concluir o
onboarding definido acima, o backend ainda precisa publicar uma operação de
cadastro por convite, por exemplo `POST /invites/{token}/register`, que:

- derive o e-mail do token, sem aceitar e-mail enviado pelo navegador;
- valide validade, estado e destinatário do convite;
- crie a conta, aceite o convite e atribua o papel de forma atômica;
- crie a sessão e devolva o cookie seguro;
- retorne `process_id`, `role_key` e `laboratory_id`, quando houver, para o
  redirecionamento ao contexto correto.

Se o requisito de interface continuar exigindo a exibição do endereço completo,
a prévia do convite também precisará publicar esse valor ao portador do token;
caso contrário, a interface deve apresentar apenas o endereço mascarado e
informar que o e-mail será obtido do convite.

### Gestão e papéis locais do processo

A composição de um processo é separada do vínculo institucional de uma pessoa
com um laboratório. Os doze papéis locais reconhecidos pelo frontend são
`group_manager`, `study_manager`, `statistician`, `adhoc_evaluator`,
`peer_reviewer`, `lead_laboratory`, `participating_laboratory`, `proponent`,
`sponsor`, `sample_selection_group`, `regulatory_observer` e `collaborator`.
Convites, designações existentes, conflitos, revogações, conclusão de cargos e
histórico são operações distintas. A autorização efetiva continua sendo decidida
pelo backend para cada processo e operação.

Rotas de interface relacionadas:

- `/processos/composicao`: processos em que a sessão possui participação ou
  tarefa de composição.
- `/processos/[processId]/composicao`: participantes, convites e histórico de
  um processo.
- `/templates-coleta`: catálogo administrativo de templates e suas colunas.
- `/processos/[processId]/amostras`: definição de substâncias, documentos de
  segurança, etiquetas, códigos e homologação da estrutura.
- `/processos/[processId]/recebimento-amostras`: conferência e registro de
  recebimento, fotos e inconformidades; o acesso é apresentado conforme o papel
  laboratorial da sessão.

Os serviços que usam a API externa ficam em `services/` e são chamados somente
por Route Handlers em `/api/`. As mensagens e os códigos devolvidos pelo backend
são preservados nas respostas internas; validações locais usam o código
`VALIDATION_ERROR`. Cookies e a URL externa da API não são enviados ao navegador.

### Escopo dos templates e etapas de amostras

O catálogo permite criar e editar templates, configurar e ordenar colunas,
remover colunas e exportar cabeçalhos em CSV ou XLSX. A API não publica uma
operação para excluir um template inteiro, associá-lo a um processo ou gerar
PDF; o frontend não simula essas operações.

Na listagem de substâncias, o Route Handler aplica uma allowlist de campos e
omite dados de identidade química e cegamento quando a sessão atua como
laboratório. Frascos e inconformidades também passam por allowlists server-side.
O painel de homologação apresenta rodadas, pontos, pendências, designações,
contagens e decisões já devolvidas pela API. Decisões e controles laboratoriais
atualizam os dados consultados e não alteram fases ou tarefas diretamente no
cliente.

O vínculo removido de uma pessoa com um laboratório e uma designação ainda
ativa no processo continua dependendo de validação com sessões reais e do
comportamento publicado pelo backend. O frontend apresenta a efetividade da
designação informada pela API, mas não infere nem altera vínculos institucionais.

### Validação das alterações

Com `pnpm` instalado, os comandos usados para verificar estas alterações são:

```bash
pnpm i18n:check
pnpm lint
pnpm exec tsc --noEmit
pnpm build
git diff --check
openspec validate expand-process-participant-governance --strict
openspec validate manage-collection-templates --strict
openspec validate add-sample-definition-workspace --strict
openspec validate add-structure-approval-workflow --strict
openspec validate add-sample-receipt-workflow --strict
openspec validate add-laboratory-execution-controls --strict
```

Testes de autorização e fluxo ponta a ponta devem ser feitos com sessões reais
de proponente, patrocinador, grupo gestor, BraCVAM e laboratórios distintos;
uma compilação local não substitui essa validação. Neste ambiente, `pnpm build`
foi bloqueado pelo processo auxiliar do Turbopack; a compilação alternativa
`pnpm exec next build --webpack` concluiu com sucesso.

## Regras gerais para entradas e formulários

Estas regras são obrigatórias para todos os campos de entrada da aplicação,
incluindo formulários, diálogos, filtros, seletores e uploads:

- Trate valores ausentes, `null`, vazios, compostos somente por espaços,
  malformados ou fora dos limites permitidos como entradas inválidas.
- Normalize os valores de acordo com o domínio antes do envio, sem alterar
  identificadores técnicos ou conteúdo escrito por pessoas.
- Declare no controle as restrições aplicáveis, como obrigatoriedade, tamanho,
  formato, faixa e opções permitidas, oferecendo mensagens acessíveis e
  internacionalizadas em português do Brasil e inglês.
- Mantenha a ação de confirmação ou envio desabilitada enquanto as informações
  obrigatórias não estiverem completas e válidas. A validação também deve ser
  repetida no manipulador de envio para evitar chamadas programáticas inválidas.
- Nunca confie somente na validação do navegador. Route Handlers, serviços e a
  API devem validar novamente os dados antes de realizar qualquer mutação.
- Durante uma requisição, bloqueie novos envios e ações conflitantes para evitar
  cliques duplos, concorrência acidental e operações duplicadas.
- Quando uma operação for rejeitada, preserve as informações preenchidas para
  que a pessoa possa corrigir somente o necessário. Não envie automaticamente
  uma segunda mutação.
- Estados desabilitados, erros e instruções devem possuir indicação visual e
  semântica adequada para teclado e tecnologias assistivas.

Uma entrada de teste somente pode desconsiderar alguma dessas regras quando o
responsável pelo projeto solicitar explicitamente essa exceção no momento do
teste. A exceção deve ficar limitada aos campos e ao cenário indicados, não deve
ser generalizada para outros testes e não pode enfraquecer silenciosamente a
validação usada em produção.

## Docker

Build and start the production application at
[http://localhost:4025](http://localhost:4025):

```bash
docker compose up
```

Configure the backend documentation URL in the root `.env` file before
starting the application:

```bash
API_PIVMA=https://api.example.com/docs
docker compose up
```

The server derives the API base URL from this value. The variable is not
prefixed with `NEXT_PUBLIC_`, so it remains available only on the server.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
