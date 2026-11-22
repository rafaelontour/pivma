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
- [x] 4.5 Implementar perfil visual próprio e determinístico para BraCVAM, Proponente, Administração e os doze cargos locais no shell autenticado.
- [x] 4.6 Adicionar ao grupo gestor as opções Grupo e Processos, listando integrantes por processo e a etapa atual dos processos associados.
- [x] 4.7 Substituir o Kanban do módulo efetivo Patrocinador por Acompanhamento, listar somente vínculos ativos `sponsor` com processo, proponente e data localizada da atribuição e criar o detalhe por estado/fase/atividade, bloqueando páginas operacionais sem inferir resultados ausentes.

## 5. Internacionalização e verificação

- [x] 5.1 Adicionar simultaneamente a `pt-BR` e `en` cargos, ações, estados, confirmações, validações e nomes acessíveis.
- [ ] 5.2 Validar teclado, foco, telas estreitas, formulários preservados e anúncios de sucesso/erro.
- [ ] 5.3 Exercitar atribuição, convite, aceite, reenvio, revogação, conflito, substituição, conclusão e histórico com sessões reais.
- [ ] 5.4 Confirmar por rede que o navegador usa somente rotas internas e recebe os códigos externos sem credenciais.
- [x] 5.5 Executar `pnpm i18n:check`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `git diff --check` e validação OpenSpec estrita.
- [x] 5.6 Validar paridade pt-BR/en, identificação sem depender somente de cor, lint, TypeScript, diff e OpenSpec para os perfis visuais.
- [x] 5.7 Corrigir a precedência visual para que grupo gestor e demais cargos locais não herdem o tema BraCVAM da conta.
- [x] 5.8 Validar navegação, autorização, traduções, tipos e apresentação de grupo e processos sem expor ações administrativas.
- [x] 5.9 Reservar o tema verde ao BraCVAM e manter o grupo gestor em laranja, validando contraste e consistência.
- [x] 5.10 Persistir o shell autenticado em layout compartilhado para que a navegação pelo menu substitua apenas o conteúdo e não consulte novamente a sessão.
- [x] 5.11 Padronizar BraCVAM em verde, Proponente em azul e Administração em roxo, distribuindo temas próprios para os demais cargos.
- [x] 5.12 Priorizar a identidade visual Administração sobre o papel auxiliar `proponent`, sem alterar associações técnicas ou permissões.
- [x] 5.13 Exibir Submissões para o módulo geral e Proponente, ocultando o item de Administração, BraCVAM e cargos associativos.
- [x] 5.14 Manter a identidade BraCVAM verde quando houver apenas capacidade administrativa técnica, exibindo um único tema efetivo por sessão.
- [x] 5.15 Priorizar perfis institucionais explícitos sobre o papel local `proponent`, sem esconder associações técnicas efetivas.
- [x] 5.16 Remover inferência de cargo por conta demo e resolver módulos somente por perfis e associações publicadas pela API.
- [x] 5.17 Aplicar uma cor por cargo associativo e exibir badges localizados, incluindo Módulo do lab. líder em ciano.
- [x] 5.18 Manter contas sem cargo no módulo geral cinza e reconciliar para o módulo Proponente azul após a primeira submissão.
- [x] 5.19 Renomear o perfil neutro de Acesso geral para Acesso padrão em português e inglês.
- [x] 5.20 Restringir o módulo efetivo Proponente a Início e Submissões, ocultar Designações, Processos e os demais itens e redirecionar acessos diretos a outras páginas autenticadas para `/inicio`, validando precedência de perfis, i18n, lint, tipos e OpenSpec.
- [x] 5.21 Restringir o módulo efetivo Grupo gestor a Início e Acompanhamento, renomear o item existente Grupo e bloquear acesso direto ao Kanban e às demais páginas autenticadas.
- [x] 5.22 Substituir o destino Abrir composição por Ver processo no acompanhamento do grupo gestor e apresentar uma página de consulta somente leitura.
