## Context

Veja [proposal.md](./proposal.md) para a motivação e os fluxos funcionais. O frontend já possui autenticação por Route Handlers internos, shell autenticado, gestão básica de usuários, um Kanban somente leitura e formulário dinâmico para o proponente. Há duas mudanças OpenSpec anteriores que tocam submissões e Kanban e ainda não foram consolidadas nas specs principais.

Os HTML em `pivma-back/develop/demos` demonstram o comportamento esperado, mas também contêm decisões exclusivas de protótipo: URL externa no navegador, credenciais rápidas, utilitários de inspeção, `alert`/`prompt`/`confirm`, construção de HTML por strings e lógica duplicada. A API implantada em `https://api.pivma.acerola.dev.br` já publica os contratos usados por esses fluxos: o OpenAPI consultado possui 56 caminhos e 106 schemas, incluindo avaliações configuráveis, associações, pré-avaliação, revisão direta, triagem e observabilidade. O endpoint legado de avaliação imediata foi removido. A única operação demonstrada anteriormente pelo frontend atual que continua sem contrato é a exclusão de processo.

A implementação está condicionada às regras do projeto: Next.js App Router na versão instalada, serviços externos server-only com Axios e Radash, autenticação somente sob `/api/auth/*`, tipos compartilhados exclusivamente em `types/`, rotas de páginas em `app/(paginas)/` e ausência de novas dependências sem necessidade.

## Goals / Non-Goals

**Goals:**

- Incorporar o fluxo demonstrado como módulos nativos do produto, usando o shell, a sessão, os componentes acessíveis e o padrão de erros já existentes.
- Manter uma fronteira estável entre a interface e o contrato publicado, permitindo evolução posterior sem acoplar componentes aos payloads externos.
- Garantir paridade rastreável entre cada ação funcional dos seis módulos de demonstração e uma experiência equivalente no produto Next.js.
- Preservar rastreabilidade: versões publicadas de avaliações, execuções de IA, feedback humano, decisões e transições nunca serão sobrescritos no cliente.
- Dividir a entrega em fatias verificáveis, sem bloquear as funções já atendidas pela API atual.

**Non-Goals:**

- Copiar o código, o visual isolado ou as ferramentas de depuração dos demos.
- Reimplementar no frontend regras de negócio, transições, autorização ou inferência que pertencem ao backend.
- Criar mocks que pareçam persistência real, chamar o endpoint legado para imitar pré-avaliação ou adicionar exclusão de rascunho sem contrato.
- Tornar o Kanban editável por arrastar cartões ou cobrir fases posteriores a `PLANNING` nesta mudança.
- Definir contratos novos do backend; a implementação consumirá os contratos publicados e registrará incompatibilidades encontradas.

## Decisions

### 1. O protótipo define a jornada; o OpenAPI publicado define o contrato

Os módulos reproduzirão todas as etapas observáveis dos demos, mas toda requisição e todo tipo serão derivados do OpenAPI atualizado e validados contra respostas reais. Uma matriz de paridade relacionará página, ação, endpoint publicado, perfil envolvido, destino no Next.js e cenário de verificação. Não haverá download do OpenAPI em tempo de execução.

Route Handlers preservarão o significado dos status externos e devolverão erros de aplicação seguros e consistentes. `404` continuará significando recurso inexistente, `403` falta de autorização, `409` conflito de estado e falhas transitórias não serão convertidas em sucesso. Não haverá tratamento especial de endpoint futuro para os contratos que já estão publicados.

Alternativa considerada: portar os `fetch` dos demos e corrigi-los quando a API mudar. Foi rejeitada porque exporia origem e credenciais, duplicaria tratamento de sessão e acoplaria componentes aos formatos transitórios.

### 2. Integração em três camadas e tipos por domínio

Cada domínio terá:

1. tipos externos e de apresentação em `types/` (`Formulario`, `AvaliacaoIa`, `PreAvaliacao`, `Triagem`, `Observabilidade` e ampliações de `Usuario`/`Processo`);
2. serviço server-only em `services/`, responsável pelo Axios, parâmetros, cabeçalhos de origem, tradução mínima do contrato e erros externos;
3. Route Handlers em `app/api/`, responsáveis pela sessão, autorização de borda, validação da entrada, status HTTP e resposta segura ao navegador.

Componentes consumirão apenas as rotas internas. Transformações reutilizáveis e guardas ficarão em módulos do domínio, com Radash onde ela reduzir código sem ocultar regras. Nenhum componente, rota ou serviço declarará `type` ou `interface` localmente.

Alternativa considerada: um único cliente genérico e tipos inferidos dentro das telas. Foi rejeitada porque ampliaria o impacto de mudanças do backend e violaria a organização de tipos do projeto.

### 3. Módulos e rotas seguem responsabilidades da jornada

Serão usados destinos autenticados separados:

- `/formularios` para catálogo e editor de formulários;
- `/avaliacoes-ia` para biblioteca, configuração, teste, publicação e associações;
- `/submissoes` para proponente, incluindo identificação, rascunho, pré-avaliação e correção;
- `/triagem` para a fila e a análise humana;
- `/processos` para o quadro administrativo somente leitura;
- `/observabilidade/ia` e `/observabilidade/operacional` para administração.

O catálogo e popup atuais de submissão serão decompostos em componentes por etapa e em controladores/hooks pequenos. A definição de campo continuará dinâmica; o editor administrativo e o formulário do proponente compartilharão renderizadores e funções de validação quando as regras forem idênticas, mas não compartilharão estado de mutação.

Alternativa considerada: reunir configuração, submissão e triagem numa única página semelhante aos demos. Foi rejeitada por misturar atores, permissões, estados e ciclos de carregamento distintos.

### 4. Autorização parte da sessão normalizada e é confirmada no backend

`/api/auth/me` continuará sendo a fonte do cliente e passará a normalizar nome completo, permissões efetivas e perfis presentes em `access.profiles`. A UI usa essas capacidades somente para navegação e apresentação; cada Route Handler e o backend continuam recusando acesso indevido.

- `triage.review` autoriza Triagem e, provisoriamente, o Kanban BraCVAM.
- `ai_evaluations.read` autoriza leitura da biblioteca.
- `ai_evaluations.manage` autoriza mutações, teste, publicação e associações.
- o perfil global oficial `Proponente` apresenta Submissões; para compatibilidade com contas que a API ainda devolve sem qualquer perfil ou permissão global, o papel local `proponent` também apresenta o destino somente nessa ausência total de identidade global. Em sessões com outro perfil ou permissão, o papel local continua apenas limitando os processos pertencentes à pessoa e não decide a navegação.
- observabilidade depende do indicador administrativo/permissão devolvido pelo contrato de logs.
- o editor de formulários usa a capacidade administrativa publicada para templates/formulários; ela não será inventada no cliente.

Alternativa considerada: copiar dos demos a verificação de `profiles` no topo de `/auth/me`. Foi rejeitada porque o contrato atual aninha perfis sob `access`, e porque nome de perfil isolado não substitui autorização das rotas.

### 5. Criação e acompanhamento da submissão seguem a máquina de estados do servidor

A seleção de template abre uma etapa de título e só então cria o processo em `SUBMISSION`. O frontend não gera mais `<template_key>-001`. Salvar rascunho permanece explícito. Ao concluir o formulário, a tela reconsulta processo e pré-avaliação em vez de deduzir a transição pela resposta do `POST`:

```text
SUBMISSION -> AI_PRE_EVALUATION -> TRIAGE -> PLANNING
                    |                |          
                    v                +-> CLOSED
                SUBMISSION <---------+
                    |
                    +-- revisão humana direta --> TRIAGE
```

O acompanhamento por polling terá uma única requisição em voo, intervalo centralizado, pausa pela Page Visibility API, cancelamento ao desmontar e atualização manual. Um resultado negativo ou falho reabre o processo somente quando o backend o devolver a `SUBMISSION`; o cliente exibe a evidência e permite correção ou revisão direta conforme elegibilidade. Cada reenvio preserva as execuções anteriores no histórico.

Alternativa considerada: atualizar o estado otimisticamente após submissão ou revisão direta. Foi rejeitada porque filas assíncronas e validações concorrentes tornam essa representação enganosa.

### 6. Configuração de IA usa rascunho, teste e publicação imutável

A biblioteca separa a identidade da avaliação de suas versões. Nome e objetivo são informados na criação; como o contrato publicado não oferece PATCH/PUT para a definição, o nome permanece somente para leitura depois que a identidade é criada. Objetivo e critérios são editados pelos endpoints da versão em rascunho; sugestões do backend entram como conteúdo revisável. Testes usam somente conteúdo fornecido para teste e não tocam processos. Publicar exige confirmação e torna a versão somente leitura; uma alteração posterior cria nova versão.

Associações serão tratadas como um conjunto completo porque o contrato de desenvolvimento as substitui em lote. Antes do `PUT`, o cliente consulta o conjunto vigente, preserva associações não editadas, valida se campos e versões ainda existem e exige decisão explícita para referências órfãs. Somente versões publicadas podem ser associadas.

Alternativa considerada: salvar cada seletor isoladamente. Foi rejeitada porque o endpoint de substituição em lote poderia apagar silenciosamente associações mantidas por outro campo ou editor.

### 7. Triagem usa gravações granulares e decisão consolidada não otimista

A página carrega fila, snapshot da proposta, relatório automático, revisões por campo, feedback por critério e timeline como recursos distintos. Revisões e feedbacks são gravados individualmente e reconciliados com a resposta da API. A decisão final requer confirmação e só altera a interface após a resposta e uma nova consulta ao processo. Conflitos de estado recarregam o dado vigente e preservam texto local ainda não submetido quando possível.

O resultado automático permanece imutável. Concordância, discordância ou inconclusão são registros humanos vinculados à execução e ao critério, nunca alterações do payload histórico.

Alternativa considerada: manter toda a análise local e enviar somente a decisão final. Foi rejeitada porque perderia autoria, recuperação parcial e rastreabilidade granular.

### 8. SSE será retransmitido pela origem interna e reconciliado com histórico

O navegador abrirá `EventSource` apenas para Route Handlers internos. O serviço server-only abrirá a conexão autenticada externa conforme os recursos de streaming permitidos pela versão instalada do Next.js; antes de implementá-la, a documentação em `node_modules/next/dist/docs/` será lida. A rota propagará cancelamento quando o cliente desconectar, cabeçalhos adequados e eventos sem buffering indevido.

As telas carregam primeiro histórico paginado/limitado, depois conectam o fluxo. IDs de evento, execução, etapa e correlação serão usados para deduplicar e atualizar registros. Reconexão dispara reconciliação do histórico para cobrir lacunas. Listas em memória terão limite visível e paginação, evitando crescimento indefinido.

Alternativa considerada: conectar o `EventSource` diretamente à API externa. Foi rejeitada porque `EventSource` não permite o mesmo controle de credenciais/cabeçalhos, além de expor a URL externa e contornar a sessão da aplicação.

### 9. Entrega será incremental, mas cobrirá toda a paridade demonstrada

Primeiro serão consolidadas ou reconciliadas as mudanças anteriores que alteram as mesmas capacidades, evitando implementar sobre specs divergentes. Depois, cada fatia entregará tipos, serviço, rota, interface e verificações em conjunto. O corte em fatias organiza o trabalho, mas não reduz o resultado: a mudança somente estará concluída quando todas as ações dos módulos `users`, `forms`, `submission`, `triage`, `ai-pipeline` e `operational-index` estiverem mapeadas, implementadas ou explicitamente excluídas por inexistência de contrato.

Cada fatia será integrada diretamente à API atualizada. A matriz de paridade e testes autenticados confirmarão que a implementação Next.js produz as mesmas transições e resultados observáveis dos demos, sem copiar seus mecanismos inseguros nem adicionar feature flags locais para simular capacidade.

Alternativa considerada: portar apenas submissão e deixar configuração, triagem e observabilidade para mudanças futuras. Foi rejeitada porque o pedido é transportar o fluxo completo já demonstrado e agora suportado pelo contrato publicado.

## Risks / Trade-offs

- [Mudanças concorrentes alteram as mesmas specs de submissão e Kanban] → Consolidar ou sincronizar `add-dynamic-submission-forms` e `add-bracvam-process-kanban` antes de aplicar este plano e validar novamente os deltas.
- [O contrato publicado evoluir durante a implementação] → Fixar o snapshot inicial, derivar tipos do OpenAPI corrente, registrar diferenças na matriz de paridade e cobrir adaptadores com fixtures de contrato.
- [Paridade ser declarada apenas pela aparência das páginas] → Verificar cada ação do demo contra endpoint, transição, resposta, erro e perfil correspondente na matriz de paridade.
- [Polling gerar carga ou corrida de respostas] → Uma requisição em voo, abort controller, pausa por visibilidade, intervalo único e revalidação manual.
- [Substituição em lote apagar associações de IA] → Buscar versão vigente, preservar itens não editados, detectar referências órfãs e tratar conflito como recarga obrigatória.
- [SSE manter conexões ou memória após navegação] → Propagar abort, limitar buffers, deduplicar eventos e testar desconexão/reconexão.
- [Payloads de observabilidade conterem dados sensíveis] → Exibir somente campos devolvidos para a sessão autorizada, manter detalhes recolhidos e nunca renderizar payload como HTML.
- [Algumas autorizações administrativas serem compostas por perfil e permissão] → Normalizar `access.profiles` e `global_permissions` da sessão, reproduzir somente os critérios observáveis do backend e mantê-lo como autoridade final.
- [Escopo amplo aumentar regressões] → Entregar e verificar verticalmente por domínio, preservando login, shell e fluxos já existentes a cada etapa.

## Migration Plan

1. Reconciliar as duas mudanças OpenSpec anteriores com as specs principais e com estes deltas; não arquivar uma mudança com verificação manual pendente sem registrar seu resultado.
2. Capturar o OpenAPI publicado no início da implementação e criar a matriz de paridade para todas as páginas e ações dos demos.
3. Atualizar primeiro os contratos compartilhados de sessão, usuário e processo; corrigir cadastro com `full_name`, remover exclusão de rascunho e alinhar título e estados.
4. Entregar editor de formulários e biblioteca de avaliações como fatias separadas, já conectadas aos endpoints publicados.
5. Entregar pré-avaliação/correção no fluxo do proponente, seguida de triagem e Kanban alinhado.
6. Entregar históricos e proxies SSE de observabilidade, validando cancelamento e autorização em ambiente com backend atualizado.
7. Executar lint, build, testes automatizados, auditoria de chamadas do navegador e roteiros autenticados por perfil. Conferir toda a matriz de paridade antes de considerar a mudança concluída.

O rollback pode ocultar os novos itens de navegação e reverter páginas/Route Handlers por fatia, pois não há migração local de dados. Versões, avaliações, feedbacks e decisões já persistidos no backend não serão apagados; a versão anterior do frontend continuará tratando estados desconhecidos pela contingência do Kanban até a correção ser reaplicada.
