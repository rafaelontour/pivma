## Why

O cadastro público cria apenas a identidade do usuário e não o torna reconhecível pela interface como proponente, impedindo uma conta recém-criada de encontrar o fluxo de submissões. A API publicada não possui hoje um perfil `Proponente` nem uma permissão global específica para submeter, embora permita que qualquer sessão autenticada crie um processo e receba nele o papel local `proponent`.

## What Changes

- Tornar o cadastro público um fluxo server-side coordenado que cria a conta e atribui a ela um perfil global ativo chamado `Proponente`.
- Localizar ou provisionar idempotentemente o perfil customizado `Proponente` pela API administrativa, sem conceder permissões administrativas inexistentes ou desnecessárias para submissão.
- Usar credenciais técnicas administrativas exclusivamente por configuração server-only, sem versioná-las, enviá-las ao navegador ou reutilizar a sessão administrativa como sessão da pessoa cadastrada.
- Compensar falhas posteriores à criação da identidade para não confirmar uma conta sem o perfil necessário, e comunicar falhas por códigos estáveis e mensagens localizadas.
- Corrigir a identificação do perfil `Proponente` na navegação, sem usar o papel local de um processo como substituto do perfil global.
- Manter a criação de processos e a concessão do papel local `proponent` sob responsabilidade da API existente.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `user-registration`: o cadastro concluído passa a entregar uma conta ativa com o perfil global `Proponente`, pronta para acessar o catálogo de submissões após o login.

## Impact

- Alterações em `services/Usuario.ts`, na rota interna `POST /api/auth/register`, nos tipos de usuário/RBAC e na regra de navegação do shell autenticado.
- Novas variáveis server-only para a credencial técnica que possui `rbac.read`, `rbac.profiles.manage`, `rbac.assignments.manage` e `users.manage`; os valores fornecidos durante o desenvolvimento não serão gravados no repositório.
- Uso adicional de `GET/POST /rbac/profiles`, `POST /rbac/users/{user_id}/profiles/{profile_id}` e, somente como compensação, `DELETE /users/{user_id}`.
- O perfil criado pela API será customizado (`official: false`), pois o contrato não permite criar perfis oficiais. Ele terá `permission_codes: []`, já que a API não publica permissão global de submissão e concede o papel local `proponent` quando o processo é criado.
- Inclusão simultânea das mensagens de interface em português do Brasil e inglês, com verificação de paridade dos dicionários.
