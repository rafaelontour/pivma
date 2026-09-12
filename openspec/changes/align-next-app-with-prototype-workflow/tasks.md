## 1. Preparação e contratos

- [x] 1.1 Reconciliar `add-dynamic-submission-forms` e `add-bracvam-process-kanban` com as specs principais, registrando o resultado das verificações manuais pendentes antes de arquivar ou sincronizar cada mudança
  - Specs de navegação, submissão dinâmica e Kanban sincronizadas sem arquivar as mudanças. As verificações manuais 6.1/6.2 do Kanban permanecem registradas como pendentes na mudança original e serão cobertas pelas tarefas 7.3 e 9.4 deste fluxo antes do arquivamento.
- [x] 1.2 Ler na documentação instalada do Next.js 16.3.3 os guias de Route Handlers, autenticação/cookies, componentes cliente-servidor e streaming antes de alterar essas áreas
- [x] 1.3 Inventariar cada ação e transição dos demos `users`, `forms`, `submission`, `triage`, `ai-pipeline` e `operational-index` e conferir seu contrato no OpenAPI publicado
- [x] 1.4 Criar a matriz de paridade ligando ação do demo, destino no Next.js, endpoint, perfil, entrada, resposta, erro e cenário de verificação
- [x] 1.5 Padronizar nas rotas internas a propagação segura de `401`, `403`, `404`, `409`, `422` e falhas transitórias sem converter rejeições em sucesso
- [x] 1.6 Auditar ao fim de cada fatia que nenhuma chamada do navegador contém a URL externa, cookie externo ou endpoint legado de avaliação imediata
  - A auditoria do primeiro corte confirmou que os componentes cliente usam somente `/api/*`; a checagem será repetida nas demais fatias e na tarefa 9.1.

## 2. Sessão e usuários

- [x] 2.1 Atualizar os tipos de usuário, cadastro, sessão e RBAC em `types/` para `full_name`, limites atuais e perfis em `access.profiles`
- [x] 2.2 Normalizar `/api/auth/me` e seus consumidores para nome completo, permissões efetivas, perfis aninhados e indicador administrativo sem quebrar login, perfil ou logout
- [x] 2.3 Adicionar e validar Nome completo no cadastro e encaminhar `full_name`, `username`, `email` e `password` pela rota interna
- [x] 2.4 Ajustar a grade responsiva do cadastro para acomodar nome completo sem ocultar validações nem criar rolagem desnecessária
- [x] 2.5 Ampliar serviço, Route Handler e tipos da listagem de usuários para busca, filtro ativo/inativo e perfis já embutidos
- [x] 2.6 Atualizar `/usuarios` com busca controlada, filtro de situação, estados vazio/erro e exibição de nome completo e perfis sem consulta N+1
- [x] 2.7 Implementar edição validada do nome completo com diálogo acessível, feedback Sonner e preservação do valor após falha
- [x] 2.8 Implementar criação de perfil customizado com catálogo de permissões, validação, Route Handler interno e aviso de que não há atribuição automática
- [ ] 2.9 Verificar cadastro, diretório, edição, criação de perfil, gestão individual e negações por autorização contra a API disponível
  - A compilação, o lint e as respostas negativas foram verificados; as credenciais semeadas dos demos retornam `401` na API publicada, portanto os cenários autenticados positivos aguardam uma sessão válida.

## 3. Fundação de formulários

- [x] 3.1 Criar em `types/` os contratos de template, formulário, seção, campo, regras, opções, associação de IA e estados do editor
- [x] 3.2 Implementar serviços server-only e Route Handlers internos para catálogo, detalhe e atualização de templates/formulários conforme o OpenAPI publicado
- [x] 3.3 Extrair do formulário de submissão os renderizadores e validadores reutilizáveis de campos sem mover tipos para componentes
- [x] 3.4 Implementar `/formularios` com catálogo, seleção, carregamento, estados vazio/erro e proteção pela autorização confirmada no backend
- [x] 3.5 Implementar edição de nome e descrição preservando chave técnica e substituindo o estado local somente pela resposta confirmada
- [x] 3.6 Implementar inclusão, edição, remoção e ordenação acessível de seções e campos, incluindo controles específicos por tipo
- [x] 3.7 Validar chaves únicas, tipos, opções, regras, referências e ordem e salvar a definição como uma unidade coerente
- [x] 3.8 Exibir associação e versão de IA por campo em modo somente leitura quando a sessão não puder gerenciá-las
- [ ] 3.9 Verificar gravação válida, rejeição com preservação local, chave duplicada, reordenação e negação de acesso contra o contrato publicado
  - Lint, build, conflito de rotas em `next dev` e respostas `401` das quatro rotas internas foram verificados. Gravação positiva e negação `403` aguardam uma sessão válida da API publicada.

## 4. Avaliações configuráveis por IA

- [x] 4.1 Criar em `types/` os contratos de avaliação, versão, critério, sugestão, teste, publicação, associação e erros do domínio
- [x] 4.2 Implementar serviços e Route Handlers internos de leitura com `ai_evaluations.read` e de mutação com `ai_evaluations.manage`
- [x] 4.3 Implementar `/avaliacoes-ia` com biblioteca pesquisável, estados de publicação, seleção, vazio e erro
- [x] 4.4 Implementar criação por nome e objetivo e edição do objetivo da versão em rascunho, mantendo o nome somente para leitura depois da criação e impedindo uso do rascunho em submissões
- [x] 4.5 Implementar sugestão de critérios como conteúdo editável e preservar critérios existentes quando a geração falhar
- [x] 4.6 Implementar edição e validação de descrição, severidade, polaridade e demais propriedades publicadas de cada critério
- [x] 4.7 Implementar teste isolado por conteúdo, exibindo resposta estruturada e metadados permitidos sem alterar processos reais
- [x] 4.8 Implementar confirmação de publicação, bloqueio da versão imutável e criação de novo rascunho para alterações posteriores
- [x] 4.9 Implementar associação em lote preservando ligações vigentes, aceitando somente versões publicadas e exigindo resolução explícita de órfãs
- [ ] 4.10 Verificar perfis leitura/gestão, sugestão, teste, versionamento, concorrência de associações e erros reais dos endpoints publicados
  - Contratos e respostas sem sessão foram verificados; os cenários positivos, a separação leitura/gestão e a concorrência aguardam sessões válidas com `ai_evaluations.read` e `ai_evaluations.manage`.

## 5. Submissão e pré-avaliação do proponente

- [x] 5.1 Ampliar em `types/` os estados de processo e contratos de pré-avaliação, evidência, correção e revisão humana direta
- [x] 5.2 Decompor o componente atual de submissões em catálogo, identificação, formulário, acompanhamento e resultado preservando abas, salvamento e retomada
- [x] 5.3 Substituir a criação com título automático pela etapa validada de título significativo antes do `POST` do processo
- [x] 5.4 Remover a ação, o diálogo e o Route Handler de exclusão de rascunho enquanto o backend não publicar o contrato
- [x] 5.5 Renderizar seções e campos na ordem definida e identificar campos com IA sem expor critérios administrativos ao proponente
- [x] 5.6 Implementar serviços, Route Handlers e controles de upload, download e remoção de anexos por campo, preservando os demais valores do rascunho
- [x] 5.7 Implementar serviço e Route Handler para consultar a pré-avaliação pelo endpoint publicado sem reintroduzir avaliação imediata
- [x] 5.8 Implementar acompanhamento com uma requisição em voo, cancelamento, pausa por visibilidade, atualização manual e reconsulta do processo
- [x] 5.9 Apresentar progresso e distinguir resultado positivo, negativo, falha técnica e submissão que seguiu sem IA
- [x] 5.10 Recolocar em Meus rascunhos o processo devolvido a `SUBMISSION`, exibindo pontos por campo/critério e permitindo corrigir, salvar e reenviar
- [x] 5.11 Implementar revisão humana direta com confirmação acessível, justificativa opcional, proteção contra duplicidade e reconsulta até `TRIAGE`
- [ ] 5.12 Verificar criação concorrente, anexos, salvamento explícito, envio, transições, polling, retorno para correção, reenvio e revisão direta contra a API atual
  - Lint, build, rotas internas e recusas sem sessão foram verificados; o ciclo positivo completo aguarda uma sessão de proponente e dados elegíveis na API publicada.

## 6. Triagem BraCVAM

- [x] 6.1 Criar em `types/` os contratos de fila, snapshot da proposta, revisão de campo, feedback de critério, decisão e timeline
- [x] 6.2 Implementar serviços e Route Handlers internos de triagem protegidos por `triage.review`, incluindo tratamento de conflito de estado
- [x] 6.3 Implementar `/triagem` com fila filtrável de processos `TRIAGE`, estados vazio/erro e seleção da proposta
- [x] 6.4 Apresentar seções e valores submetidos somente para leitura, com fallback legível para tipos ainda não especializados
- [x] 6.5 Apresentar relatório da IA por execução, versão, campo e critério e distinguir ausência de IA, resultado negativo e falha técnica
- [x] 6.6 Implementar gravação granular de `APPROVED`, `NEEDS_REVISION` e `REJECTED` por campo com comentário aplicável
- [x] 6.7 Implementar feedback concordante, discordante ou inconclusivo por critério sem modificar a evidência automática
- [x] 6.8 Implementar decisão final confirmada e reconsulta das transições para `PLANNING`, `SUBMISSION` ou `CLOSED`
- [x] 6.9 Implementar linha do tempo ordenada com transições, execuções, revisões, feedbacks e decisão conforme autorização
  - Contratos confrontados com o OpenAPI publicado em 11/09/2026; lint, build e recusa `401` nas cinco rotas internas foram verificados.
- [ ] 6.10 Verificar triagem parcial, retomada, três decisões finais, conflito concorrente, timeline e negação para sessão sem `triage.review`
  - A negação `401`, validações de entrada e a integração controlada foram verificadas; pareceres, conflito e os três desfechos aguardam uma sessão com `triage.review` e processos reais em `TRIAGE`.

## 7. Kanban e navegação

- [x] 7.1 Atualizar os tipos e a configuração do Kanban para `SUBMISSION`, `AI_PRE_EVALUATION`, `TRIAGE`, `PLANNING`, `CLOSED` e contingência desconhecida
- [x] 7.2 Proteger página, rota interna e item Processos com `triage.review` até existir uma permissão específica publicada
- [x] 7.3 Verificar que cada processo ocupa uma coluna, contagens permanecem corretas e estados desconhecidos não são descartados nem renomeados
  - O agrupamento usa uma correspondência exata por estado, mantém cada processo em uma única lista e preserva o valor original do estado na coluna de contingência; rota interna sem sessão confirmou `401`.
- [x] 7.4 Adicionar ao shell os destinos Formulários, Avaliações por IA, Triagem e Observabilidade conforme capacidades normalizadas
- [x] 7.5 Garantir estado ativo e rótulos acessíveis da navegação em sidebar aberta, recolhida e viewport móvel
  - Todos os links possuem `aria-label` e `aria-current`; a sidebar acompanha a mudança entre viewport móvel e desktop e permanece recolhível por teclado.
- [ ] 7.6 Verificar acesso direto e visibilidade do menu para proponente, leitor de IA, gestor de IA, triador e administrador
  - Em 11/09/2026, sessões reais confirmaram que o perfil oficial `Proponente` deve ver Início e Submissões, enquanto o perfil `Administrador` deve ver Início e os módulos administrativos autorizados, sem Submissões. O papel local `proponent` não pode decidir a navegação global porque também aparece na sessão administradora por participação em processos. A regra do shell foi corrigida e passou por lint, TypeScript e build; a matriz completa ainda aguarda sessões válidas dos perfis especializados de leitura/gestão de IA e triagem.

## 8. Observabilidade administrativa

- [x] 8.1 Ler o guia de streaming da versão instalada do Next.js e registrar a estratégia final de retransmissão e cancelamento de SSE
  - Estratégia: autorizar antes do primeiro chunk; abrir o upstream por Axios server-only com o `AbortSignal` da requisição; converter o stream Node em Web Stream; responder com `text/event-stream`, sem cache, transformação ou buffering; reconciliar o histórico no `open` posterior a uma desconexão.
- [x] 8.2 Criar em `types/` os contratos de evento operacional, execução, etapa, correlação, payload, filtros e estado de conexão
- [x] 8.3 Implementar serviços e Route Handlers internos para históricos operacionais e de IA com autorização administrativa, filtros e limites do backend
- [x] 8.4 Implementar proxies SSE internos para eventos operacionais e de IA com cabeçalhos corretos, propagação de abort e sem exposição da origem externa
- [x] 8.5 Implementar `/observabilidade/operacional` com filtros, histórico limitado, vazio, erro e indicador da conexão ao vivo
- [x] 8.6 Implementar `/observabilidade/ia` agrupando correlações e etapas com estado, duração, modelo, custo e consumo somente quando disponíveis
- [x] 8.7 Implementar inspeção recolhida de entrada, saída e erro como conteúdo textual/estruturado, sem renderização de HTML executável
- [x] 8.8 Deduplicar eventos por identificadores, reconciliar o histórico após reconexão e limitar o crescimento das listas em memória
  - Históricos e streams foram exercitados contra um upstream local aderente ao OpenAPI: filtros e respostas `200`, chunks, cabeçalhos SSE e encerramento por abort foram confirmados; nenhuma fixture foi incorporada ao produto.
- [ ] 8.9 Verificar filtros, reconexão, lacunas, atualização de etapas, encerramento do upstream e recusa sem transmissão para sessão não autorizada
  - Um upstream controlado confirmou filtros, histórico, chunks, cabeçalhos e encerramento por abort; as rotas sem sessão recusaram com `401` antes do stream. Reconexão e atualização contra o SSE publicado aguardam sessão administrativa válida.

## 9. Qualidade e liberação

- [x] 9.1 Auditar o código alterado para remover tipos locais, chamadas externas no cliente, credenciais de demo, `alert`, `prompt`, `confirm` e HTML inseguro
- [x] 9.2 Executar `pnpm lint` e corrigir todos os erros e avisos introduzidos
- [x] 9.3 Executar `pnpm build` e corrigir erros de TypeScript, fronteira cliente-servidor e geração das novas rotas
- [ ] 9.4 Executar roteiros responsivos e por teclado para cadastro, editores, popup de submissão, triagem, Kanban e observabilidade
  - A auditoria estática adicionou foco inicial, contenção de Tab, Escape e restauração de foco aos novos diálogos; o roteiro completo em navegador autenticado permanece pendente.
- [ ] 9.5 Repetir a comparação com o OpenAPI publicado e testar de ponta a ponta todos os fluxos autenticados contra a API atual
  - Em 11/09/2026 o OpenAPI permanece com 56 caminhos, 106 schemas e SHA-256 `6e2e1865cbbd375cc3303154da9d10e19131259a3c54980dee62c3247a548bac`, idêntico ao snapshot inicial. Os fluxos autenticados permanecem pendentes.
- [ ] 9.6 Preencher a matriz de paridade com evidência para cada ação dos seis módulos, mantendo como exclusão justificada apenas operações sem contrato, como excluir processo
  - A matriz mantém todas as ações e a única exclusão sem contrato; a promoção de cada linha a verificada depende das evidências autenticadas registradas nas tarefas 2.9, 3.9, 4.10, 5.12, 6.10, 7.6 e 8.9.
- [x] 9.7 Executar `openspec validate align-next-app-with-prototype-workflow --strict` e manter proposta, specs, design e tarefas coerentes com a implementação final
  - `pnpm lint`, `pnpm build` e a validação estrita passaram após a integração de triagem, Kanban, navegação e observabilidade.

## 10. Ocupação da área de conteúdo

- [x] 10.1 Remover os limites de largura por página do shell autenticado e permitir que o conteúdo variável preencha toda a largura e altura disponíveis
- [x] 10.2 Validar o ajuste compartilhado com lint, TypeScript e validação estrita da change
  - Lint, TypeScript, 17 testes automatizados e validação estrita passaram após a remoção dos limites de largura do shell.

## 11. Persistência da barra lateral

- [x] 11.1 Persistir a escolha de expandir ou recolher a barra lateral e restaurá-la após navegação ou atualização, mantendo o padrão responsivo quando não houver preferência
- [x] 11.2 Cobrir a restauração da preferência com teste automatizado e validar lint, TypeScript e a change
  - A preferência recolhida foi verificada após remontagem do shell; lint, TypeScript, 19 testes automatizados e validação estrita passaram.
