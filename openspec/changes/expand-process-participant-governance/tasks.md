## 1. Contratos e autorização

- [x] 1.1 Ler a documentação instalada do Next.js aplicável a páginas autenticadas, Route Handlers, cookies e downloads antes de alterar o código.
- [x] 1.2 Confrontar o OpenAPI atual com cargos, participantes, convites, histórico, conflitos, revogação e conclusão, registrando divergências externas.
- [x] 1.3 Mapear por tarefa e escopo quem pode atribuir, revogar, declarar conflito, concluir e consultar cada cargo.
- [ ] 1.4 Confirmar com sessões reais o acesso de patrocinador, grupo gestor, BraCVAM e ao menos um cargo técnico adicional.

## 2. Domínio e integração server-only

- [x] 2.1 Ampliar os tipos de participação para os doze cargos, histórico, conflitos, capacidades e estados da interface.
- [x] 2.2 Ampliar o serviço para criação direta, reenvio/revogação de convite, revogação de participante, conflito, conclusão e histórico paginado.
- [x] 2.3 Preservar status, `detail.code` e mensagem externa nas falhas sem expor cookie ou origem.
- [x] 2.4 Ampliar o autorizador por processo para leitura de todos os participantes locais e mutações dirigidas por tarefa.
- [x] 2.5 Criar Route Handlers internos para todas as consultas e mutações novas, validando UUIDs, cargos, laboratório e payloads.

## 3. Workspace de governança

- [x] 3.1 Evoluir a composição para seções dirigidas pelos cargos e tarefas atuais.
- [x] 3.2 Implementar atribuição direta por usuário quando autorizada e convite por e-mail nos demais casos.
- [x] 3.3 Implementar reenvio e revogação de convites com confirmação e reconciliação.
- [x] 3.4 Implementar revogação e substituição explícitas de participantes sem cascata por afiliação.
- [x] 3.5 Implementar declaração de conflito e indicadores de atividade, efetividade e conflito.
- [x] 3.6 Implementar conclusão explícita do cargo e apresentação de pendências.
- [x] 3.7 Criar a consulta paginada do histórico sem confundir evento histórico com estado atual.

## 4. Descoberta e administração

- [x] 4.1 Permitir que todos os papéis locais encontrem processos dos seus escopos conforme suas capacidades.
- [x] 4.2 Ampliar o Kanban e os detalhes para leitura da composição completa pela BraCVAM.
- [x] 4.3 Criar controles administrativos da BraCVAM para ajustes autorizados durante o processo.
- [ ] 4.4 Sinalizar afiliação removida com designação ainda ativa e oferecer tratamento explícito quando autorizado.

## 5. Internacionalização e verificação

- [x] 5.1 Adicionar simultaneamente a `pt-BR` e `en` cargos, ações, estados, confirmações, validações e nomes acessíveis.
- [ ] 5.2 Validar teclado, foco, telas estreitas, formulários preservados e anúncios de sucesso/erro.
- [ ] 5.3 Exercitar atribuição, convite, aceite, reenvio, revogação, conflito, substituição, conclusão e histórico com sessões reais.
- [ ] 5.4 Confirmar por rede que o navegador usa somente rotas internas e recebe os códigos externos sem credenciais.
- [x] 5.5 Executar `pnpm i18n:check`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `git diff --check` e validação OpenSpec estrita.
