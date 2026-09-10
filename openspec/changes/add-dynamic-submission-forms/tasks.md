## 1. Contrato e preparação

- [x] 1.1 Confirmar os contratos atuais de templates, criação de processo e formulário de atividade, além da documentação local do Next.js 16 aplicável.
- [x] 1.2 Delimitar no planejamento o fluxo de rascunho implementável e as dependências futuras de envio, anexos e renomeação do processo.

## 2. Domínio e integração protegida

- [x] 2.1 Criar em `types/` os contratos de templates, formulário dinâmico, valores, estados e propriedades da interface.
- [x] 2.2 Criar o serviço server-only de submissões para listar templates, criar processos, consultar o formulário inicial e salvar valores parciais.
- [x] 2.3 Criar Route Handlers internos que validem sessão, UUID, payloads e respostas externas sem expor URL ou credencial ao navegador.

## 3. Navegação e catálogo

- [x] 3.1 Adicionar Submissões ao shell autenticado com ícone, nome acessível e estado ativo nos modos expandido e recolhido.
- [x] 3.2 Criar `/submissoes` com catálogo responsivo de templates, nome, descrição e estados de carregamento, vazio, erro e nova tentativa.

## 4. Criação e edição do rascunho

- [x] 4.1 Criar uma única instância ao selecionar um template, usando `<template_key>-001`, e só abrir o formulário depois da persistência.
- [x] 4.2 Implementar popup acessível com os campos ordenados e controles para texto, área de texto, inteiro, decimal, booleano, seleção e data.
- [x] 4.3 Representar tipos desconhecidos e anexos sem fabricar valores incompatíveis com o contrato atual.
- [x] 4.4 Salvar os valores parciais, inclusive o nome pertencente ao formulário, pelo `PUT` interno, preservando a edição em caso de falha.
- [x] 4.5 Impedir edição de formulários já submetidos e manter o rascunho persistido ao fechar o popup.

## 5. Verificação

- [x] 5.1 Validar os estados do catálogo, prevenção de clique concorrente, criação antes da abertura, renderização dos tipos e salvamento do nome via `PUT`.
- [x] 5.2 Confirmar que o navegador consulta somente rotas internas e que fechar o popup não envia exclusão nem submissão final.
- [x] 5.3 Executar `pnpm lint`, `pnpm exec tsc --noEmit`, `git diff --check`, `openspec validate add-dynamic-submission-forms --strict` e `pnpm build`, registrando limitações ambientais separadamente.
  - As verificações foram repetidas após a inclusão da seleção de arquivo e todas passaram, inclusive o build de produção com Turbopack.

## 6. Salvamento explícito e retomada

- [x] 6.1 Criar a consulta server-only de processos `SUBMISSION`, filtrando-os pelos escopos locais com papel `proponent` antes de responder ao navegador.
- [x] 6.2 Expor a listagem de rascunhos em Route Handler interno com validação de sessão, paginação externa e respostas seguras.
- [x] 6.3 Adicionar Meus rascunhos à página, com estados de carregamento, vazio, erro, nova tentativa e ação Retomar edição.
- [x] 6.4 Ajustar as mensagens do popup para distinguir a instância técnica dos valores, que só são persistidos ao clicar em Salvar rascunho.
- [x] 6.5 Atualizar a lista após o salvamento e validar retomada, isolamento por proponente, ausência de salvamento automático, tipos, lint e OpenSpec.

## 7. Abas e exclusão confirmada

- [x] 7.1 Organizar Meus rascunhos e Nova submissão em abas acessíveis, mantendo estados e ações independentes.
- [x] 7.2 Criar a integração server-only e a rota interna `DELETE` com validação de UUID, sessão e escopo local `proponent`.
- [x] 7.3 Adicionar Excluir aos cartões e implementar modal de confirmação próprio com estados de envio e erro.
- [x] 7.4 Remover o cartão somente após sucesso e preservar a lista quando o backend não oferecer ou rejeitar a operação.
- [x] 7.5 Validar acessibilidade básica das abas/modal, ausência de confirmação nativa, tipos, lint, diff e OpenSpec, registrando a dependência externa.
  - A integração frontend está completa, mas o backend atual responde `405 Method Not Allowed` para `DELETE /processes/{id}`; até o endpoint existir, a confirmação informa a indisponibilidade e preserva o cartão.

## 8. Envio para análise

- [x] 8.1 Tipar o resultado da conclusão e criar a operação server-only que envia os valores atuais pelo `POST` do formulário.
- [x] 8.2 Expor o envio na rota interna com validação de UUID, sessão, payload, escopo `proponent` e erros seguros.
- [x] 8.3 Adicionar Enviar para análise ao lado de Salvar rascunho, compartilhando o bloqueio de operação e preservando a edição em falhas.
- [x] 8.4 Após sucesso, fechar o popup, atualizar Meus rascunhos e validar transição, ausência de `PUT` implícito, tipos, lint, diff e OpenSpec.
  - A referência textual de `file_upload` passou a ser incluída no envio final; a API atual continua sem armazenamento ou transporte binário de anexos.

## 9. Seleção de arquivo para conclusão

- [x] 9.1 Renderizar `file_upload` com um seletor acessível e aplicar as regras de extensão e tamanho publicadas pelo campo.
- [x] 9.2 Manter a referência selecionada no popup, omiti-la do `PUT` de rascunho e incluí-la no `POST` de conclusão.
- [x] 9.3 Impedir o envio quando um arquivo obrigatório não estiver selecionado e comunicar que a seleção não é persistida no rascunho.
- [x] 9.4 Validar tipos, lint, build, OpenSpec e integridade do diff.

## 10. Acompanhamento de submissões enviadas

- [x] 10.1 Criar a consulta server-only e a rota interna que listam todos os processos não `SUBMISSION` dos escopos `proponent` da sessão.
- [x] 10.2 Adicionar tipos e estado independente para a listagem de submissões enviadas.
- [x] 10.3 Adicionar a aba Submissões com estados de carregamento, vazio, erro, nova tentativa e cartões com código, título, tipo e estado atual.
- [x] 10.4 Após envio aceito, abrir Submissões e atualizar as listas de rascunhos e enviados.
- [x] 10.5 Validar isolamento por proponente, permanência em estados posteriores, acessibilidade das três abas, tipos, lint, build, OpenSpec e integridade do diff.
- [x] 10.6 Distribuir as três abas igualmente por toda a largura disponível da página e validar o ajuste.
- [x] 10.7 Remover o limite máximo centralizado da área de Submissões para ocupar toda a largura disponível no layout autenticado.
