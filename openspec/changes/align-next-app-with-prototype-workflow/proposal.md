## Why

O frontend Next.js implementa autenticação, administração básica, Kanban e uma primeira versão do fluxo de submissão, mas ainda não representa o ciclo operacional completo demonstrado nos HTML de `pivma-back/develop/demos`: configuração dos formulários e da IA, pré-avaliação assíncrona, retorno orientado ao proponente, triagem humana e observabilidade. Como esses contratos já estão publicados na API de referência, o fluxo demonstrado pode agora ser portado integralmente para a arquitetura e a interface do projeto atual.

## What Changes

- Portar para o frontend Next.js todas as jornadas e operações funcionais demonstradas em `demos/users`, `demos/forms`, `demos/submission`, `demos/triage`, `demos/ai-pipeline` e `demos/operational-index`, mantendo uma matriz de paridade entre ações do protótipo e telas do produto.
- Alinhar cadastro e gestão de usuários ao contrato que exige nome completo, incluindo busca, filtro por situação, edição do nome e criação de perfis de acesso.
- Adicionar uma área BraCVAM para editar os formulários vinculados aos templates de processo, com campos, seções, tipos, ordem, obrigatoriedade, ajuda e habilitação para avaliação por IA.
- Adicionar uma biblioteca de avaliações configuráveis por IA, permitindo criar objetivos em linguagem natural, sugerir e editar critérios, testar rascunhos, publicar versões imutáveis e associá-las aos campos dos formulários.
- **BREAKING**: substituir o título técnico automático da nova submissão por um título significativo informado pelo proponente antes da criação do processo.
- **BREAKING**: remover a ação de excluir rascunho enquanto o backend de referência não publicar `DELETE /processes/{id}`, evitando manter uma operação que sempre falha.
- Ampliar o formulário dinâmico para respeitar seções e indicar campos avaliados por IA, preservando rascunhos, salvamento explícito, retomada e acompanhamento já existentes.
- Integrar a pré-avaliação assíncrona após o envio, exibindo progresso, síntese, evidências e pontos de atenção e oferecendo, quando necessário, correção com reenvio ou solicitação de intervenção direta do BraCVAM.
- Adicionar a área de triagem humana com leitura da proposta, feedback sobre cada critério da IA, parecer por campo, decisão consolidada e linha do tempo auditável.
- Alinhar o Kanban aos estados reais `SUBMISSION`, `AI_PRE_EVALUATION`, `TRIAGE`, `PLANNING` e `CLOSED`, mantendo o quadro somente leitura e usando `triage.review` para identificar o acesso da equipe BraCVAM.
- Adicionar observabilidade administrativa de execuções de IA e eventos operacionais, com histórico, filtros, agrupamento por correlação e atualização em tempo real por SSE.
- Incorporar os fluxos ao shell e aos padrões de interface do produto, sem copiar credenciais rápidas, inspetor técnico, chamadas externas diretas, `alert`, `prompt`, `confirm` ou inserção insegura de HTML das demos.
- Manter todas as integrações externas em serviços server-only e Route Handlers internos, consumindo os contratos atualmente publicados e tratando falhas reais sem simular persistência ou transições no cliente.

## Capabilities

### New Capabilities

- `form-template-management`: edição administrativa dos formulários dos templates de processo, incluindo estrutura, seções e habilitação de IA por campo.
- `configurable-ai-evaluations`: biblioteca versionada de avaliações, critérios assistidos, teste, publicação, associações e pré-avaliação apresentada ao proponente.
- `bracvam-triage`: análise humana da submissão, consulta da evidência produzida pela IA, feedback por critério, pareceres, decisão e timeline.
- `administrative-observability`: consulta e acompanhamento em tempo real de eventos operacionais e pipelines de IA por pessoas administradoras.

### Modified Capabilities

- `user-registration`: o cadastro passa a exigir e enviar o nome completo aceito pelo contrato atual da API.
- `user-access-management`: a gestão passa a usar os perfis já retornados na listagem, buscar e filtrar usuários, editar nome completo e criar perfis customizados.
- `authenticated-navigation`: a navegação passa a separar o acesso global do perfil Proponente dos módulos administrativos e a expor editor de formulários, triagem e observabilidade de acordo com os perfis e permissões da sessão.
- `dynamic-process-forms`: a criação recebe um título do proponente e o formulário passa a apresentar seções, indicadores de IA e os estados da pré-avaliação sem perder as operações atuais de rascunho.
- `process-kanban`: as colunas e a autorização passam a refletir o ciclo e as permissões efetivamente definidos pela branch `develop` do backend.

## Impact

- Novas páginas autenticadas, componentes, tipos de domínio, serviços server-only e Route Handlers internos para templates, avaliações de IA, pré-avaliação, triagem, timeline e observabilidade.
- Alterações nas páginas `/login`, `/usuarios`, `/submissoes` e `/processos`, além do shell autenticado.
- Uso imediato dos contratos publicados para usuários, RBAC, templates, formulários, processos, `/ai-evaluations`, associações, pré-avaliação, revisão direta, feedback, retry administrativo, triagem, timeline e logs/SSE administrativos.
- O endpoint legado de avaliação direta foi removido da API atual e não será reintroduzido no frontend; todo o processamento seguirá o fluxo assíncrono oficial.
- A API ainda não publica exclusão de processo, portanto rascunhos permanecerão retomáveis e sem ação de exclusão nesta mudança.
- Nenhuma nova dependência de frontend é prevista. A implementação continuará em Next.js, React, TypeScript, Tailwind, Axios, Radash e Sonner.
