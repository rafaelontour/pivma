## 1. Contrato e preparação

- [x] 1.1 Consultar a documentação local do Next.js 16 aplicável a páginas autenticadas, Route Handlers e carregamento de dados antes de alterar o código.
- [x] 1.2 Confirmar `triage.review`, os ciclos de vida de processo, estados de tarefa e sinais de fase/atividade produzidos pelo fluxo, definindo as quatro macroetapas operacionais.

## 2. Shell da área autenticada

- [x] 2.1 Extrair header, sidebar, sessão e estrutura de conteúdo de `authenticated-home.tsx` para componentes reutilizáveis, mantendo as tipagens em `types/`.
- [x] 2.2 Migrar `/inicio` e `/usuarios` para o shell extraído sem alterar navegação, autorização, perfil, sidebar ou logout.
- [x] 2.3 Adicionar o item Processos à barra lateral com visibilidade por permissão, estado ativo e suporte aos modos expandido e recolhido.

## 3. Domínio e integração de processos

- [x] 3.1 Criar `types/Processo.ts` e `types/Kanban.ts` com os contratos de lista, detalhe, apresentação dos estados e estados da interface.
- [x] 3.2 Criar `services/Processo.ts` para listar páginas e consultar detalhes pela API externa.
- [x] 3.3 Criar Route Handlers internos somente de leitura para listar e consultar processos, validando sessão, paginação, UUID, autorização e respostas do serviço.
- [x] 3.4 Garantir que a credencial de sessão e a URL externa permaneçam exclusivamente no servidor.
- [x] 3.5 Adicionar tipos, serviço e Route Handler interno somente leitura para carregar todas as tarefas correntes visíveis.

## 4. Consulta e visualização do Kanban

- [x] 4.1 Criar a página autenticada `/processos` dentro de `app/(paginas)/` usando o shell compartilhado.
- [x] 4.2 Implementar a carga de todas as páginas de processos com estados explícitos de carregamento completo, vazio, acesso negado, erro e nova tentativa.
- [x] 4.3 Implementar as quatro macrocolunas, contagens e cartões com código, título, fase, atividade e subestado operacional, sem expor o ciclo de vida técnico.
- [x] 4.4 Adicionar a consulta acessível dos detalhes de um processo a partir de seu cartão, usando somente a rota interna correspondente.
- [x] 4.5 Distribuir todas as colunas fluidamente por toda a largura do quadro, sem rolagem horizontal, mantendo somente a rolagem vertical de cartões.
- [x] 4.6 Garantir que cartões e colunas não apresentem alças, cursores, atributos ou ações que sugiram alteração manual de estado.
- [x] 4.7 Sinalizar a responsabilidade da correção, bloquear somente Analisar quando a ação for do proponente e filtrar Em andamento por fase.
- [x] 4.8 Ocultar encerramento e motivo nos detalhes de processos não terminais.
- [x] 4.9 Reutilizar o workspace de triagem em modal de 85% da viewport, abrir diretamente o processo do cartão e remover Triagem da barra lateral.
- [x] 4.10 Omitir do Kanban processos cuja submissão inicial ainda esteja em rascunho.
- [x] 4.11 Fazer o modal de análise ocupar 85% reais da viewport, expandir o workspace interno e manter a decisão Aprovado/Correção/Reprovado visível.
- [x] 4.12 Corrigir o carregamento incorporado sob Strict Mode e transformar timeout em erro recuperável, evitando “Carregando proposta” infinito.

## 5. Sincronização do quadro

- [x] 5.1 Implementar revalidação periódica por snapshot completo, sem sobrepor ciclos de consulta e pausando o intervalo enquanto o documento estiver oculto.
- [x] 5.2 Reconciliar atomicamente processos e tarefas, recalculando a macroetapa após mudanças de ciclo de vida, fase, atividade, rodada ou responsabilidade.
- [x] 5.3 Preservar o último snapshot completo quando uma revalidação falhar, indicar que os dados podem estar desatualizados e oferecer atualização manual.
- [x] 5.4 Confirmar que o carregamento e a sincronização do Kanban não enviam nenhuma operação de alteração de estado à API.

## 6. Verificação

- [ ] 6.1 Validar manualmente autorização, quadro vazio, múltiplas páginas, quatro colunas lado a lado, detalhes condicionais, modal de triagem, subestados, bloqueio de análise e filtro de fase.
- [ ] 6.2 Validar reposicionamento automático após mudança de ciclo de vida, tarefa, fase ou responsável, além de inclusão, remoção, pausa com documento oculto e falha de revalidação.
- [x] 6.3 Confirmar por inspeção de rede que o navegador acessa somente rotas internas do Next.js e que nenhuma requisição tenta alterar o estado de um processo.
- [x] 6.4 Executar `pnpm lint`, `pnpm exec tsc --noEmit`, `git diff --check` e `pnpm build`, registrando separadamente qualquer limitação ambiental do build.

  Limitação ambiental: lint, TypeScript e `git diff --check` passaram. O `next build` chegou à compilação, mas o Turbopack falhou ao tentar abrir uma porta local durante o processamento de `app/globals.css` (`Operation not permitted`), inclusive após execução fora do sandbox.

## 7. Retomada após auditoria do contrato

- [x] 7.1 Alinhar `TriageDecisionResult`, o normalizador do serviço e o cliente com `process_status` e `return_review_run`, evitando falso erro depois que a API persistir uma decisão.
- [x] 7.2 Remover a expectativa de `PLANNING` e `SUBMISSION` em `process.status` e confirmar avanço ou retorno usando ciclo de vida, tarefas, fases e rodadas.
- [x] 7.3 Implementar tipos, serviço e Route Handlers internos para `GET/POST /processes/{id}/return-review`, incluindo `REVISE`, `CONTEST_AI` e `WITHDRAW`.
- [x] 7.4 Mostrar ao proponente a justificativa da decisão e `form.reviews` por campo, sem expor instruções ou regras internas da IA.
- [x] 7.5 Liberar correção e reenvio somente após `REVISE` e garantir que processos previamente enviados nunca recuperem a ação de exclusão de rascunho.
- [ ] 7.6 Validar de ponta a ponta aprovação, rejeição e `enviar → solicitar correção → revisar → corrigir → reenviar → reanalisar` contra a API integrada.

## 8. Histórico da submissão

- [x] 8.1 Substituir o histórico técnico no fim da análise por um botão Histórico no cabeçalho, abrindo uma linha do tempo acessível com eventos localizados, pontos conectados e pulso circular no evento mais recente.

## 9. Retorno do proponente

- [x] 9.1 Ampliar o modal de retorno para quase toda a viewport e separar avisos/decisão BraCVAM do formulário tabulado em colunas responsivas.
- [x] 9.2 Restringir a correção aos campos marcados como `NEEDS_REVISION` ou `REJECTED`, mantendo os demais visíveis e bloqueados.
- [x] 9.3 Fechar o modal após a confirmação de `REVISE`, atualizar as listas e selecionar Rascunhos para retomar a correção.
- [x] 9.4 Diferenciar o início da correção do reenvio efetivo e reconhecer uma nova triagem pronta como Correção recebida no Kanban.

## 10. Entrada em submissões

- [x] 10.1 Selecionar Nova submissão como a aba inicial ao carregar a página de submissões.
