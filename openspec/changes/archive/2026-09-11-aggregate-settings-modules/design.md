## Context

O pi*VMA possui três módulos principais de administração técnica e parametrização:
1. **Formulários** (`/formularios`): edição de templates, seções e campos dinâmicos vinculados a processos.
2. **Avaliações por IA** (`/avaliacoes-ia`): catálogo de avaliações, objetivos, critérios assistidos, testes e publicação.
3. **Usuários** (`/usuarios`): gestão de contas, situação de acesso, edição de nome e perfis RBAC.

Atualmente, esses módulos aparecem como itens individuais de primeiro nível no menu lateral do `AuthenticatedShell`. Para manter a navegação limpa e oferecer uma experiência coesa, esses módulos serão agregados sob a página unificada "Configurações" (`/configuracoes`), com listagem modular e controle de visibilidade baseado nas permissões do usuário autenticado.

## Goals / Non-Goals

**Goals:**
- Criar a página "Configurações" (`/configuracoes`) exibindo uma listagem estruturada dos três módulos (Formulários, Avaliações por IA e Usuários).
- Condicionar a exibição/habilitação de cada módulo às permissões da sessão atual:
  - Formulários: perfil Grupo Gestor, permissão `rbac.read` ou `isAdministrator`.
  - Avaliações por IA: permissões `ai_evaluations.read` ou `ai_evaluations.manage`.
  - Usuários: permissão `users.read`.
- Ajustar a barra lateral (`Sidebar`) no `AuthenticatedShell`:
  - Substituir os links individuais pelo item consolidado "Configurações" (`SlidersHorizontal` ou `Settings`).
  - Exibir o item na barra se o usuário tiver acesso a pelo menos um módulo de configuração.
  - Manter a indicação de página ativa quando o usuário estiver em `/configuracoes` ou nas páginas subordinadas de cada módulo.
- Adicionar navegação contextual de retorno ("Voltar para Configurações") no cabeçalho ou topo dos módulos.
- Manter estrita conformidade com a regra do projeto: todas as interfaces e tipos de domínio devem ser declarados em `types/Configuracoes.ts` e `types/AreaAutenticada.ts`.

**Non-Goals:**
- Não alterar as rotas e contratos de backend já existentes para formulários, avaliações de IA ou usuários.
- Não embutir todo o código complexo dos módulos em abas gigantes dentro da mesma página: a listagem direciona para as páginas dedicadas já testadas e funcionais (`/formularios`, `/avaliacoes-ia`, `/usuarios`).
- Não alterar regras de negócio ou permissões do RBAC existente.

## Decisions

### Decisão 1: Arquitetura da listagem em Hub modular

- **Escolha**: Manter as rotas especializadas existentes (`/formularios`, `/avaliacoes-ia`, `/usuarios`) e fazer de `/configuracoes` um Hub de distribuição e descoberta visual.
- **Alternativa considerada**: Unificar tudo em abas na mesma rota `/configuracoes`.
- **Justificativa**: Cada módulo possui estado rico, formulários modais, paginação e conexões próprias. Agrupar em abas na mesma página aumentaria excessivamente o bundle inicial e a complexidade de ciclo de vida. O padrão Hub fornece uma visão clara dos recursos com links diretos e permite expansão futura de novos módulos de configuração.

### Decisão 2: Centralização de tipos em `types/Configuracoes.ts`

- **Escolha**: Criar `types/Configuracoes.ts` exportando `SettingsModuleId`, `SettingsModuleItem`, `SettingsHubProps`, `SettingsModuleCardProps`.
- **Alternativa considerada**: Declarar tipos locais nos componentes de página.
- **Justificativa**: Cumpre a regra obrigatória do projeto (`AGENTS.md`): *"Toda tipagem de domínio ou de interface deve ficar em `types/`, organizada por assunto... Componentes, rotas e serviços devem somente importar esses tipos, sem declarar `type` ou `interface` localmente."*

### Decisão 3: Atualização do `AuthenticatedShell` e `types/AreaAutenticada.ts`

- **Escolha**:
  - Adicionar `"settings"` ao união `AuthenticatedPage`.
  - Adicionar `canViewSettings: boolean` às propriedades do `SidebarProps` (ou computar via `canManageForms || canViewAiEvaluations || canManageUsers`).
  - Atualizar o `getPageHeading` com títulos e descrição para "Configurações".
  - Na barra lateral, substituir os links soltos de formulários, avaliações e usuários por um único link para `/configuracoes`.
- **Alternativa considerada**: Manter menu sanfona (dropdown) na barra lateral.
- **Justificativa**: Uma barra lateral com comportamento sanfona colapsável adiciona atrito e complexidade desnecessária quando a barra já possui comportamento recolhível (w-20 para w-72). A página dedicada `/configuracoes` é mais acessível e ergonômica.

### Decisão 4: Navegação de retorno contextual

- **Escolha**: Adicionar um componente reutilizável ou link de retorno no início de cada módulo apontando de volta para `/configuracoes` com botão de voltar acessível.
- **Justificativa**: Garante fluxo bidirecional sem depender exclusivamente do botão "Voltar" do navegador.

## Risks / Trade-offs

- **[Risco]** Usuário tentar acessar diretamente `/configuracoes` sem ter permissão a nenhum dos três módulos.
  - **Mitigação**: O hub exibe um estado seguro de feedback ("Nenhum módulo de configuração disponível para o seu perfil") e o item do menu não é renderizado na barra lateral.
- **[Risco]** Quebra de bookmarks ou links diretos para `/formularios`, `/avaliacoes-ia` e `/usuarios`.
  - **Mitigação**: As rotas existentes permanecem operacionais e com suas próprias proteções de sessão e permissão.

## Migration Plan

1. Criar `types/Configuracoes.ts` com as interfaces e tipos necessários.
2. Atualizar `types/AreaAutenticada.ts` com suporte à página `settings`.
3. Criar `components/configuracoes.ts` com dados estruturados dos módulos (ícones, títulos, descrições, rotas e verificadores de permissão).
4. Criar o componente `SettingsHub` e a página `app/(paginas)/configuracoes/page.tsx`.
5. Atualizar `AuthenticatedShell` (`app/_components/authenticated-shell.tsx`) com o novo item no menu e cabeçalhos de página.
6. Adicionar links de retorno contextual nas telas de formulários, avaliações por IA e usuários.
7. Executar testes de lint, typecheck (`pnpm check` ou `tsc --noEmit`) e validar funcionamento.
