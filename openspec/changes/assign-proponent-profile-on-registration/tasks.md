## 1. Contratos e preparação segura

- [ ] 1.1 Ler a documentação instalada do Next.js 16.3.3 aplicável a Route Handlers, variáveis de ambiente server-only e tratamento de cookies antes de alterar o cadastro.
- [ ] 1.2 Atualizar os tipos em `types/` para representar autenticação técnica, resultado do provisionamento, atribuição de perfil e falhas compensáveis sem declarar tipos locais nos serviços ou rotas.
- [ ] 1.3 Documentar as variáveis `PIVMA_REGISTRATION_ADMIN_USERNAME` e `PIVMA_REGISTRATION_ADMIN_PASSWORD` como configuração exclusivamente server-side, sem inserir os valores fornecidos em arquivos versionados.

## 2. Provisionamento server-only do proponente

- [ ] 2.1 Implementar autenticação e encerramento da sessão técnica em serviço server-only, extraindo o cookie temporário sem expô-lo ao navegador ou aos logs.
- [ ] 2.2 Implementar a listagem paginada e a validação de um perfil ativo `Proponente`, recusando homônimos ambíguos, inativos ou com permissões administrativas.
- [ ] 2.3 Implementar a criação idempotente do perfil customizado `Proponente` com `permission_codes: []`, relendo o catálogo quando uma criação concorrente produzir conflito.
- [ ] 2.4 Implementar a atribuição do perfil somente ao identificador da identidade recém-criada e a desativação compensatória dessa identidade quando a atribuição não for confirmada.
- [ ] 2.5 Compor o fluxo completo para validar configuração, autenticar, resolver o perfil, criar a identidade, atribuir o perfil e sempre encerrar a sessão técnica, preservando códigos internos seguros para cada falha.

## 3. Cadastro, navegação e internacionalização

- [ ] 3.1 Atualizar `POST /api/auth/register` para usar o provisionamento coordenado e retornar `201` somente quando a conta estiver ativa com o perfil `Proponente`, mapeando falhas para códigos estáveis e respostas seguras.
- [ ] 3.2 Atualizar o formulário de cadastro e os dicionários `pt-BR` e `en` para comunicar sucesso pronto para submissão e falhas de provisionamento sem revelar identidade existente, credencial administrativa ou detalhes externos.
- [ ] 3.3 Corrigir o shell autenticado para reconhecer o nome normalizado `proponente` e remover o papel local `proponent` da decisão de visibilidade do item Submissões.

## 4. Verificação

- [ ] 4.1 Verificar configuração ausente, credencial inválida, perfil existente, primeiro provisionamento, conflito concorrente, perfil incompatível, falha de atribuição e compensação, confirmando que nenhum segredo aparece em resposta ou log.
- [ ] 4.2 Exercitar com uma conta temporária o cadastro, login, presença exclusiva do perfil global `Proponente`, visibilidade de Submissões, criação de processo e recebimento do papel local `proponent`; desativar a conta temporária ao final.
- [ ] 4.3 Confirmar que Administrador e BraCVAM sem o perfil `Proponente` não veem Submissões e que o perfil provisionado não recebe nenhuma das treze permissões administrativas atuais.
- [ ] 4.4 Executar `pnpm i18n:check`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `git diff --check` e `openspec validate assign-proponent-profile-on-registration --strict`.
