## 1. Tipagem e Componentes de Navegação

- [x] 1.1 Atualizar `types/AreaAutenticada.ts` removendo `canViewSubmissions` de `SidebarProps` e verificar ausência de referências órfãs via verificação de tipos
- [x] 1.2 Atualizar `app/_components/authenticated-shell.tsx` para que `Sidebar` renderize o link de Submissões para qualquer usuário com sessão ativa sem checar o perfil "Proponente", verificando com `pnpm exec tsc --noEmit`

## 2. Testes e Validação

- [x] 2.1 Atualizar ou criar testes de renderização da navegação para validar a presença do link de Submissões para usuários autenticados sem o perfil "Proponente" e verificar via `pnpm test`
- [x] 2.2 Executar a suíte de testes do projeto com `pnpm test` e checagem de tipos com `pnpm exec tsc --noEmit` garantindo que a aplicação compila sem erros
