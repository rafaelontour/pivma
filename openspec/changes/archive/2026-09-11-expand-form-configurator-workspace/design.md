## Context

O componente `FormTemplateManager` em `app/(paginas)/formularios/form-template-manager.tsx` implementa a tela de configuração de formulários. O layout atual é dividido em duas colunas fixas (`lg:grid-cols-[20rem_minmax(0,1fr)]`), onde o catálogo lateral de 320px consome espaço horizontal mesmo enquanto a pessoa está editando seções e campos complexos.

Além disso, elementos textuais no frontend ainda utilizam o termo técnico "template", quando a linguagem de negócio da plataforma e das pessoas usuárias deve se referir a "Formulários", "Formulários de processo" ou "Modelos de processo".

## Goals / Non-Goals

**Goals:**
- Separar o fluxo de `/formularios` em dois modos visuais mutuamente exclusivos:
  1. **Modo Listagem (Visão Inicial)**: Grade/lista ampla de todos os formulários disponíveis, sem editor lateral vazio, exibindo resumo e botão direto para configurar.
  2. **Modo Workspace (Edição em Tela Cheia)**: Ao selecionar um formulário, a tela exibe exclusivamente o editor em largura total (100%), ocultando o catálogo lateral para maximizar a área útil de trabalho.
- Adicionar cabeçalho de navegação contextual no editor com botão acessível "Voltar para a lista de formulários".
- Alertar sobre descarte de alterações caso a pessoa tente voltar com modificações não salvas.
- Ajustar o container em `AuthenticatedShell` para conferir largura expandida (`max-w-[100rem]` ou `max-w-none`) na página de formulários.
- Eliminar integralmente o termo "template" da interface visível do usuário no frontend.

**Non-Goals:**
- Não criar novas sub-rotas no Next.js (manter a alternância fluida via estado no componente).
- Não alterar contratos de API nem endpoints `/api/forms/*`.
- Não modificar as regras de validação ou estrutura de seções e campos dinâmicos já implementadas.

## Decisions

### Decisão 1: Alternância de visão por estado (`closed` vs. ativo)

- **Escolha**: Usar o próprio ciclo do estado `editor` (`editor.kind === "closed"` para visão de listagem; `editor.kind !== "closed"` para visão de edição em largura total).
- **Alternativa considerada**: Criar rotas separadas `/formularios/[processKey]/[formKey]`.
- **Justificativa**: A alternância por estado evita carregamentos redundantes do catálogo em memória, mantém transição instantânea e permite verificação imediata de alterações não salvas antes do retorno à lista.

### Decisão 2: Grade de formulários com cartões enriquecidos

- **Escolha**: Na visualização de listagem, renderizar uma grade responsiva (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) com cartões que exibem:
  - Nome do formulário e código do processo associado
  - Quantidade de campos cadastrados
  - Selo de status
  - Botão proeminente "Configurar formulário"
- **Justificativa**: Substitui a lista comprimida de 320px por uma visão executiva clara e ergonômica.

### Decisão 3: Barra superior de navegação no editor

- **Escolha**: Inserir no topo do editor um header de navegação contendo:
  - Botão acessível "Voltar para a lista de formulários"
  - Identificação clara do formulário ativo e processo
  - Botão de salvamento persistente
- **Justificativa**: Deixa evidente em qual formulário a pessoa está trabalhando e como retornar à visão geral.

### Decisão 4: Substituição sistemática da terminologia

- **Escolha**: Substituir todas as strings voltadas para o usuário:
  - "Catálogo de templates" → "Formulários dos processos"
  - "Selecione um template" → "Selecione um formulário"
  - "Template atualizado" → "Formulário atualizado"
  - "Erro no template" → "Erro no formulário"

## Risks / Trade-offs

- **[Risco]** Usuário clicar em "Voltar para a lista de formulários" e perder edições não salvas.
  - **Mitigação**: Adicionar verificação de alterações pendentes; se houver edições em andamento, solicitar confirmação com diálogo acessível antes de restaurar a listagem.
- **[Risco]** Quebra visual em telas ultrawide.
  - **Mitigação**: Utilizar `max-w-[100rem]` no container do shell para manter legibilidade sem esticar excessivamente em monitores ultra-largos.
