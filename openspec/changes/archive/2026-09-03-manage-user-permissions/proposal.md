## Why

Administradores precisam administrar cargos e permissões diretamente na listagem de usuários, sem depender de intervenções externas ou expor a API do pi*VMA ao navegador.

## What Changes

- Adiciona gestão de perfis de acesso por usuário, incluindo concessão e remoção de cargos.
- Exibe os cargos atribuídos na listagem usando a descrição dos perfis.
- Permite a administradores editar os `permission_codes` de um perfil a partir da gestão do usuário, com aviso de que a alteração afeta todas as pessoas vinculadas ao perfil.
- Adiciona rotas internas e serviços para consultar códigos de permissão, atualizar perfis e revogar atribuições.
- Encaminha a origem exigida pela API externa em operações administrativas de alteração.

## Capabilities

### New Capabilities

- `user-access-management`: Administração de cargos, perfis e códigos de permissão de usuários autenticados.

### Modified Capabilities

- `authenticated-navigation`: A área de usuários passa a apresentar cargos e ações administrativas de acesso.

## Impact

- Afeta a página `/usuarios`, as rotas internas de RBAC e usuários e os serviços de perfil.
- Usa os endpoints externos de RBAC para listar permissões, conceder e revogar perfis e atualizar `permission_codes`.
- Não adiciona dependências.
