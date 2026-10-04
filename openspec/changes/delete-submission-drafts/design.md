## Context

O frontend precisa separar o formulário ainda salvo da submissão efetivamente enviada. A API externa publica `DELETE /processes/{id}` com sucesso `204`, informa as operações em `available_actions` e expõe `is_submitted` no formulário. No ambiente integrado, `DELETE` ainda pode permanecer disponível depois do envio; por isso, ele não é suficiente para classificar nem proteger sozinho uma submissão. A integração deve manter URL e cookie externos no servidor e precisa proteger também chamadas diretas à Route Handler; veja `proposal.md` e o delta de `dynamic-process-forms`.

## Goals / Non-Goals

**Goals:**

- Integrar a exclusão externa sem expor a API ao navegador.
- Aplicar autorização por escopo e estado antes da operação destrutiva.
- Manter confirmação, carregamento, erro e sucesso coerentes na interface.

**Non-Goals:**

- Excluir submissões enviadas ou qualquer processo sem `DELETE` em `available_actions`.
- Criar exclusão administrativa, restauração ou exclusão em lote.
- Alterar o ciclo de vida ou os estados definidos pela API.

## Decisions

### A Route Handler revalida escopo e estado

`DELETE /api/submissions/[processId]` validará o UUID e a sessão, confirmará que o usuário possui `proponent` no escopo daquele processo, consultará o processo e o formulário atuais e só então encaminhará a exclusão se `is_submitted` for falso e `available_actions` contiver `DELETE`. Isso impede que esconder o botão seja a única proteção e cobre respostas inconsistentes nas quais a ação permanece disponível após o envio.

### Rascunhos e enviados usam `is_submitted`

As listagens de rascunhos e enviados serão separadas pelo booleano `is_submitted` do formulário: falso permanece em Rascunhos; verdadeiro aparece em Submissões. O status geral (`OPEN`, `CLOSED`, `CANCELLED` ou `ARCHIVED`) e `available_actions` não distinguem com segurança essas situações. Depois do envio, a interface remove o processo da lista de rascunhos, seleciona Submissões e revalida as duas fontes.

### A exclusão externa fica em serviço server-only

O serviço encapsulará `DELETE /processes/{id}` com o cookie de acesso e devolverá apenas sucesso ou status normalizado à Route Handler. Colocar a URL externa no componente cliente foi descartado por violar a arquitetura de autenticação e expor detalhes da infraestrutura.

### O cartão abre um modal controlado

Cada cartão de rascunho terá uma ação Excluir que abre um modal acessível com o código e o título do processo. A confirmação terá estado de carregamento, bloqueará operações concorrentes e só atualizará a lista após `204`. `window.confirm` foi descartado por não ser localizável nem consistente com a interface.

### Submissões enviadas permanecem sem ação destrutiva

O botão existirá somente no componente de cartão de rascunho. A aba de enviados não receberá callback de exclusão, reduzindo o risco de a operação aparecer por compartilhamento acidental de componentes.

## Risks / Trade-offs

- [As ações disponíveis podem mudar entre a consulta e o DELETE] → A API externa continua sendo a autoridade final; qualquer rejeição preserva o cartão e é comunicada sem simular sucesso.
- [Uma resposta bem-sucedida pode deixar escopos antigos na sessão externa] → A listagem local deixa de encontrar o processo, e uma nova sessão sincroniza os escopos; a exclusão não depende da remoção imediata do escopo para sua confirmação.
- [Falha de rede após a API concluir a exclusão] → A interface mantém o item e permite atualizar a lista, priorizando não declarar sucesso sem confirmação.

## Migration Plan

1. Publicar o frontend depois que `DELETE /processes/{id}` estiver disponível no ambiente alvo.
2. Validar com um rascunho próprio que ofereça `DELETE`, um processo sem essa ação e um processo pertencente a outro usuário.
3. Em rollback, remover o botão e o método DELETE interno; nenhum dado local ou migração de banco precisa ser revertido.
