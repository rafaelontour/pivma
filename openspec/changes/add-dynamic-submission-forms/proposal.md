## Why

O proponente precisa iniciar uma submissão a partir dos tipos de processo publicados pelo BraCVAM sem depender de uma tela fixa para cada método. O preenchimento deve ser persistido somente por uma ação explícita e os rascunhos do próprio proponente precisam permanecer acessíveis para retomada.

## What Changes

- Adicionar o item autenticado Submissões e uma página que apresente os templates ativos com nome, propósito e descrição.
- Criar tecnicamente uma instância de processo quando o proponente escolher um template, pois o backend só disponibiliza os campos depois dessa criação, usando um título automático no formato `<template_key>-001`.
- Abrir o formulário da atividade inicial em um popup, sem persistir os valores preenchidos automaticamente.
- Renderizar dinamicamente os campos suportados a partir da definição recebida da API e salvar valores parciais pelo endpoint de rascunho.
- Renderizar `file_upload` como seletor de arquivo, validar extensão e tamanho conforme `validation_rules` e enviar sua referência textual somente na submissão final, pois a API atual não publica transporte binário nem persistência de anexos em rascunho.
- Permitir enviar o formulário diretamente para análise por uma ação ao lado de Salvar rascunho, avançando o processo de `SUBMISSION` para `TRIAGE` quando o backend aceitar.
- Adicionar uma seção Meus rascunhos para listar processos `SUBMISSION` em que a pessoa autenticada possui o papel local `proponent` e permitir retomar a edição.
- Adicionar uma seção Submissões para manter visíveis os processos do proponente que já saíram de `SUBMISSION`, inclusive conforme avancem por estados posteriores.
- Organizar Meus rascunhos, Submissões e Nova submissão em abas para reduzir a rolagem vertical.
- Permitir solicitar a exclusão de um rascunho por um modal de confirmação próprio da interface, removendo-o da lista somente após confirmação do backend.
- Persistir o nome informado pelo proponente como um valor do formulário nesta etapa; a sincronização futura com `ProcessInstance.title` dependerá de uma operação específica do backend.
- Incluir as rotas internas e serviços necessários para que o navegador não acesse a API externa diretamente.

## Capabilities

### New Capabilities

- `dynamic-process-forms`: descoberta de templates, edição com salvamento explícito, listagem dos próprios rascunhos, acompanhamento das submissões enviadas e retomada de formulários definidos dinamicamente.

### Modified Capabilities

- `authenticated-navigation`: disponibilizar o acesso a Submissões para pessoas autenticadas que possam iniciar um processo como proponente.

## Impact

- Nova tela autenticada, popup de formulário, tipos de domínio, serviço de submissões e Route Handlers internos.
- Uso dos endpoints existentes de templates, criação e listagem de processos, sessão atual, consulta do formulário de atividade, salvamento de rascunho e envio final do formulário.
- A exclusão efetiva depende de um futuro `DELETE /processes/{id}` no backend; a integração frontend será preparada sem simular sucesso enquanto o contrato retornar método não permitido.
- Administração de templates, armazenamento binário de anexos e renomeação do título do processo permanecem fora desta entrega.
