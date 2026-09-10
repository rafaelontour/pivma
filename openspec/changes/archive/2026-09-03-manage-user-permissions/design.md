## Context

A área autenticada já obtém a sessão por rotas internas e possui uma listagem de usuários. A API externa modela acesso por perfis: a atribuição e remoção são realizadas por usuário, enquanto os `permission_codes` pertencem ao perfil e têm efeito global.

## Goals / Non-Goals

**Goals:**

- Disponibilizar ações administrativas de perfil sem expor a integração externa ao cliente.
- Tornar o efeito global da edição de `permission_codes` claro antes do salvamento.
- Atualizar os dados exibidos após cada operação, sem exigir um novo login.

**Non-Goals:**

- Criar permissões individuais fora de um perfil, pois a API não oferece esse modelo.
- Criar, desativar ou editar nome e descrição de perfis.

## Decisions

- Usar rotas internas como camada BFF para todas as operações de RBAC. Isso preserva cookies e URL externa no servidor; chamadas diretas do navegador foram descartadas porque exporiam a integração e não atendem ao requisito de origem da API.
- Buscar o catálogo de perfis, permissões e acesso da pessoa ao abrir a gestão. Isso mantém a lista inicial leve e fornece dados atuais no momento da alteração.
- Mostrar a descrição do perfil como cargo na listagem. A alternativa de inferir o cargo pelo nome do perfil foi descartada porque a descrição é o campo de apresentação definido pelo serviço.
- Aplicar o cabeçalho de origem do serviço externo somente às mutações administrativas. A API exige esse contexto para aceitar POST, PATCH e DELETE.

## Risks / Trade-offs

- [Editar um perfil altera o acesso de várias pessoas] → A interface apresenta aviso explícito antes do salvamento.
- [A listagem de cargos requer consultas de acesso por pessoa] → As consultas são agrupadas em lotes para limitar concorrência.
- [O serviço externo pode rejeitar uma operação] → As rotas internas normalizam respostas e a interface mantém o estado anterior em caso de falha.

## Migration Plan

1. Publicar as rotas internas e serviços de RBAC junto à interface de gestão.
2. Validar concessão, remoção e edição de códigos com uma conta administradora.
3. Em caso de rollback, remover as novas ações da interface e rotas internas; perfis já alterados permanecem sujeitos à trilha de auditoria do serviço externo.
