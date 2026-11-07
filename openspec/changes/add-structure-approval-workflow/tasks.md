## 1. Contrato e preparação

- [x] 1.1 Ler a documentação instalada do Next.js para página dinâmica, Route Handlers e formulários de decisão.
- [x] 1.2 Confirmar no OpenAPI painel, pontos, pendências, decisões, rejeições e respostas de avanço/reabertura.
- [x] 1.3 Mapear tipos de ponto a seus workspaces de correção sem fabricar destinos desconhecidos.
- [ ] 1.4 Validar leitura e decisão com sessões BraCVAM e a recusa de participantes sem autoridade.

## 2. Domínio e integração

- [x] 2.1 Criar tipos de painel, ponto, designação, contagens, pendência, decisão, ponto rejeitado e estados da interface.
- [x] 2.2 Implementar serviço server-only para consultar painel e registrar decisão.
- [x] 2.3 Criar Route Handlers internos validando processo, resultado, justificativa e pontos rejeitados.
- [x] 2.4 Preservar status, códigos e mensagens externas e normalizar estritamente o histórico.
- [x] 2.5 Criar autorização que permita leitura conforme escopo e decisão somente à BraCVAM.

## 3. Painel e decisões

- [x] 3.1 Criar painel de homologação no contexto de `/processos/[processId]`.
- [x] 3.2 Apresentar status, rodada, bloqueio, pontos, designações, amostras e pendências.
- [x] 3.3 Implementar histórico de decisões distinguindo rodadas e pontos rejeitados.
- [x] 3.4 Implementar diálogo acessível de aprovação com justificativa e confirmação.
- [x] 3.5 Implementar rejeição com seleção obrigatória de pontos e justificativa.
- [x] 3.6 Reconciliar painel, tarefas e processo após decisão sem repetir mutação aceita.
- [x] 3.7 Criar links de retomada para composição e amostras conforme atividades reabertas conhecidas.

## 4. Kanban, idiomas e verificação

- [x] 4.1 Refletir pendência, aprovação, rejeição e nova rodada nos detalhes do Kanban.
- [x] 4.2 Adicionar todos os textos, estados, decisões, validações e nomes acessíveis em português e inglês.
- [ ] 4.3 Validar teclado, foco, confirmação, layout estreito e histórico extenso.
- [ ] 4.4 Exercitar aprovação, rejeição pontual, reabertura, nova rodada, concorrência e negações contra a API.
- [x] 4.5 Confirmar que nenhuma decisão altera manualmente fase ou tarefa no cliente.
- [x] 4.6 Executar verificações de i18n, lint, TypeScript, build, diff e OpenSpec estrito.
