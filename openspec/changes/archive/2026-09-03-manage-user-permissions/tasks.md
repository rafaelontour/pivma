## 1. Integração administrativa de RBAC

- [x] 1.1 Criar serviços e rotas internas para listar perfis, permissões e acessos de usuários.
- [x] 1.2 Implementar concessão e revogação de perfis pela integração protegida no servidor.
- [x] 1.3 Encaminhar a origem exigida pela API externa nas mutações administrativas.
- [x] 1.4 Implementar atualização dos `permission_codes` de um perfil pela rota interna.

## 2. Gestão de acesso na interface

- [x] 2.1 Exibir a descrição dos perfis como cargos na listagem de usuários.
- [x] 2.2 Adicionar painel de gestão com cargos atuais, concessão de perfil e permissões efetivas.
- [x] 2.3 Permitir remover cargo e atualizar imediatamente os dados da pessoa na listagem.
- [x] 2.4 Permitir editar e salvar os códigos de permissão de um perfil, informando seu efeito global.

## 3. Organização e verificação

- [x] 3.1 Centralizar tipagens por domínio em `types/` e documentar a regra no `AGENTS.md`.
- [x] 3.2 Validar acesso com conta administradora e confirmar a atribuição de um perfil pelo serviço externo.
- [x] 3.3 Executar `pnpm lint`, `pnpm exec tsc --noEmit` e `git diff --check`.
