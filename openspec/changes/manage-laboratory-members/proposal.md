## Why

O catálogo institucional permite cadastrar instituições e laboratórios, mas ainda não oferece uma forma de vincular usuários existentes a esses laboratórios. Sem essa gestão, o sistema conhece o laboratório, porém não consegue identificar administrativamente quais pessoas fazem parte dele antes dos fluxos de processo.

## What Changes

- Adicionar a ação **Gerenciar membros** aos laboratórios do catálogo institucional.
- Permitir que sessões com `institutional.affiliations.manage`, atualmente Administrador e BraCVAM, consultem as afiliações de um usuário e criem ou desativem seu vínculo com um laboratório.
- Exigir que a conta do usuário, a instituição e o laboratório já existam e estejam ativos antes da criação do vínculo.
- Usar o diretório de usuários existente para localizar a pessoa, sem criar contas implicitamente e sem aceitar somente texto livre como identidade.
- Impedir confirmação enquanto usuário ou laboratório estiver ausente, inválido ou inativo e tratar duplicidade e concorrência com reconsulta autoritativa.
- Apresentar a remoção como desativação de vínculo, preservando a trilha auditável do backend e sem oferecer exclusão física ou reativação inexistente.
- Manter afiliações institucionais separadas das designações de participantes em processos; tornar-se membro de um laboratório não concede automaticamente papel em um processo.
- Criar simultaneamente textos, validações, estados, erros seguros e nomes acessíveis em português do Brasil e inglês.

## Capabilities

### New Capabilities

- `laboratory-membership-management`: consulta e gestão autorizada das afiliações entre usuários existentes e laboratórios ativos, incluindo criação, prevenção de duplicidade e desativação auditável.

### Modified Capabilities

Nenhuma capability consolidada é modificada. A interface dependerá da conclusão da change aberta `add-institutional-catalog-settings` para integrar a ação aos laboratórios.

## Impact

- Extensão da página autenticada `/instituicoes-laboratorios` com ações e diálogos de membros.
- Novos contratos em `types/`, serviços server-only e Route Handlers internos para os endpoints de afiliação institucional.
- Dependência de uma consulta externa paginada por laboratório, ainda ausente no OpenAPI atual, para listar membros sem consultar individualmente as afiliações de todos os usuários.
- Reuso protegido do diretório de usuários e dos catálogos ativos de instituições e laboratórios.
- Uso de `institutional.affiliations.manage` para mutações e das permissões de leitura necessárias para consultar usuários e afiliações.
- Alterações simultâneas nos dicionários `pt-BR` e `en`, sem nova dependência de frontend.
- Nenhuma criação de usuário, perfil, convite ou participante de processo.
