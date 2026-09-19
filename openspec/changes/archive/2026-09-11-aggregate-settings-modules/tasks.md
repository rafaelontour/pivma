## 1. Tipagem e definições de domínio

- [x] 1.1 Criar `types/Configuracoes.ts` definindo os tipos e interfaces do hub de configurações (`SettingsModuleId`, `SettingsModuleItem`, `SettingsHubProps`, `SettingsModuleCardProps`, `SettingsSessionCapabilities`) e verificar conformidade de compilação com `pnpm tsc --noEmit`.
- [x] 1.2 Atualizar `types/AreaAutenticada.ts` incluindo `"settings"` na união `AuthenticatedPage` e as propriedades de autorização em `SidebarProps` (`canViewSettings`), verificando que não haja quebras de tipos existentes.

## 2. Componentes e página de Configurações

- [x] 2.1 Criar `components/configuracoes.ts` com a lista estruturada de módulos (Formulários, Avaliações por IA, Usuários), ícones, rotas e regras de verificação de permissão baseadas na sessão, verificando sua exportação e tipagem.
- [x] 2.2 Criar o componente do hub e cartões de módulos em `app/(paginas)/configuracoes/settings-hub.tsx` com apresentação dos módulos liberados, mensagens para acesso restrito e conformidade de acessibilidade (foco visível e labels acessíveis), verificando os estados visuais.
- [x] 2.3 Criar a rota e página `app/(paginas)/configuracoes/page.tsx` conectando o `SettingsHub` ao `AuthenticatedShell` com `activePage="settings"`, verificando a renderização correta da página na rota `/configuracoes`.

## 3. Atualização do shell e navegação lateral

- [x] 3.1 Atualizar `app/_components/authenticated-shell.tsx` para substituir os itens soltos de Formulários, Avaliações por IA e Usuários pelo item único "Configurações" na `Sidebar`, exibido apenas quando o usuário tiver acesso a ao menos um módulo, e verificar a configuração de cabeçalho (`getPageHeading`).
- [x] 3.2 Adicionar navegação de retorno contextual ("Voltar para Configurações") no topo dos módulos `/formularios`, `/avaliacoes-ia` e `/usuarios`, verificando que a navegação reconduz o usuário com segurança para a central de configurações.

## 4. Validação e integridade

- [x] 4.1 Executar a verificação estática de tipos e lint do projeto (`pnpm check` ou `pnpm tsc --noEmit` e `pnpm lint`), verificando que não existem erros de compilação ou violação de regras de tipos.
- [x] 4.2 Validar a navegação completa e o comportamento de controle de acesso nos diferentes perfis de usuário (administrador, proponente e usuário restrito), verificando a aderência aos cenários descritos na especificação.
