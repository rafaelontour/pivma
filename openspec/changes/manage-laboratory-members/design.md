## Context

A change `add-institutional-catalog-settings` introduz a página hierárquica de instituições e laboratórios. O frontend também possui um diretório administrativo paginado de usuários. Administrador e BraCVAM recebem atualmente `institutional.affiliations.manage`, `institutional.read` e `users.read`; Proponente não recebe essas permissões.

O OpenAPI atual publica `GET` e `POST /institutional/users/{user_id}/affiliations`, `DELETE /institutional/users/{user_id}/affiliations/{affiliation_id}` e a consulta das afiliações da própria sessão. `AffiliationCreate` exige `institution_id` e aceita `laboratory_id`; a resposta relaciona referências de usuário, instituição e laboratório. Não existe, porém, endpoint ou filtro para listar afiliações por laboratório, o que impede uma lista laboratorial completa sem consultar cada usuário.

## Goals / Non-Goals

**Goals:**

- Integrar a gestão de membros ao laboratório selecionado sem confundir catálogo, afiliação e participação em processo.
- Reusar usuários persistidos e validar todos os identificadores e estados antes das mutações.
- Carregar membros com uma consulta paginada por laboratório e reconciliar o estado após cada operação.
- Preservar autorização, privacidade, internacionalização e acessibilidade já adotadas no projeto.

**Non-Goals:**

- Criar contas, perfis de permissão ou convites.
- Designar patrocinador, grupo gestor ou laboratório participante em um processo.
- Permitir autoafiliação ou gestão por Proponente ou por um papel local de processo.
- Implementar varredura N+1 do diretório para descobrir membros.
- Reativar afiliações ou apresentar histórico completo de vínculos inativos.

## Decisions

### 1. Gestão contextual dentro do laboratório

Cada laboratório ativo receberá a ação **Gerenciar membros**, abrindo um painel ou diálogo contextual com título, instituição, laboratório, membros atuais e busca de usuários. Isso reduz o risco de associar a pessoa ao laboratório errado e mantém a hierarquia institucional visível.

A alternativa de criar imediatamente outro cartão em Configurações foi descartada porque o operador já chegou ao recurso-alvo pelo catálogo. Se o volume futuro exigir operações em massa, um módulo específico poderá ser proposto separadamente.

### 2. A listagem depende de consulta reversa no backend

Antes da implementação, o backend deverá publicar uma listagem paginada de afiliações filtrada por `laboratory_id`, ou um recurso equivalente protegido por `institutional.affiliations.manage`. O frontend não percorrerá todas as contas chamando o endpoint de afiliações por usuário, pois esse desenho cresce como N+1, aumenta exposição de dados e não produz um snapshot transacionalmente consistente.

Os contratos existentes continuam adequados para criar e desativar vínculos. A nova consulta reversa é uma dependência externa explícita desta change; enquanto ela não existir, a ação não deverá ser publicada como funcional.

### 3. Usuários são pesquisados e selecionados por identificador

A inclusão reutilizará a busca paginada do diretório com `active=true`. O valor confirmado será o UUID de uma opção retornada, nunca um e-mail ou nome digitado sem resolução. Isso evita criar identidade implicitamente e permite que a API faça a validação final de concorrência e situação da conta.

Administrador e BraCVAM possuem hoje `users.read`, mas as rotas internas repetirão `institutional.affiliations.manage` e as permissões necessárias. A interface não inferirá autorização pelo nome do perfil.

### 4. A instituição vem do laboratório, não de um segundo seletor

Ao adicionar um membro, o corpo será derivado do alvo contextual: `institution_id` virá de `laboratory.institution.id` e `laboratory_id` do laboratório selecionado. Não haverá um seletor independente de instituição, eliminando combinações divergentes na interface. O Route Handler validará ambos os UUIDs e o serviço externo continuará como autoridade sobre existência, atividade e correspondência.

### 5. Criação e desativação usam rotas internas específicas

Tipos de afiliação, paginação, entradas e estados de interface ficarão em `types/Institucional.ts` ou em um arquivo institucional dedicado, conforme o tamanho final. Serviços server-only normalizarão estritamente as respostas e encaminharão `Origin` e sessão apenas à API externa.

Route Handlers internos serão organizados pelo laboratório para a consulta e pelo usuário/afiliação para as mutações. Eles mapearão ausência de sessão, proibição, recurso inexistente, conflito, validação e indisponibilidade para códigos seguros, sem expor URL ou credencial externa.

### 6. Validação em camadas e reconciliação autoritativa

Conforme a regra geral do README, a confirmação ficará desabilitada até que exista usuário ativo selecionado e contexto válido de instituição e laboratório. A mesma validação será repetida no envio e no servidor. Enquanto houver requisição, novas ações conflitantes permanecerão bloqueadas.

Depois de uma mutação aceita, o cliente recarregará a página de membros. Se essa reconciliação falhar, comunicará estado possivelmente desatualizado e oferecerá atualização manual sem repetir automaticamente o `POST` ou `DELETE`. Em `409`, fará reconsulta antes de permitir nova tentativa.

### 7. Afiliação e participação em processo permanecem separadas

Afiliação responde “de qual laboratório esta conta faz parte”. A designação `participating_laboratory` responde “qual responsabilidade esta pessoa possui neste processo”. Nenhuma operação desta change chamará endpoints de participantes ou convites, e a interface explicará que o vínculo institucional não concede participação automática.

## Risks / Trade-offs

- **[Backend ainda não lista afiliações por laboratório]** → manter a change aberta e condicionar a implementação ao contrato paginado reverso; não introduzir N+1 temporário.
- **[Conta ou laboratório desativado entre seleção e envio]** → repetir validações no servidor, tratar `404`, `409` ou `422` com mensagem segura e reconciliar.
- **[Duplicidade concorrente]** → bloquear envio local, confiar na unicidade do backend e recarregar a lista após conflito.
- **[Diretório de usuários pode crescer]** → pesquisar e paginar no servidor, sem carregar todas as contas no navegador.
- **[Confusão entre membro e participante]** → manter textos e integrações distintos e não executar efeitos colaterais em processos.

## Migration Plan

1. Confirmar a publicação e a autorização da consulta paginada por laboratório no OpenAPI.
2. Implementar tipos, serviço e Route Handlers internos sem expor a origem externa.
3. Disponibilizar a gestão no laboratório somente para sessões autorizadas.
4. Validar inclusão e desativação com contas de teste explicitamente indicadas e remover ou desativar os vínculos temporários ao final.
5. Em rollback, remover a ação e as rotas internas; afiliações persistidas continuam auditáveis no backend e não exigem migração de dados.
