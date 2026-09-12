## Why

Os formulários dinâmicos apresentam hoje todas as seções em uma única área rolável, o que dificulta o preenchimento de templates extensos e não deixa claro o progresso. A navegação por abas permitirá que o proponente preencha uma seção por vez e corrija problemas antes de avançar.

## What Changes

- Agrupar os campos pela seção informada no template e apresentar uma aba ordenada para cada seção ao abrir ou retomar um formulário.
- Exibir somente a seção ativa, preservando os valores digitados ao navegar entre as abas.
- Manter a barra de abas visível no topo da área do formulário durante a rolagem vertical.
- Oferecer `Avançar` na primeira seção, `Voltar` e `Avançar` nas seções intermediárias, e `Voltar` e `Enviar para análise` na última seção; controles inexistentes não serão renderizados.
- Manter `Salvar rascunho` como uma ação independente da navegação entre seções.
- Aplicar provisoriamente uma validação manual simples a todos os campos: obrigatoriedade e verificações básicas já suportadas de tipo, intervalo, comprimento, opções e arquivo.
- Impedir o avanço quando a seção atual estiver inválida e, no envio, validar todas as seções e abrir a primeira que possuir erro.
- Permitir voltar sem exigir que a seção atual esteja válida e associar mensagens de erro aos respectivos campos.
- Padronizar em 90% da viewport a largura dos modais de formulário usados em Nova submissão, Submissões e Rascunhos.
- Permitir abrir, pela aba Submissões, o formulário já enviado no mesmo modal em modo somente leitura.
- Preparar a organização da validação por seção para uma futura substituição por schemas Zod, sem adicionar Zod nesta change.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `dynamic-process-forms`: o formulário dinâmico passa a ser preenchido por seções em abas, com navegação progressiva, preservação dos dados e validação simples por seção antes do avanço ou envio.

## Impact

- Interface de submissões: estado da aba ativa, agrupamento dos campos, controles de navegação e modal amplo compartilhado entre criação, retomada e consulta.
- Validação: adaptação do validador manual existente para retornar erros por campo e por seção.
- Tipos de interface em `types/`: propriedades de navegação, agrupamento e erros do formulário dinâmico.
- Acessibilidade: semântica de abas, foco, seleção e associação entre aba e painel.
- APIs e backend: nenhuma alteração obrigatória; a divisão continua usando `section`, `order_index` e as regras já retornadas pelo formulário.
- Dependências: Zod permanece fora do escopo desta change e será tratado posteriormente.
