## Why

Uma conta recém-cadastrada entra no pi*VMA vendo apenas Início porque a navegação condiciona Submissões a um perfil global inexistente ou a um papel local que só surge depois da criação do primeiro processo. O contrato publicado, porém, permite que qualquer sessão autenticada liste templates e crie esse processo inicial, que então concede ao criador o papel local `proponent`.

## What Changes

- Exibir o item Submissões para toda pessoa com sessão autenticada válida, inclusive contas recém-cadastradas sem perfis ou escopos locais.
- Permitir que essa pessoa abra `/submissoes`, consulte templates e crie seu primeiro processo usando as rotas internas já existentes.
- Manter o papel local `proponent` como autorização para consultar, editar, enviar e acompanhar apenas os processos pertencentes à pessoa.
- Normalizar na listagem de rascunhos o objeto `template` publicado pela API para o formato interno já usado na criação, evitando que uma resposta externa válida seja convertida em `502`.
- Não criar perfil customizado, não atribuir permissões administrativas e não usar credenciais técnicas no cadastro.
- Manter negações da API como autoridade final caso o backend futuramente restrinja a criação de processos.
- Substituir conceitualmente a change não implementada `assign-proponent-profile-on-registration`, cuja solução baseada em perfil vazio não representa autorização efetiva na API.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `authenticated-navigation`: toda sessão autenticada passa a receber o item Submissões, pois esse é o requisito real para iniciar um processo no contrato atual.
- `dynamic-process-forms`: a retomada de rascunhos passa a aceitar o formato aninhado atual de template devolvido por `GET /processes`.

## Impact

- Alterações no cálculo de visibilidade da navegação, nas tipagens compartilhadas correspondentes e na normalização da listagem em `services/Submissao.ts`.
- Nenhuma alteração em cadastro, perfis RBAC, permissões globais, credenciais administrativas, serviços externos ou payloads de submissão.
- Verificação das mensagens e nomes acessíveis existentes em `pt-BR` e `en`, sem necessidade prevista de novo texto de interface.
- Validação integrada com conta autenticada sem perfis e sem escopos, seguida da criação do primeiro processo e confirmação do papel local `proponent`.
