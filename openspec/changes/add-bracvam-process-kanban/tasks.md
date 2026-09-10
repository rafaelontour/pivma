## 1. Contrato e preparação

- [x] 1.1 Consultar a documentação local do Next.js 16 aplicável a páginas autenticadas, Route Handlers e carregamento de dados antes de alterar o código.
- [ ] 1.2 Confirmar o código de permissão para leitura de processos e os valores de estado produzidos pelo fluxo, definindo seus rótulos e a ordem inicial de apresentação.

## 2. Shell da área autenticada

- [x] 2.1 Extrair header, sidebar, sessão e estrutura de conteúdo de `authenticated-home.tsx` para componentes reutilizáveis, mantendo as tipagens em `types/`.
- [x] 2.2 Migrar `/inicio` e `/usuarios` para o shell extraído sem alterar navegação, autorização, perfil, sidebar ou logout.
- [x] 2.3 Adicionar o item Processos à barra lateral com visibilidade por permissão, estado ativo e suporte aos modos expandido e recolhido.

## 3. Domínio e integração de processos

- [x] 3.1 Criar `types/Processo.ts` e `types/Kanban.ts` com os contratos de lista, detalhe, apresentação dos estados e estados da interface.
- [x] 3.2 Criar `services/Processo.ts` para listar páginas e consultar detalhes pela API externa.
- [x] 3.3 Criar Route Handlers internos somente de leitura para listar e consultar processos, validando sessão, paginação, UUID, autorização e respostas do serviço.
- [x] 3.4 Garantir que a credencial de sessão e a URL externa permaneçam exclusivamente no servidor.

## 4. Consulta e visualização do Kanban

- [x] 4.1 Criar a página autenticada `/processos` dentro de `app/(paginas)/` usando o shell compartilhado.
- [x] 4.2 Implementar a carga de todas as páginas de processos com estados explícitos de carregamento completo, vazio, acesso negado, erro e nova tentativa.
- [x] 4.3 Implementar quadro horizontal, colunas ordenadas, contagens e cartões com código, título, estado textual e tratamento visível de estados desconhecidos.
- [x] 4.4 Adicionar a consulta acessível dos detalhes de um processo a partir de seu cartão, usando somente a rota interna correspondente.
- [x] 4.5 Distribuir todas as colunas fluidamente por toda a largura do quadro, sem rolagem horizontal, mantendo somente a rolagem vertical de cartões.
- [x] 4.6 Garantir que cartões e colunas não apresentem alças, cursores, atributos ou ações que sugiram alteração manual de estado.

## 5. Sincronização do quadro

- [x] 5.1 Implementar revalidação periódica por snapshot completo, sem sobrepor ciclos de consulta e pausando o intervalo enquanto o documento estiver oculto.
- [x] 5.2 Reconciliar atomicamente mudanças de estado, processos novos e processos que deixaram de ser acessíveis, preservando a identidade dos cartões e atualizando as contagens.
- [x] 5.3 Preservar o último snapshot completo quando uma revalidação falhar, indicar que os dados podem estar desatualizados e oferecer atualização manual.
- [x] 5.4 Confirmar que o carregamento e a sincronização do Kanban não enviam nenhuma operação de alteração de estado à API.

## 6. Verificação

- [ ] 6.1 Validar manualmente autorização, quadro vazio, múltiplas páginas, estado desconhecido, detalhes e comportamento responsivo.
- [ ] 6.2 Validar reposicionamento automático após mudança de estado, inclusão e remoção de processos, pausa com documento oculto e falha de revalidação.
- [x] 6.3 Confirmar por inspeção de rede que o navegador acessa somente rotas internas do Next.js e que nenhuma requisição tenta alterar o estado de um processo.
- [x] 6.4 Executar `pnpm lint`, `pnpm exec tsc --noEmit`, `git diff --check` e `pnpm build`, registrando separadamente qualquer limitação ambiental do build.

  Limitação ambiental: lint, TypeScript e `git diff --check` passaram. O `next build` chegou à compilação, mas o Turbopack falhou ao tentar abrir uma porta local durante o processamento de `app/globals.css` (`Operation not permitted`), inclusive após execução fora do sandbox.
