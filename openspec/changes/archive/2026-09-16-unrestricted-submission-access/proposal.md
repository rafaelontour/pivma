## Why

Atualmente, o item de menu "Submissões" e o acesso à área de submissões estão condicionados ao perfil específico de "Proponente" (`session.user.profiles.some(profile => profile.name === "Proponente")`). Para permitir que qualquer pessoa autenticada na plataforma pi*VMA possa visualizar o menu e acessar a página de submissões sem exigir esse perfil específico, esse requisito deve ser removido, tornando o item e a página de submissões irrestritos para todas as sessões autenticadas.

## What Changes

- Remoção do requisito de perfil "Proponente" para exibição do item de menu "Submissões" na barra lateral da área autenticada (`AuthenticatedShell` / `Sidebar`).
- Ajuste na tipagem de propriedades da barra lateral (`SidebarProps` em `types/AreaAutenticada.ts`) para refletir que submissões não dependem mais de checagem condicional de perfil.
- Confirmação de que o acesso direto à rota `/submissoes` continua livre para qualquer pessoa autenticada.
- Atualização do requisito e cenários na especificação `authenticated-navigation`.

## Capabilities

### New Capabilities

### Modified Capabilities
- `authenticated-navigation`: Atualiza o requisito "Acesso às submissões do proponente" para que a navegação para Submissões seja apresentada para qualquer pessoa autenticada, sem exigência do perfil "Proponente" ou permissões específicas.

## Impact

- `app/_components/authenticated-shell.tsx`: O link de Submissões passa a ser exibido para qualquer usuário autenticado.
- `types/AreaAutenticada.ts`: Simplificação de `SidebarProps`.
- Especificações do OpenSpec (`authenticated-navigation`).
