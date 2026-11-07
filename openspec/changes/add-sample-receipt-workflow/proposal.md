## Why

Após a distribuição, os laboratórios precisam conferir frascos cegos, registrar recebimento, anexar evidências e tratar não conformidades. A API oferece essas operações, mas o frontend não possui um fluxo operacional para executá-las.

## What Changes

- Criar um workspace de recebimento contextualizado pelo processo e laboratório da sessão.
- Permitir verificar um código antes da confirmação e registrar o recebimento de cada frasco.
- Listar frascos e seus estados sem revelar dados protegidos do cegamento.
- Permitir anexar e consultar fotos de recebimento pelos Route Handlers internos.
- Listar não conformidades e permitir à pessoa autorizada registrar a decisão publicada pela API.

## Capabilities

### New Capabilities

- `sample-receipt`: conferência, recebimento, evidências e tratamento de não conformidades de amostras por laboratório.

### Modified Capabilities

Nenhuma.

## Impact

- Novos tipos, serviços, Route Handlers e página em `/processos/[processId]/recebimento-amostras`.
- Integração com `/processes/{id}/sample-receipt*` e transferências multipart protegidas.
- Autorização por escopo de processo e laboratório, com preservação do cegamento.
- Novas mensagens e nomes acessíveis em ambos os idiomas.
