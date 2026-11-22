## 1. Contrato e autorização

- [x] 1.1 Confirmar que a API cria afiliações por usuário e não oferece uma listagem inversa por laboratório.
- [x] 1.2 Confirmar campos obrigatórios, validação de estado ativo, resposta de conflito e permissões requeridas.
- [x] 1.3 Ler a documentação instalada da versão atual do Next.js para Route Handlers e autenticação.

## 2. Integração protegida

- [x] 2.1 Implementar serviço server-only para criar uma afiliação com os identificadores da instituição e do laboratório.
- [x] 2.2 Criar Route Handler interno por laboratório com autorização, validação de identificadores, conta ativa e catálogo ativo.
- [x] 2.3 Derivar a instituição do laboratório no servidor e mapear erros seguros, inclusive conflito.

## 3. Inclusão pela lista de laboratórios

- [x] 3.1 Exibir ação de inclusão na linha de laboratório ativo para sessões com as permissões necessárias.
- [x] 3.2 Buscar contas ativas exclusivamente por nome completo, ignorando caixa e acentuação, e permitir seleção inequívoca.
- [x] 3.3 Criar diálogo acessível com regiões e estados visuais distintos e incluir a pessoa pelo laboratório selecionado.
- [x] 3.4 Não mostrar lista de membros nem fazer chamadas N+1 sem endpoint inverso.
- [x] 3.5 Manter a inclusão separada de perfis e designações de processo.

## 4. Internacionalização e verificação

- [x] 4.1 Adicionar textos e mensagens do fluxo em `pt-BR` e `en`, removendo a gestão da listagem de usuários.
- [x] 4.2 Executar `pnpm i18n:check`, `pnpm lint`, `pnpm exec tsc --noEmit`, build de produção com webpack, `git diff --check` e `openspec validate manage-laboratory-members --strict`.
- [x] 4.3 Validar a correção da busca exclusiva por nome e o refinamento visual do modal com `pnpm i18n:check`, lint, TypeScript, diff e OpenSpec.
