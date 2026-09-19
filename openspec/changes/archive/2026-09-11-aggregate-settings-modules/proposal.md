## Why

Atualmente, os módulos administrativos e de configuração ("Formulários", "Avaliações por IA" e "Usuários") são exibidos como itens soltos de primeiro nível na barra de navegação lateral. À medida que a plataforma cresce, essa dispersão sobrecarrega o menu principal e dificulta a visualização integrada dos recursos de configuração do pi*VMA.

Agregar esses três módulos sob uma página unificada chamada "Configurações" (`/configuracoes`) simplifica a navegação principal, oferece uma visão centralizada e modular da administração e mantém a aderência ao controle de acesso baseado em papéis (RBAC), exibindo apenas os módulos aos quais o usuário possui permissão.

## What Changes

- Criar a página central "Configurações" acessível pela rota `/configuracoes`.
- Agregar e listar na página "Configurações" os módulos:
  - **Formulários**: gerenciamento e edição de templates, seções e campos dinâmicos (requer perfil Grupo Gestor, permissão `rbac.read` ou administrador).
  - **Avaliações por IA**: catálogo de objetivos, versões imutáveis e critérios configuráveis de IA (requer permissão `ai_evaluations.read` ou `ai_evaluations.manage`).
  - **Usuários**: diretório de usuários, ativação/inativação, edição e atribuição de perfis de acesso (requer permissão `users.read`).
- Exibir cada módulo como um cartão ou item informativo com título, descrição objetiva, estado de permissão/acesso e link direto de abertura.
- Atualizar a barra de navegação lateral (`Sidebar`) no `AuthenticatedShell`:
  - Substituir os itens individuais de "Formulários", "Avaliações por IA" e "Usuários" por um único item consolidado "Configurações" com ícone representativo (e.g. engrenagem / `Settings`).
  - Exibir o item "Configurações" na barra lateral caso a pessoa usuária possua acesso a pelo menos um dos módulos agregados.
  - Atualizar a identificação de página ativa e cabeçalhos do shell para suportar a página `settings` (`/configuracoes`).
- Manter o acesso direto e a integridade funcional dos módulos existentes (`/formularios`, `/avaliacoes-ia`, `/usuarios`), adicionando navegação de retorno contextual para "Configurações".

## Capabilities

### New Capabilities

- `settings-page`: Página agregadora de configurações (`/configuracoes`) com listagem modular e acessível de Formulários, Avaliações por IA e Usuários baseada em permissões.

### Modified Capabilities

- `authenticated-navigation`: A navegação lateral passa a incluir o item "Configurações" em substituição aos acessos diretos soltos de Formulários, Avaliações por IA e Usuários, mantendo visibilidade condicionada às permissões da sessão.

## Impact

- Novas rotas e componentes: `app/(paginas)/configuracoes/page.tsx` e componente associado para a listagem dos módulos.
- Atualizações em `types/AreaAutenticada.ts` para incluir a nova página (`settings` ou `configuracoes`) e propriedades de navegação necessárias.
- Atualização do componente `AuthenticatedShell` em `app/_components/authenticated-shell.tsx` para suporte ao novo item de menu e cabeçalhos.
- Adição de links de retorno/breadcrumb nos módulos de formulários, avaliações por IA e usuários apontando para "Configurações".
- Sem impacto em endpoints de API ou esquemas de banco de dados; consome as permissões e serviços já existentes.
