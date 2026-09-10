## Context

O backend atual expõe templates ativos, cria e lista instâncias de processo, e associa o formulário dinâmico à atividade `proposal_submission`. Os campos só podem ser consultados depois da criação da instância. O salvamento parcial aceita apenas chaves pertencentes à definição do formulário e não aceita anexos nesta etapa.

A listagem externa de processos não é limitada por proprietário, mas `/auth/me` informa os escopos locais de cada processo. Qualquer pessoa autenticada aceita pelo endpoint de criação recebe a designação local de proponente no processo criado.

## Goals / Non-Goals

**Goals:**

- Criar a instância exigida pelo backend antes de apresentar o formulário, sem salvar automaticamente os valores digitados.
- Renderizar os tipos de campo suportados sem acoplar a página a um template específico.
- Listar e reabrir somente processos associados ao papel local `proponent` da sessão.
- Manter visíveis as submissões do proponente depois que deixarem o estado de rascunho.
- Alternar entre rascunhos, submissões enviadas e templates sem empilhar as coleções verticalmente.
- Preparar uma exclusão confirmada que nunca esconda o rascunho antes do sucesso externo.
- Permitir que o proponente envie os valores atuais diretamente para análise.
- Manter cookie e URL externa no servidor.
- Preservar valores digitados quando o salvamento falhar.

**Non-Goals:**

- Administrar ou versionar templates.
- Armazenar ou transmitir o conteúdo binário de arquivos sem um contrato de anexos.
- Renomear `ProcessInstance.title`; o nome preenchido permanece como valor do formulário até existir uma operação própria.

## Decisions

### Criação do processo antes da abertura do popup

Selecionar um template chamará a rota interna de criação com o título `<template_key>-001`. Somente depois de receber a instância persistida a interface consultará o formulário e abrirá o popup. O cartão ficará temporariamente desabilitado para evitar duplicidade por cliques concorrentes. Essa criação não enviará valores do formulário; eles permanecerão no estado local até Salvar rascunho.

Alternativa considerada: abrir uma prévia antes de criar. O contrato de template não contém a definição completa dos campos da instância, portanto essa prévia exigiria outro endpoint ou duplicação de conhecimento no frontend.

### Rascunhos filtrados pelos escopos da sessão

A rota interna consultará a sessão atual e extrairá os `process_id` cujos escopos contenham o papel `proponent`. Em seguida, consultará os processos `SUBMISSION`, percorrendo a paginação necessária, e retornará apenas a interseção. A interface nunca receberá os processos de outras pessoas.

Alternativa considerada: filtrar somente no componente cliente. Isso enviaria dados alheios ao navegador. Também foi descartado assumir que a listagem externa já é pessoal, pois o endpoint atual retorna processos globalmente.

### Submissões enviadas filtradas pelos escopos da sessão

A rota interna de submissões enviadas extrairá os `process_id` com papel `proponent`, percorrerá a listagem paginada de processos e retornará apenas a interseção cujo estado seja diferente de `SUBMISSION`. Não será fixada uma lista de estados posteriores: processos em triagem, avaliação ou encerrados continuarão disponíveis conforme o fluxo evoluir.

Alternativa considerada: consultar apenas `TRIAGE`. Isso faria a submissão desaparecer quando avançasse para outra etapa, contrariando o acompanhamento histórico do proponente.

### Abas controladas no componente cliente

A página manterá a aba ativa localmente e usará semântica `tablist`, `tab` e `tabpanel`. Meus rascunhos será a aba inicial, seguido de Submissões e Nova submissão; cada painel permanecerá independente quanto aos estados de carregamento e erro. Após um envio aceito, a interface abrirá Submissões e atualizará tanto essa lista quanto Meus rascunhos.

Alternativa considerada: criar duas rotas. Isso acrescentaria navegação e páginas sem necessidade para duas coleções pequenas do mesmo fluxo.

### Exclusão protegida e dependente do backend

O botão Excluir abrirá um modal construído com React. Após confirmação, o navegador chamará uma rota interna parametrizada. Essa rota validará UUID, sessão e o papel `proponent` no escopo do processo antes de encaminhar `DELETE /processes/{id}`. O cartão só será removido após resposta externa bem-sucedida.

O backend atual ainda não expõe esse `DELETE`; enquanto retornar método não permitido, o modal apresentará erro e manterá o rascunho. A exclusão real será desbloqueada sem mudança adicional no cliente quando o contrato externo for publicado.

Alternativa considerada: remover apenas do estado local. Isso deixaria o processo persistido e faria o rascunho reaparecer, simulando uma exclusão que não ocorreu.

### Atividade inicial fixa no servidor

As rotas internas usarão `proposal_submission` como atividade inicial desta entrega. O cliente não poderá escolher livremente um caminho externo de atividade. A constante ficará na camada de integração para ser substituída quando o backend publicar explicitamente a atividade inicial de cada template.

Alternativa considerada: receber `activity_key` do navegador. Isso amplia a superfície sem que o catálogo atual informe qual atividade deve ser usada.

### Renderizador orientado por dados

O popup escolherá o controle conforme `field_type` e enviará um mapa `field_key -> value`. Texto, área de texto, inteiro, decimal, booleano, seleção, data e `file_upload` terão controles próprios. O seletor de arquivo aplicará `allowed_extensions` e `max_size_mb` quando publicados em `validation_rules`.

Como o OpenAPI atual aceita apenas JSON e não publica endpoint de upload, o controle manterá o arquivo selecionado somente na sessão do popup. O `PUT` de rascunho continuará omitindo `file_upload`; o `POST` final enviará a referência textual do arquivo, compatível com o valor dinâmico aceito pelo contrato atual. A interface informará que o anexo não fica salvo no rascunho. Tipos desconhecidos continuarão indisponíveis sem fabricar valores.

Alternativa considerada: criar um componente específico para o único template atual. Isso impediria que novos templates publicados aparecessem sem nova versão do frontend.

### Nome salvo como valor do formulário

O `PUT` existente será usado para persistir todos os valores parciais, incluindo o campo de nome definido pelo template. O título do processo continuará automático nesta entrega. Uma futura operação de atualização do processo poderá sincronizar o título sem alterar o contrato do rascunho.

Alternativa considerada: enviar `title` no `PUT` do formulário. O backend rejeita chaves que não façam parte da definição, e o endpoint não atualiza `ProcessInstance`.

### Salvamento e envio como ações distintas

O rodapé do popup apresentará Salvar rascunho e Enviar para análise lado a lado. O primeiro continuará usando `PUT`; o segundo usará `POST` com o mesmo mapa de valores atualmente visível. Um único estado de operação bloqueará os dois botões para impedir concorrência.

Após sucesso do `POST`, o backend marca o formulário como submetido e muda o processo para `TRIAGE`; a interface fechará o popup e recarregará Meus rascunhos. Em `422` ou outra falha, manterá os valores locais e o popup aberto.

Alternativa considerada: salvar por `PUT` antes de enviar. O `POST` já persiste os valores finais de forma atômica, então duas mutações aumentariam a chance de estado parcial.

### Integração exclusivamente por Route Handlers

Serviços marcados como server-only encapsularão Axios e validarão as respostas externas. Route Handlers validarão sessão, UUID, payloads e códigos de erro antes de responder ao componente cliente.

Alternativa considerada: chamar a API diretamente no popup. Isso exporia a origem externa e quebraria o limite arquitetural já usado pelo projeto.

## Risks / Trade-offs

- [Fechar sem salvar mantém uma instância técnica vazia] → Não prometer que valores não salvos serão preservados; manter a instância disponível em Meus rascunhos porque o backend não oferece descarte seguro nesta etapa.
- [A listagem externa contém processos de todas as pessoas] → Fazer a interseção no servidor com os escopos `proponent` de `/auth/me` antes de responder ao navegador.
- [Muitos processos exigem múltiplas páginas externas] → Percorrer a paginação no servidor até cobrir os identificadores proponentes ou o total disponível.
- [Todos os títulos automáticos usam o sufixo `001`] → Aceitar duplicidade temporária porque o backend já fornece um código único; delegar numeração e renomeação definitivas ao contrato futuro.
- [O template atual exige anexo e não existe armazenamento binário] → Permitir selecionar e validar o arquivo, enviar sua referência textual somente na conclusão e informar que a seleção não fica salva no rascunho.
- [A atividade inicial pode variar entre templates futuros] → Manter a constante isolada no servidor e substituir por metadado contratual quando existir.
- [O backend não publica capacidade global de proponente] → Mostrar Submissões a sessões autenticadas aceitas pelo endpoint; manter a autorização efetiva no backend.
- [O backend ainda não possui exclusão de processo] → Manter confirmação e integração preparadas, preservar o cartão em qualquer falha e registrar a dependência de `DELETE /processes/{id}`.

## Migration Plan

1. Publicar as rotas internas de consulta e rascunho sem alterar endpoints existentes.
2. Adicionar Submissões à navegação autenticada e disponibilizar o catálogo.
3. Habilitar o popup e o salvamento parcial explícito para os tipos suportados.
4. Disponibilizar Meus rascunhos e a retomada da edição.
5. Organizar a página em abas e disponibilizar a confirmação de exclusão.
6. Disponibilizar o envio direto para análise no formulário.
7. Manter as submissões enviadas acessíveis em uma aba própria.
8. Em rollback, remover o item e as novas rotas; os processos permanecem preservados no backend.
