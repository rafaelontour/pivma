## Context

A central de Configurações já resolve capacidades da sessão no cliente e lista módulos administrativos tipados. O frontend ainda não possui domínio ou integração institucional. A API atual publica catálogos paginados separados para instituições e laboratórios; cada laboratório contém uma referência à instituição e sua criação exige `institution_id`.

Os mesmos recursos oferecem `POST` para criação, `PATCH` somente para nome e `DELETE` sem remoção física para desativação. Não há operação publicada de reativação. O ambiente consultado não contém instituições, laboratórios ou afiliações, portanto a interface precisa funcionar corretamente a partir do estado totalmente vazio.

## Goals / Non-Goals

**Goals:**

- Integrar o catálogo institucional como módulo coerente da central de Configurações.
- Representar a hierarquia instituição-laboratório sem duplicar ou desnormalizar o vínculo recebido da API.
- Cobrir criação, renomeação e desativação com autorização e confirmação proporcionais ao risco.
- Tratar paginação completa e reconciliação depois de mutações.

**Non-Goals:**

- Criar afiliações entre usuários e instituições ou laboratórios.
- Criar usuários, participantes de processo ou convites.
- Reativar itens, realizar exclusão física ou inventar cascatas de desativação.
- Permitir que proponentes ou grupos gestores alterem o catálogo por seus papéis locais.

## Decisions

### 1. Um módulo único e hierárquico

O cartão **Instituições e laboratórios** abrirá `/instituicoes-laboratorios`. A página mostrará instituições como unidades principais expansíveis ou seções, com seus laboratórios agrupados abaixo. Isso deixa explícita a dependência exigida pelo backend e evita dois módulos administrativos fragmentados.

A alternativa de começar diretamente por laboratórios foi descartada porque não é possível persistir `LaboratoryCreate` sem uma instituição existente.

### 2. Snapshot completo dos dois catálogos

O serviço server-only percorrerá todas as páginas de instituições e laboratórios antes de devolver o snapshot à interface. O agrupamento usará `laboratory.institution.id`; uma falha em qualquer página impedirá que um conjunto parcial seja apresentado como completo.

Essa escolha simplifica busca local, estados vazios por instituição e reconciliação. Caso o catálogo cresça a ponto de tornar a carga completa impraticável, será necessário primeiro publicar filtros institucionais no endpoint de laboratórios.

### 3. Autorização exclusiva por permissão publicada

O cartão, a página e cada Route Handler de mutação exigirão `institutional.catalogs.manage`. O nome do perfil não será usado como autorização, embora Administrador e BraCVAM possuam hoje essa permissão. Isso preserva o comportamento se as permissões dos perfis mudarem.

Leitura e escrita usarão a mesma permissão nesta entrega para não expor um módulo de gestão incompleto a sessões somente de leitura.

### 4. Rotas internas espelham recursos, não a origem externa

Um serviço institucional server-only encapsulará listagem, criação, renomeação e desativação. Route Handlers internos serão organizados por instituições e laboratórios, validarão UUIDs e nomes e propagarão apenas códigos seguros. `Origin`, cookie e URL externa permanecerão no servidor.

Os contratos de domínio e de interface ficarão em `types/Institucional.ts`; nenhum componente ou rota declarará tipos locais.

### 5. Mutações com confirmação e reconciliação

Criação e renomeação usarão diálogos acessíveis com entrada preservada em falhas. Desativação terá um diálogo específico que identifica o alvo e alerta sobre indisponibilidade futura. Após sucesso, a interface recarregará o snapshot completo em vez de simular cascatas ou remover dependências por conta própria.

Não haverá botão Reativar porque o OpenAPI não publica essa operação. `DELETE` será apresentado como Desativar, nunca como exclusão física.

### 6. Internacionalização integral

O novo módulo, a nova capacidade de Configurações e todas as mensagens serão adicionados simultaneamente a `pt-BR.json` e `en.json`. Nomes institucionais são conteúdo cadastrado e permanecerão exatamente como retornados pela API; somente datas e rótulos de estado respeitarão o locale.

## Risks / Trade-offs

- **[Desativação de instituição com dependências tem semântica externa não detalhada]** → não executar cascata no cliente; confirmar a intenção, enviar apenas a operação solicitada e apresentar a rejeição segura da API.
- **[Itens desativados podem deixar de aparecer nas listagens]** → após mutação, considerar a resposta e o snapshot autoritativos; não oferecer histórico ou reativação sem contrato publicado.
- **[Catálogo completo pode crescer]** → usar páginas de até 100 itens e interromper em falha; registrar como evolução futura a filtragem server-side por instituição.
- **[Criação ou renomeação concorrente]** → bloquear a operação local em voo, tratar conflitos e reconciliar o catálogo antes de nova tentativa.

## Migration Plan

1. Publicar tipos, serviço e rotas internas protegidas.
2. Publicar a página sem dados pré-carregados e validar o estado vazio real.
3. Adicionar o cartão à central de Configurações somente para `institutional.catalogs.manage`.
4. Criar uma instituição e um laboratório temporários durante a validação integrada e desativá-los ao final se não forem dados oficiais.
5. Em rollback, remover página e entrada de Configurações; os registros persistidos permanecem na API e não exigem migração.
