## Why

Após autenticar, a pessoa ainda não tem uma área inicial que identifique sua sessão nem uma navegação preparada para o crescimento do produto. Uma barra lateral persistente cria esse ponto de entrada e estabelece o padrão de navegação para as próximas páginas.

## What Changes

- Adicionar uma área autenticada com uma página de Início como destino pós-login.
- Exibir uma barra lateral com o item de menu Início, seu ícone e a identificação do perfil autenticado.
- Adicionar um header horizontal de altura fixa para organizar a área de conteúdo autenticada.
- Oferecer no header uma ação explícita para encerrar a sessão atual.
- Permitir recolher e expandir a barra lateral sem perder o acesso ao menu ou à identificação essencial.
- Redirecionar uma autenticação bem-sucedida para a página de Início, em vez de manter a confirmação na tela de login.

## Capabilities

### New Capabilities

- `authenticated-navigation`: Navegação da área autenticada, incluindo a barra lateral recolhível, identificação do perfil e a página inicial.

### Modified Capabilities

Nenhuma.

## Impact

- Páginas e componentes da área autenticada no App Router.
- Fluxo de sucesso do formulário de login e verificação da sessão atual pela rota interna já existente.
- Estilos de layout responsivo e uma biblioteca de ícones compatível com a interface, caso o projeto ainda não tenha uma disponível.
