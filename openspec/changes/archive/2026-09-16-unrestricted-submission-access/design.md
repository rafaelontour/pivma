## Context

Ver `proposal.md` para motivação e escopo.

Atualmente, `AuthenticatedShell` (`app/_components/authenticated-shell.tsx`) passa `canViewSubmissions` para o componente `Sidebar` com base na verificação:
`session.user.profiles.some((profile) => profile.name === "Proponente")`.

O componente `Sidebar` só exibe o item de navegação `Submissões` quando `canViewSubmissions` é verdadeiro. A rota `/submissoes` utiliza `AuthenticatedShell`, garantindo que a sessão esteja ativa, mas sem restrições adicionais em nível de rota no frontend.

## Goals / Non-Goals

**Goals:**
- Exibir o item de navegação "Submissões" na barra lateral para todas as pessoas autenticadas.
- Limpar a tipagem de `SidebarProps` em `types/AreaAutenticada.ts`, eliminando a propriedade `canViewSubmissions` que se tornou desnecessária.
- Manter o comportamento seguro de autenticação (redirecionamento para login caso não haja sessão válida).

**Non-Goals:**
- Tornar `/submissoes` uma rota pública deslogada (a página continua exigindo login na plataforma).
- Alterar as regras de autorização dos demais itens da barra lateral (Processos, Triagem, Formulários, Usuários, Observabilidade e Avaliações por IA continuam exigindo suas permissões específicas).
- Alterar as regras de autorização de escrita do backend/API externa.

## Decisions

### Decisão 1: Remoção de `canViewSubmissions` de `SidebarProps`
- **Escolha**: Remover a propriedade `canViewSubmissions` de `SidebarProps` em `types/AreaAutenticada.ts` e renderizar o link de Submissões diretamente no `Sidebar`, assim como já é feito com o link de "Início".
- **Alternativas consideradas**:
  - Manter a prop `canViewSubmissions` e passar `true`: descartado para não manter código morto e parâmetros redundantes na interface.

### Decisão 2: Preservação de tratamento de erro no catálogo e APIs
- **Escolha**: Manter o tratamento já existente de respostas 403/401 nos endpoints `/api/submissions/*` e nos componentes de catálogo. Se um usuário tiver sessão válida mas a API externa negar permissão em uma operação específica, a interface apresentará o feedback seguro já implementado.

## Risks / Trade-offs

- [Risco] Usuários com papéis restritos na API externa podem acessar a listagem e tentar iniciar submissão, recebendo 403 do backend.
  → Mitigação: O frontend já trata 403 exibindo mensagem amigável via Sonner ("Você não pode iniciar esta submissão.").
