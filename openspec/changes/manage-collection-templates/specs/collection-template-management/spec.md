## Purpose

Administrar modelos estruturados de coleta de dados e suas colunas, permitindo gerar arquivos compatíveis com os formatos efetivamente publicados pela API.

## ADDED Requirements

### Requirement: Catálogo paginado de templates
O sistema SHALL listar templates de coleta com nome, descrição, situação, mínimos de experimentos e réplicas, além de estados de carregamento, vazio, erro e nova tentativa.

#### Scenario: Catálogo disponível
- **WHEN** a API retorna templates acessíveis à sessão
- **THEN** o sistema apresenta cada template com suas ações autorizadas

### Requirement: Criação e edição do template
O sistema SHALL permitir criar e editar templates validando nome, descrição e valores mínimos conforme o contrato. Entradas inválidas MUST impedir o envio.

#### Scenario: Template válido
- **WHEN** uma pessoa autorizada confirma dados válidos
- **THEN** o template é persistido e o catálogo é reconciliado

### Requirement: Gestão ordenada de colunas
O sistema SHALL permitir listar, criar, editar, ordenar e remover colunas conforme os tipos e restrições publicados pela API. Chaves técnicas MUST permanecer estáveis após criação quando o contrato não permitir alteração.

#### Scenario: Reordenação de coluna
- **WHEN** a API aceita uma nova ordem
- **THEN** o sistema recarrega as colunas e apresenta a ordem autoritativa

#### Scenario: Coluna inválida
- **WHEN** nome, chave, tipo ou restrição não satisfazem o contrato
- **THEN** a confirmação permanece desabilitada e nenhuma mutação é enviada

### Requirement: Exclusão ou desativação confirmada
O sistema SHALL apresentar somente a operação de ciclo de vida realmente publicada para templates e colunas e MUST exigir confirmação antes de uma ação destrutiva.

#### Scenario: Dependência impede remoção
- **WHEN** a API recusa a operação porque o template está em uso
- **THEN** o item permanece no catálogo e o código do backend é apresentado

### Requirement: Exportação nos formatos publicados
O sistema SHALL permitir baixar o arquivo-modelo em CSV e XLSX e MUST NOT anunciar PDF enquanto esse formato não estiver publicado no contrato.

#### Scenario: Exportação XLSX
- **WHEN** uma pessoa solicita o formato XLSX de um template autorizado
- **THEN** o navegador baixa o arquivo por uma rota interna com nome e tipo adequados

### Requirement: Autorização e localização
O sistema MUST repetir a autorização no servidor para consultas e mutações. Todo conteúdo controlado SHALL existir em `pt-BR` e `en`, enquanto nomes configurados por pessoas MUST permanecer inalterados.

#### Scenario: Acesso sem permissão
- **WHEN** uma sessão sem capacidade administrativa acessa diretamente a rota
- **THEN** o sistema recusa a operação sem expor o catálogo protegido
