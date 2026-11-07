## Context

A API publica catálogo paginado, detalhe, criação, atualização, remoção, colunas e exportação CSV/XLSX. O frontend já possui uma central de Configurações e padrões de editores administrativos, mas ainda não conhece esse domínio.

## Goals / Non-Goals

**Goals:**

- Reusar os padrões de autorização, reconciliação e acessibilidade dos módulos administrativos.
- Manter template e colunas como um snapshot coerente.
- Entregar downloads sem expor a API externa.

**Non-Goals:**

- Oferecer PDF sem contrato correspondente.
- Criar planilhas preenchidas com dados experimentais.
- Associar templates a processos se a operação externa não estiver publicada.

## Decisions

### 1. Módulo dentro de Configurações

O catálogo terá rota própria e cartão condicionado à capacidade efetiva da sessão. O nome do perfil não substituirá permissão publicada.

### 2. Editor mestre-detalhe

A lista seleciona um template e o painel de detalhe edita seus metadados e colunas. Uma falha em qualquer parte do snapshot impede apresentar dados parciais como completos.

### 3. Ordem persistida pela API

O cliente enviará somente as operações publicadas para colunas e sempre relerá a ordem. Drag and drop não será necessário; controles acessíveis de posição atendem teclado e telas estreitas.

### 4. Downloads binários via Route Handler

CSV e XLSX serão transmitidos preservando cabeçalhos seguros. O servidor validará UUID e formato antes de chamar a origem externa.

### 5. Erros e concorrência

Códigos do backend serão preservados. Em conflitos, o editor recarregará o snapshot e manterá a entrada local para decisão da pessoa.

## Risks / Trade-offs

- [Permissão específica não está declarada no OpenAPI] → confirmar a capacidade com sessões reais antes de publicar o cartão.
- [Remoção pode ser rejeitada por uso] → manter o template visível e explicar a dependência com o código externo.
- [Colunas concorrentes podem mudar de ordem] → reconciliar depois de cada mutação.

## Migration Plan

1. Criar integração de leitura e downloads.
2. Adicionar o cartão de Configurações somente após validar autorização.
3. Habilitar metadados e depois colunas.
4. Em rollback, ocultar o módulo sem alterar templates persistidos.
