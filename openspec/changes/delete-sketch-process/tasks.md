## 1. Contrato e estabilização

- [x] 1.1 Ler a documentação instalada do Next.js 16.3.3 aplicável a Route Handlers e respostas sem corpo antes de alterar a rota interna.
- [x] 1.2 Inspecionar e reparar a marcação de `process-kanban.tsx`, preservando as demais alterações locais e confirmando isoladamente que o arquivo volta a passar no parser e no TypeScript.
- [x] 1.3 Tipar `available_actions` no domínio de processos e ajustar os validadores de resposta para preservar somente as ações publicadas reconhecidas.

## 2. Integração protegida de exclusão

- [x] 2.1 Implementar em `services/Submissao.ts` a exclusão server-only por `DELETE /processes/{id}`, tratando `204` como sucesso sem corpo e preservando os status externos em falhas.
- [x] 2.2 Adicionar `DELETE` ao Route Handler interno `/api/submissions/[processId]`, validando UUID, sessão e escopo local `proponent` antes de chamar o serviço.
- [x] 2.3 Garantir que respostas internas de sucesso não tenham corpo e que recusas `401`, `403`, `404`, `409`, `422` e falhas transitórias não removam o rascunho na interface.

## 3. Experiência do proponente

- [x] 3.1 Adicionar em `types/Submissao.ts` os estados e propriedades compartilhados do fluxo de confirmação e exclusão, sem tipos locais no componente.
- [x] 3.2 Exibir Apagar somente em cartões cujo `available_actions` contenha `DELETE` e bloquear abertura ou outra exclusão enquanto a operação destrutiva estiver em andamento.
- [x] 3.3 Implementar diálogo acessível de confirmação com identificação do rascunho, contenção e restauração de foco, Escape, Cancelar, estado de envio e nova tentativa após falha.
- [x] 3.4 Após `204`, remover o rascunho da coleção confirmada, atualizar a contagem e emitir feedback Sonner; em qualquer falha, preservar diálogo, cartão e mensagem segura.

## 4. Verificação e coerência

- [x] 4.1 Verificar visibilidade com e sem `DELETE`, cancelamento, clique concorrente, sucesso sem corpo e preservação do cartão em recusas ou falhas de rede.
- [x] 4.2 Executar lint direcionado, `pnpm exec tsc --noEmit`, `git diff --check`, `pnpm build` e `openspec validate delete-sketch-process --strict`, separando falhas preexistentes ou ambientais de regressões desta change.
- [x] 4.3 Confirmar por inspeção que o navegador chama somente a rota interna e registrar que `align-next-app-with-prototype-workflow` deve ser arquivada ou reconciliada antes desta change para não reaplicar a remoção temporária da exclusão.
