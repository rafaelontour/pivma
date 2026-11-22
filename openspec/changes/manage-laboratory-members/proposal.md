## Why

O BraCVAM precisa manter as pessoas vinculadas aos laboratórios a partir do catálogo institucional, onde esse vínculo faz sentido operacionalmente.

## What Changes

- Adicionar, na linha de cada laboratório ativo, uma ação para buscar exclusivamente pelo nome completo e vincular uma conta ativa existente.
- Derivar no servidor a instituição do laboratório e validar que ambos continuam ativos antes da criação.
- Usar a operação de criação de afiliação da API por usuário, sem varrer o diretório nem consultar membros por laboratório.
- Manter autorização, auditoria e mensagens em português e inglês.
- Tratar afiliação institucional separadamente de perfis globais e participação em processos.

## Capabilities

### New Capabilities

- `laboratory-membership-management`: inclusão autorizada de contas existentes em laboratórios ativos.

### Modified Capabilities

Nenhuma.

## Impact

- A página autenticada de instituições e laboratórios ganha busca de contas ativas e ação de inclusão por laboratório.
- Tipos, serviços server-only e Route Handler interno encapsulam a criação publicada pela API.
- A API não oferece listagem inversa por laboratório; a tela não tentará exibir uma lista de membros até existir esse contrato.
- Novas mensagens serão mantidas simultaneamente em `pt-BR` e `en`.
