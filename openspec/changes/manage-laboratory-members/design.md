## Context

O catálogo institucional é a tela que organiza instituições e laboratórios. A API permite criar afiliações em `/institutional/users/{user_id}/affiliations`, mas não expõe uma listagem por laboratório. BraCVAM e Administrador de demonstração possuem `institutional.affiliations.manage`, `users.read` e `institutional.read`; Proponente não possui essas permissões.

O corpo de criação exige `institution_id` e `laboratory_id`. A tela buscará contas ativas pelo diretório existente, que já suporta busca, e enviará a conta escolhida ao servidor. O servidor consultará o catálogo, derivará a instituição e validará o estado ativo antes de criar o vínculo.

## Goals / Non-Goals

**Goals:**

- Adicionar uma conta existente a um laboratório pela ação mostrada junto ao laboratório na página do catálogo.
- Permitir escolher somente contas ativas e laboratórios cuja instituição também esteja ativa.
- Repetir autorização e validação no servidor e manter a operação separada de perfis e designações de processo.

**Non-Goals:**

- Consultar ou exibir a lista de membros de cada laboratório, pois a API não oferece consulta inversa.
- Desativar vínculos, criar contas, perfis, convites ou participantes de processos.
- Percorrer todas as contas ou fazer chamadas N+1.

## Decisions

### 1. Ação junto a cada laboratório ativo

A linha do laboratório exibe “Adicionar pessoa” somente para sessões autorizadas e quando o laboratório e sua instituição estão ativos. Como o filtro `search` publicado pela API consulta somente nome de usuário e e-mail, a rota interna pagina as contas ativas e filtra exclusivamente `full_name`, ignorando caixa e acentuação. O diálogo permite selecionar um resultado e confirma a inclusão.

O diálogo usa uma largura maior e organiza cabeçalho contextual, busca nominal, estados da consulta, cartões de resultado e ações em regiões visualmente distintas. A seleção é indicada por cor, borda e ícone, sem depender apenas do controle de rádio.

### 2. API externa acessada somente pelo servidor

O navegador usa as rotas internas existentes para consultar o catálogo e buscar contas, e envia a mutação para `/api/institucional/laboratorios/{laboratoryId}/membros`. O Route Handler exige `institutional.affiliations.manage`, `users.read` e `institutional.read`, valida UUIDs, conta ativa, laboratório e instituição. O serviço server-only cria a afiliação na API externa.

### 3. O laboratório selecionado determina a instituição

O navegador envia o `user_id`; o `laboratory_id` vem da rota. O servidor deriva `institution_id` do laboratório encontrado no catálogo para impedir combinações inconsistentes. A API externa responde conflitos para vínculos duplicados, que serão apresentados como mensagem localizada.

### 4. Não mostrar membros sem endpoint reverso

A tela oferece a operação de inclusão por laboratório, mas não inventa uma lista de membros consultando afiliações de todas as contas. O feedback de sucesso confirma a pessoa e o laboratório vinculados.

## Risks / Trade-offs

- **Conta ou laboratório muda de estado após a busca** → validar novamente conta, laboratório e instituição no servidor imediatamente antes da criação.
- **Vínculo já existe** → preservar o conflito `409` da API e apresentar mensagem localizada.
- **Permissões mudam entre abertura e envio** → verificar todas as permissões no Route Handler da mutação.

## Migration Plan

1. Adicionar a rota interna por laboratório e reutilizar o serviço de criação existente.
2. Incluir a busca de contas ativas e o diálogo na linha de cada laboratório.
3. Verificar as traduções, permissões e compilação da aplicação.
4. Em rollback, remover a ação, o diálogo e a rota; afiliações já persistidas permanecem auditáveis no backend.
