## Why

A tela de configuração de formulários (`/formularios`) opera atualmente com layout dividido em duas colunas, no qual a barra lateral de catálogo ocupa permanentemente 20rem (320px). Esse espaço fixo comprime o editor e prejudica a visualização de seções, reordenação de campos e configuração de regras dinâmicas e critérios de IA. Além disso, a interface ainda exibe referências ao termo técnico "template", que deve ser evitado na experiência do usuário em favor de termos de domínio como "Formulários de processo" e "Modelos de processo".

Ajustar o módulo para exibir primeiro uma listagem ampla dos formulários disponíveis e, após a seleção, transicionar para um workspace dedicado em largura total (tela cheia) garante a ergonomia necessária para gerenciar formulários complexos.

## What Changes

- **Transição de visão (Listagem vs. Edição)**:
  - Ao entrar em `/formularios`, a tela apresenta a listagem completa dos formulários de processos disponíveis em formato de grade/cards com metadados claros (título, processo vinculado, quantidade de campos e estado).
  - Ao clicar em um formulário, a visualização alterna para o workspace de edição ocupando 100% da largura útil da tela, removendo a barra lateral do catálogo.
- **Navegação de retorno no editor**:
  - O cabeçalho do editor passa a exibir um botão/link proeminente e acessível ("← Voltar para a lista de formulários") que restaura a visão de listagem.
- **Remoção do termo "template" no frontend**:
  - Eliminar todas as ocorrências textuais de "template" e "templates" visíveis ao usuário na interface de formulários, substituindo-as por "Formulário", "Formulários de processo" ou "Modelo de processo".
- **Otimização de largura no shell autenticado**:
  - Ajustar a área de conteúdo do `AuthenticatedShell` para que a rota de formulários (`activePage === "forms"`) utilize largura expandida (`max-w-[100rem]` ou `max-w-none`), proporcionando máximo aproveitamento de tela.

## Capabilities

### New Capabilities

- `form-template-management`: Gestão e configuração dos formulários vinculados aos processos da plataforma, com visão inicial de catálogo em grade e editor dedicado em tela cheia com navegação de retorno.

### Modified Capabilities

*(Nenhuma capacidade existente tem seus requisitos alterados. A mudança refina a experiência e a ergonomia de configuração).*

## Impact

- Alteração em `app/(paginas)/formularios/form-template-manager.tsx` para alternância de modos (`list` e `editor`), remoção do layout de duas colunas divididas e substituição de termos técnicos por termos de domínio.
- Atualização em `types/Formulario.ts` para formalizar estados de visualização e propriedades de navegação do configurador.
- Ajuste pontual em `app/_components/authenticated-shell.tsx` para permitir largura estendida na página de formulários.
- Nenhuma alteração em rotas de backend ou contratos de API `/api/forms/*`.
