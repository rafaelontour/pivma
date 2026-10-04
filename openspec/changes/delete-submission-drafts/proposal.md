## Why

A API piVMA agora publica `DELETE /processes/{id}`, eliminando a dependência que impedia o proponente de descartar rascunhos criados por engano ou que não serão concluídos. A interface deve expor essa operação sem permitir que submissões já enviadas sejam apagadas.

## What Changes

- Adicionar ao cartão de cada rascunho uma ação de exclusão com confirmação em modal próprio da aplicação.
- Criar uma Route Handler interna e um serviço server-only para encaminhar a exclusão ao novo endpoint da API externa.
- Autorizar a exclusão somente quando o usuário autenticado possuir papel local `proponent`, o formulário indicar `is_submitted: false` e a API indicar `DELETE` em `available_actions`.
- Remover o rascunho da tela apenas depois da resposta bem-sucedida da API e apresentar mensagens localizadas em caso de sucesso ou falha.
- Classificar rascunhos e enviados pelo sinal canônico `is_submitted` do formulário, mover imediatamente um envio para a aba Submissões, manter essa aba sem ação de exclusão e usar `available_actions` apenas como trava adicional no servidor.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `dynamic-process-forms`: efetivar a exclusão confirmada de rascunhos com o novo contrato da API e explicitar a proteção contra exclusão de submissões enviadas.

## Impact

- Interface e tipos da área `/submissoes`.
- Route Handler `/api/submissions/[processId]`.
- Serviços de processos/submissões que encapsulam a API externa.
- Dicionários `pt-BR` e `en` e validações de internacionalização.
- Integração com `DELETE /processes/{id}` da API piVMA.
