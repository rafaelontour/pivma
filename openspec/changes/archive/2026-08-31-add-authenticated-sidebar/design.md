## Context

A autenticação atual cria uma sessão por rotas internas e consulta `/api/auth/me` para identificar a pessoa. Após a confirmação, a interface ainda permanece na tela de login. Esta mudança introduz a primeira área pós-login e o padrão visual de navegação para páginas futuras. Ver `proposal.md` para a motivação e `specs/authenticated-navigation/spec.md` para o comportamento esperado.

## Goals / Non-Goals

**Goals:**

- Criar uma rota de Início protegida que carregue a identidade da sessão atual.
- Centralizar a estrutura visual autenticada em componentes reutilizáveis de barra lateral e conteúdo.
- Manter o uso das rotas internas para dados de autenticação e preservar a acessibilidade na versão recolhida.

**Non-Goals:**

- Criar outros módulos, itens de menu, permissões por papel ou preferências persistentes de layout.
- Alterar o contrato da API externa, o mecanismo de cookie ou o fluxo de cadastro.

## Decisions

### Área autenticada sob a rota de Início

A primeira tela autenticada será disponibilizada em `/inicio`; o formulário de login navegará para ela somente após confirmar a sessão e carregar um perfil válido. A própria área validará a sessão antes de renderizar dados identificáveis e retornará ao login se ela não for válida.

Alternativa considerada: manter a confirmação de sucesso no formulário de login. Ela não cria uma base navegável para as próximas páginas e obriga a duplicar a estrutura autenticada mais tarde.

### Composição reutilizável do layout

O layout da área autenticada usará uma grade com um header horizontal fixo de 72 pixels ocupando toda a largura no topo. O controle de recolhimento e a marca ficarão alinhados à esquerda desse header. A barra lateral e o conteúdo rolável serão posicionados abaixo dele, em colunas separadas. A barra receberá os dados mínimos do perfil e o estado de expansão, enquanto o conteúdo de Início permanece independente para que futuras rotas reutilizem a mesma composição.

Alternativa considerada: implementar a barra diretamente na página de Início. Isso atenderia à primeira página, mas levaria à cópia de estrutura e comportamento ao adicionar novos itens.

### Estado local e acessível de recolhimento

O estado expandido ou recolhido será controlado localmente no navegador. O botão terá texto alternativo, estado acessível e foco visível; no modo recolhido, ícones e identificadores acessíveis preservam a operação sem depender do rótulo visual. A preferência não será persistida entre sessões nesta change.

Alternativa considerada: armazenar a preferência no navegador. Isso acrescenta persistência e decisões de sincronização sem uma necessidade atual de produto.

### Encerramento de sessão no header

O canto direito do header reutilizará a rota interna de logout já existente. A ação ficará indisponível enquanto a solicitação estiver em andamento e só navegará para o login quando a rota confirmar o encerramento, mantendo o cookie e a API externa fora do navegador.

Alternativa considerada: exibir a ação junto ao perfil na barra lateral. O header segue o padrão de referência de navegação e mantém a ação disponível mesmo com o menu recolhido.

### Ícones de interface

Será adotada uma biblioteca de ícones leve e compatível com React caso o projeto não possua ícones de navegação reutilizáveis. O item Início usará um ícone de casa e o controle da barra usará ícones coerentes de recolher e expandir.

Alternativa considerada: desenhar SVGs isolados no componente. Uma biblioteca mantém proporções, acessibilidade e consistência quando novos itens forem adicionados.

## Risks / Trade-offs

- [Falha ou expiração da sessão durante a carga] → Validar o perfil antes de mostrar a área autenticada, limpar a visualização e redirecionar com aviso seguro.
- [Barra recolhida pouco compreensível] → Usar nomes acessíveis, foco visível e dicas textuais para os controles e ícones.
- [Diferenças entre telas grandes e pequenas] → Garantir que a barra e o conteúdo permaneçam utilizáveis em larguras reduzidas, sem ocultar o caminho de expansão.

## Migration Plan

1. Adicionar a estrutura e a rota de Início sem alterar contratos da API.
2. Atualizar o sucesso do login para navegar para `/inicio` após validar a sessão.
3. Validar manualmente o login, a ausência de sessão e os dois estados da barra em viewport amplo e reduzido.

Rollback: remover o redirecionamento do login e a rota de Início; a autenticação existente continua usando as mesmas rotas internas e cookies.
