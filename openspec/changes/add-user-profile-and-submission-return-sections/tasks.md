## 1. Contrato e rota interna de perfil

- [x] 1.1 Criar os tipos de perfil administrativo que representem dados de conta, cargos globais e participações locais, preservando campos ausentes como indisponíveis.
- [x] 1.2 Implementar a consulta server-side e a rota interna autorizada para o perfil, usando somente dados publicados pelos contratos atuais.
- [x] 1.3 Documentar no README os campos de perfil e histórico que continuam pendentes no backend.

## 2. Página de perfil de usuários

- [x] 2.1 Adicionar a ação de abrir perfil à listagem de usuários e criar a página de perfil protegida.
- [x] 2.2 Exibir dados de conta, cargos globais e cargos locais em seções localizadas, com estados de carregamento, vazio, erro e informação indisponível.
- [x] 2.3 Adicionar textos pt-BR e en, incluindo rótulos de papéis e formatação localizada de datas disponíveis.

## 3. Seções de submissões e correção

- [x] 3.1 Exibir descrições localizadas nas seções Enviados e Retornados pelo BraCVAM, mantendo badges circulares de contagem.
- [x] 3.2 Atualizar os estados de catálogo ao iniciar uma correção para mover a submissão de Retornados pelo BraCVAM para Rascunhos e sincronizar com o servidor.
- [x] 3.3 Confirmar que a classificação de devolução usa o sinal de triagem disponível e mantém a nomenclatura “pelo BraCVAM”.

## 4. Validação

- [x] 4.1 Executar `pnpm i18n:check`, `pnpm lint`, `pnpm exec tsc --noEmit` e `git diff --check`.
- [ ] 4.2 Validar manualmente a autorização da página de perfil e as transições entre Enviados, Retornados pelo BraCVAM e Rascunhos.
