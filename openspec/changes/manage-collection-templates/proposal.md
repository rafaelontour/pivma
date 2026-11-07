## Why

A API publica templates estruturados de coleta, colunas configuráveis e exportação em CSV/XLSX, mas não há interface para mantê-los ou consultá-los. A equipe precisa preparar os modelos usados pelos laboratórios antes da execução experimental.

## What Changes

- Criar um módulo autenticado para listar, criar, editar e desativar ou remover templates conforme as operações publicadas pela API.
- Gerenciar nome, descrição, quantidade mínima de experimentos e réplicas.
- Permitir cadastrar, ordenar, editar e remover colunas com seus tipos e restrições.
- Disponibilizar download do arquivo-modelo nos formatos CSV e XLSX suportados pelo backend.
- Integrar o módulo à central de Configurações e respeitar as permissões efetivas da sessão.

## Capabilities

### New Capabilities

- `collection-template-management`: administração de templates e colunas de coleta, com exportação dos arquivos-modelo.

### Modified Capabilities

Nenhuma.

## Impact

- Novos tipos, serviços server-only, Route Handlers e página administrativa de templates de coleta.
- Integração com `/collection-templates*` e downloads binários internos.
- Ampliação da central de Configurações e dos dicionários `pt-BR` e `en`.
- Nenhum suporte a PDF será simulado enquanto o backend publicar apenas CSV e XLSX.
