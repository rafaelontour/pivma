## 1. Contratos e autorização

- [x] 1.1 Ler a documentação instalada do Next.js para Route Handlers autenticados, páginas dinâmicas e mutações.
- [x] 1.2 Confirmar no OpenAPI payloads e respostas de dispensa por fase e reabertura por atividade/laboratório.
- [x] 1.3 Identificar em tarefas e detalhes os campos confiáveis de fase, atividade, rodada e laboratório.
- [ ] 1.4 Validar com sessão BraCVAM as duas mutações e a recusa de sessões laboratoriais.

## 2. Domínio e integração

- [x] 2.1 Criar tipos de contexto laboratorial, dispensa, reabertura, entradas, respostas e estados de diálogo.
- [x] 2.2 Implementar serviços server-only para dispensa e reabertura preservando códigos externos.
- [x] 2.3 Criar autorizador administrativo e validar identificadores contra o snapshot do processo.
- [x] 2.4 Criar Route Handlers internos para as duas operações com justificativa obrigatória.
- [x] 2.5 Garantir que nenhuma rota aceite rodada, fase ou laboratório ausente ou divergente.

## 3. Controles no processo

- [x] 3.1 Apresentar contexto somente leitura das execuções laboratoriais nos detalhes do processo.
- [ ] 3.2 Implementar diálogo acessível de dispensa com fase, laboratório e justificativa.
- [ ] 3.3 Implementar diálogo acessível de reabertura com atividade, laboratório e motivo.
- [x] 3.4 Bloquear mutações concorrentes e tratar conflitos com reconsulta.
- [x] 3.5 Revalidar tarefas, processo e Kanban depois de cada operação aceita.
- [ ] 3.6 Preservar execuções anteriores e apresentar somente histórico publicado pela API.

## 4. Internacionalização e verificação

- [x] 4.1 Adicionar ações, contextos, confirmações, validações, erros e nomes acessíveis nos dois idiomas.
- [ ] 4.2 Validar teclado, foco, layout estreito, confirmação e estado desatualizado.
- [ ] 4.3 Exercitar dispensa, reabertura, concorrência, contexto divergente e negações contra a API.
- [ ] 4.4 Confirmar por rede que o navegador usa somente rotas internas e não altera tarefa diretamente.
- [x] 4.5 Executar verificações de i18n, lint, TypeScript, build, diff e OpenSpec estrito.
