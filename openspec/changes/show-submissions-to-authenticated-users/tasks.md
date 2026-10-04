## 1. Preparação e alinhamento

- [x] 1.1 Ler a documentação instalada do Next.js 16.3.3 aplicável ao limite entre o shell cliente, páginas autenticadas e Route Handlers antes de alterar o código.
- [x] 1.2 Confirmar no diff final que nenhuma parte da solução baseada em perfil customizado ou credencial administrativa foi incorporada ao cadastro.

## 2. Navegação autenticada

- [x] 2.1 Remover `canViewSubmissions` de `SidebarProps`, da chamada do componente e de seus parâmetros, mantendo as tipagens compartilhadas em `types/`.
- [x] 2.2 Renderizar o item Submissões incondicionalmente dentro da barra lateral autenticada, preservando rótulo traduzido, ícone, estado ativo e comportamento nos modos expandido, recolhido e móvel.
- [x] 2.3 Confirmar por inspeção que catálogo e criação continuam exigindo sessão e que rascunhos, formulários, anexos e acompanhamento continuam limitados aos escopos locais `proponent`.
- [x] 2.4 Substituir a validação duplicada da lista de processos em `services/Submissao.ts` pelo `normalizeProcessInstance` canônico, aceitando `template.key` e `template.version` sem relaxar o filtro por escopos `proponent`.

## 3. Verificação

- [x] 3.1 Validar com uma conta autenticada sem perfis e sem escopos que Início e Submissões aparecem, o catálogo abre e o primeiro processo pode ser criado conforme a API.
- [x] 3.2 Confirmar após a criação que a sessão recebe o papel local `proponent`, que o novo rascunho fica disponível e que processos de outras pessoas não são expostos.
- [x] 3.3 Verificar que uma requisição sem sessão continua recusada e que uma negação externa de catálogo ou criação permanece visível como erro, sem sucesso simulado.
- [x] 3.4 Executar `pnpm i18n:check`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `git diff --check` e `openspec validate show-submissions-to-authenticated-users --strict`.
