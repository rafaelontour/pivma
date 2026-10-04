## 1. Integração protegida

- [x] 1.1 Adicionar ao serviço server-only a chamada `DELETE /processes/{id}`, propagando o cookie de sessão e normalizando falhas da API.
- [x] 1.2 Implementar `DELETE /api/submissions/[processId]` com validação de UUID, sessão, papel local `proponent`, `is_submitted: false` e presença de `DELETE` em `available_actions`, sem encaminhar submissões enviadas.

## 2. Interface do proponente

- [x] 2.1 Modelar em `types/` o estado e as propriedades necessários à confirmação e exclusão de rascunho.
- [x] 2.2 Adicionar a ação Excluir somente aos cartões de rascunho e implementar modal acessível com cancelamento, carregamento, erro e confirmação.
- [x] 2.3 Atualizar a lista somente após sucesso e adicionar todas as mensagens de interface em português do Brasil e inglês.
- [x] 2.4 Separar Rascunhos e Submissões por `is_submitted` e mover imediatamente o processo para Submissões após o envio.

## 3. Verificação

- [x] 3.1 Validar o fluxo real de exclusão de um rascunho próprio e confirmar que ele deixa de aparecer na listagem.
- [x] 3.2 Verificar que chamadas sem sessão, sem escopo `proponent`, para processo enviado ou sem `DELETE` em `available_actions` são recusadas, mantendo submissões enviadas sem botão de exclusão.
- [x] 3.3 Executar `pnpm i18n:check`, `pnpm lint`, `pnpm exec tsc --noEmit`, `git diff --check` e `openspec validate delete-submission-drafts --strict`.
