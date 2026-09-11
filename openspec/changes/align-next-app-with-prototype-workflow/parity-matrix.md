# Matriz de paridade dos demos

## Referências fixadas

- Protótipo funcional: `pivma-back/develop/demos`, snapshot local consultado em 10/09/2026.
- API publicada: `https://api.pivma.acerola.dev.br/openapi.json`, consultada em 10/09/2026 às 21:49 BRT.
- OpenAPI: 56 caminhos, 106 schemas, SHA-256 `6e2e1865cbbd375cc3303154da9d10e19131259a3c54980dee62c3247a548bac`.
- Regra de integração: o navegador acessa apenas `/api/*` do Next.js; a coluna Endpoint mostra o destino externo usado pelo serviço server-only.
- Estado inicial: `existente` indica comportamento já presente no projeto; `portar` indica trabalho desta mudança; `excluído` exige justificativa explícita.

## Usuários e RBAC

| Ação observável | Destino Next.js | Endpoint e método | Entrada → resposta | Acesso | Estado |
| --- | --- | --- | --- | --- | --- |
| Consultar sessão | Shell autenticado | `GET /auth/me` | cookie → `CurrentUserResponse` | autenticado | portar normalização |
| Listar, buscar e filtrar usuários | `/usuarios` | `GET /users` | busca, ativo, página → `AdminUserPage` | `users.read` | portar |
| Criar usuário | `/usuarios` | `POST /users` | `UserSchema` → `UserPublic` | `users.manage` | portar `full_name` |
| Editar nome completo | `/usuarios` | `PATCH /users/{user_id}` | `UserUpdate` → `UserPublic` | `users.manage` | portar |
| Listar permissões | `/usuarios` | `GET /rbac/permissions` | filtros → `PermissionPublic[]` | RBAC leitura | existente |
| Listar perfis | `/usuarios` | `GET /rbac/profiles` | filtros → `ProfilePublic[]` | RBAC leitura | existente |
| Criar perfil | `/usuarios` | `POST /rbac/profiles` | `ProfileCreate` → `ProfilePublic` | gestão RBAC | portar |
| Consultar acesso individual | `/usuarios` | `GET /rbac/users/{user_id}/access` | UUID → `UserAccess` | RBAC leitura | existente |
| Atribuir perfil | `/usuarios` | `POST /rbac/users/{user_id}/profiles/{profile_id}` | UUIDs → `ProfileAssignmentPublic` | gestão RBAC | existente |
| Revogar perfil | `/usuarios` | `DELETE /rbac/users/{user_id}/profiles/{profile_id}` | UUIDs → confirmação | gestão RBAC | existente |

## Formulários e configuração de IA

| Ação observável | Destino Next.js | Endpoint e método | Entrada → resposta | Acesso | Estado |
| --- | --- | --- | --- | --- | --- |
| Selecionar template de processo | `/formularios` | `GET /processes/templates` | sessão → `ProcessTemplateSummary[]` | autenticado | portar editor |
| Descobrir formulários do template | `/formularios` | `GET /processes/templates/{key}` | chave → `ProcessTemplateDetail` | autenticado | portar |
| Carregar formulário | `/formularios` | `GET /processes/templates/{key}/forms/{form_key}` | chaves → `FormTemplateDetailResponse` | autenticado | portar |
| Editar metadados, seções e campos | `/formularios` | `PUT /processes/templates/{key}/forms/{form_key}` | `UpdateFormTemplateRequest` → detalhe atualizado | gestão BraCVAM | portar |
| Exibir campos avaliáveis e vínculos | `/formularios` | `GET /form-templates/{template_key}/evaluable-fields` | chave → `EvaluableFieldsResponse` | leitura IA | portar |
| Carregar biblioteca de avaliações | `/avaliacoes-ia` | `GET /ai-evaluations` | busca/página → `EvaluationDefinitionPage` | `ai_evaluations.read` | portar |
| Criar avaliação e primeiro rascunho | `/avaliacoes-ia` | `POST /ai-evaluations` | `CreateEvaluationRequest` → `EvaluationDefinitionResponse` | `ai_evaluations.manage` | portar |
| Carregar avaliação ou versão | `/avaliacoes-ia` | `GET /ai-evaluations/{definition_id}` e `/versions/{number}` | identidade → definição/versão | leitura IA | portar |
| Sugerir critérios | `/avaliacoes-ia` | `POST /ai-evaluations/suggest-criteria` | `SuggestCriteriaRequest` → sugestões | gestão IA | portar |
| Salvar critérios do rascunho | `/avaliacoes-ia` | `PATCH /ai-evaluations/{definition_id}/versions/{number}` | `PatchEvaluationVersionRequest` → versão | gestão IA | portar |
| Testar versão | `/avaliacoes-ia` | `POST /ai-evaluations/{definition_id}/versions/{number}/test` | `EvaluationTestRequest` → resultado estruturado | gestão IA | portar |
| Publicar versão | `/avaliacoes-ia` | `POST /ai-evaluations/{definition_id}/versions/{number}/publish` | identidade → `PublishResponse` | gestão IA | portar |
| Criar nova versão | `/avaliacoes-ia` | `POST /ai-evaluations/{definition_id}/versions` | identidade → nova versão | gestão IA | portar |
| Consultar e substituir associações | `/avaliacoes-ia` | `GET/PUT /form-templates/{template_key}/evaluation-assignments` | chave/conjunto → `AssignmentsResponse` | gestão IA | portar |

## Submissão e pré-avaliação

| Ação observável | Destino Next.js | Endpoint e método | Entrada → resposta | Acesso | Estado |
| --- | --- | --- | --- | --- | --- |
| Listar templates e processos próprios | `/submissoes` | `GET /processes/templates` e `GET /processes` | paginação → listas | proponente | existente/ajustar |
| Criar processo com título | `/submissoes` | `POST /processes` | `CreateProcessRequest` → `ProcessInstanceDetail` | proponente | portar título |
| Carregar processo e formulário | `/submissoes` | `GET /processes/{id}` e `GET /activities/{activity_key}/form` | UUID/chave → processo/formulário | participante | existente/ajustar |
| Salvar rascunho | `/submissoes` | `PUT /processes/{id}/activities/{activity_key}/form` | `SaveFormValuesRequest` → formulário | proponente | existente |
| Enviar proposta | `/submissoes` | `POST /processes/{id}/activities/{activity_key}/form` | `SubmitFormRequest` → conclusão | proponente | existente/ajustar estado |
| Enviar, baixar e remover anexo | `/submissoes` | `POST/GET/DELETE /processes/{id}/activities/{activity_key}/form/fields/{field_key}/attachment` | multipart/identidade → metadados, arquivo ou remoção | proponente | portar |
| Acompanhar pré-avaliação | `/submissoes` | `GET /processes/{id}/pre-evaluation` | UUID → `PreEvaluationResponse` | participante | portar |
| Corrigir e reenviar resultado negativo | `/submissoes` | formulário `PUT/POST` + pré-avaliação `GET` | valores → nova execução/estado | proponente | portar |
| Solicitar revisão humana direta | `/submissoes` | `POST /processes/{id}/submission/direct-review` | `DirectReviewRequestBody` → `DirectReviewResponse` | proponente elegível | portar |
| Excluir processo em rascunho | `/submissoes` | inexistente | sem contrato | — | excluído: API não publica `DELETE /processes/{id}` |

## Triagem

| Ação observável | Destino Next.js | Endpoint e método | Entrada → resposta | Acesso | Estado |
| --- | --- | --- | --- | --- | --- |
| Listar processos em triagem | `/triagem` | `GET /processes` | estado/página → `ProcessInstanceListResponse` | `triage.review` | portar |
| Ler proposta | `/triagem` | `GET /processes/{id}` e formulário `GET` | processo → snapshot e valores | `triage.review` | portar |
| Ler evidências da IA | `/triagem` | `GET /processes/{id}/pre-evaluation` | processo → relatório | `triage.review` | portar |
| Registrar concordância por critério | `/triagem` | `POST /processes/{id}/pre-evaluation/{run_id}/feedback` | `ReviewerFeedbackRequest` → feedback | `triage.review` | portar |
| Salvar pareceres dos campos | `/triagem` | `POST /processes/{id}/triage/reviews` | `SaveFieldReviewsRequest` → resumo | `triage.review` | portar |
| Aprovar, diligenciar ou rejeitar | `/triagem` | `POST /processes/{id}/triage/decision` | `TriageDecisionRequest` → decisão/estado | `triage.review` | portar |
| Consultar linha do tempo | `/triagem` | `GET /processes/{id}/timeline` | processo → `ProcessTimelineResponse` | participante autorizado | portar |

## Observabilidade

| Ação observável | Destino Next.js | Endpoint e método | Entrada → resposta | Acesso | Estado |
| --- | --- | --- | --- | --- | --- |
| Consultar histórico operacional | `/observabilidade/operacional` | `GET /admin/logs/operational` | filtros/limite → eventos | administrador | portar |
| Acompanhar eventos operacionais | `/observabilidade/operacional` | `GET /admin/logs/operational/stream` | filtros → SSE | administrador | portar |
| Consultar pipelines de IA | `/observabilidade/ia` | `GET /admin/logs/ai` | limite → grupos por correlação | administrador | portar |
| Acompanhar etapas de IA | `/observabilidade/ia` | `GET /admin/logs/ai/stream` | sessão → SSE | administrador | portar |
| Expandir payloads técnicos | `/observabilidade/ia` | dados do histórico/SSE | evento → entrada, saída e erro | administrador | portar |

## Contrato comum de erros e verificação

| Status | Comportamento interno e visível |
| --- | --- |
| `401` | apagar somente a sessão local inválida quando aplicável e direcionar para login sem expor dados |
| `403` | manter a sessão, ocultar dados protegidos e informar falta de autorização |
| `404` | informar recurso inexistente sem classificá-lo como endpoint futuro |
| `409` | preservar edição local, recarregar o estado confirmado e comunicar conflito |
| `422` | preservar valores e apresentar validação segura junto à interação |
| `5xx` ou rede | manter o último snapshot confirmado e oferecer nova tentativa sem declarar sucesso |

Uma linha somente passa de `portar` para `verificado` após: rota interna implementada, serviço server-only, tipo em `types/`, cenário feliz, erro aplicável, autorização e inspeção de rede sem origem ou cookie externos no navegador.
