## Why

O backend publicado agora oferece `DELETE /processes/{id}` e informa `DELETE` em `available_actions` quando um processo pode ser removido, mas a interface do proponente ainda não permite apagar um rascunho salvo. A árvore atual também contém uma alteração incompleta no diálogo de detalhes do Kanban que precisa voltar a compilar com marcação válida.

## What Changes

- Restaurar uma ação Apagar nos cartões de rascunho do proponente somente quando o backend informar `DELETE` entre as ações disponíveis.
- Solicitar confirmação em diálogo acessível antes de excluir e impedir interações concorrentes enquanto a operação estiver em andamento.
- Integrar a exclusão pelo serviço server-only e por um Route Handler interno, preservando a URL externa e a credencial de sessão exclusivamente no servidor.
- Remover o cartão e atualizar a contagem somente após o backend responder com sucesso; em falhas, manter o rascunho e apresentar uma mensagem segura que permita nova tentativa.
- Corrigir a marcação quebrada em `process-kanban.tsx` sem alterar o comportamento somente leitura do quadro.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `dynamic-process-forms`: disponibilizar exclusão confirmada de rascunhos próprios conforme a ação `DELETE` autorizada pelo backend.

## Impact

- Tipos de processo e propriedades dos cartões/diálogos em `types/` passam a representar `available_actions` e o estado da exclusão.
- `services/Submissao.ts` passa a consumir `DELETE /processes/{id}` e a rota interna de submissão passa a expor o método `DELETE` com validação de sessão, UUID, vínculo proponente e resposta `204`.
- `app/(paginas)/submissoes/submission-catalog.tsx` recebe a ação, a confirmação acessível, feedback Sonner e reconciliação local da lista.
- `app/(paginas)/processos/process-kanban.tsx` recebe somente o reparo necessário para voltar a passar nas verificações estáticas.
- Nenhuma dependência nova de frontend ou alteração de contrato do backend é necessária.
