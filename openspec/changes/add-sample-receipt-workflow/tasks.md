## 1. Contrato e isolamento

- [x] 1.1 Ler a documentação instalada do Next.js para Route Handlers, multipart, downloads e páginas autenticadas.
- [x] 1.2 Confirmar contratos de frascos, check, recebimento, fotos, não conformidades e decisões no OpenAPI.
- [x] 1.3 Mapear o escopo de laboratório exigido em cada operação e os campos que nunca podem chegar ao navegador.
- [ ] 1.4 Validar respostas com sessões de dois laboratórios e registrar qualquer isolamento incompatível como dependência externa.

## 2. Tipos e integração server-only

- [x] 2.1 Criar tipos de frasco, check, recebimento, foto, não conformidade, decisão, capacidades e estados.
- [x] 2.2 Implementar serviço server-only para listar frascos, verificar código e registrar recebimento.
- [x] 2.3 Implementar upload e consulta protegida das fotos.
- [x] 2.4 Implementar listagem e decisão de não conformidades.
- [x] 2.5 Criar autorizador que derive processo e laboratório da sessão e rejeite contexto divergente.
- [x] 2.6 Criar Route Handlers internos com allowlist de resposta e preservação dos códigos externos.

## 3. Workspace de recebimento

- [x] 3.1 Criar `/processos/[processId]/recebimento-amostras` no shell autenticado.
- [x] 3.2 Implementar lista de frascos e estados com carregamento, vazio, erro, acesso negado e atualização.
- [x] 3.3 Implementar entrada e verificação não mutável de código.
- [x] 3.4 Implementar formulário de recebimento com validação e bloqueio de duplicidade concorrente.
- [x] 3.5 Implementar seleção, preview seguro, upload e consulta de fotos.
- [x] 3.6 Implementar painel de não conformidades e diálogo de decisão.
- [x] 3.7 Reconciliar o snapshot após mutações sem repetir POST aceito.

## 4. Navegação, sigilo e verificação

- [x] 4.1 Adicionar acesso contextual somente para tarefas e escopos laboratoriais aplicáveis.
- [x] 4.2 Auditar payloads do navegador para ausência de classificação e relação código-substância.
- [x] 4.3 Adicionar textos, estados, validações, decisões e nomes acessíveis em `pt-BR` e `en`.
- [ ] 4.4 Validar teclado, foco, câmera/arquivo móvel, layout estreito e preservação de entrada.
- [ ] 4.5 Exercitar check, recebimento, duplicidade, fotos, não conformidade, decisão e isolamento contra a API.
- [x] 4.6 Executar verificações de i18n, lint, TypeScript, build, diff e OpenSpec estrito.
