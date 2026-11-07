## 1. Contrato e roteiro

- [x] 1.1 Revisar a documentação local do Next.js 16 e os contratos atuais de perfil, escopos e permissões usados para identificar as duas capacidades.
- [x] 1.2 Definir cinco etapas para o tour de Proponente, cobrindo entrada em Submissões, escolha de tipo, identificação do método, formulário/rascunho e envio/acompanhamento.
- [ ] 1.3 Definir cinco etapas para o tour BraCVAM, cobrindo entrada em Formulários, criação, seções/campos, validações e pré-visualização/publicação.
- [x] 1.4 Escrever rótulos e instruções das etapas em pt-BR e inglês com chaves equivalentes.

## 2. Visita guiada e persistência

- [x] 2.1 Criar os tipos de roteiro, etapa, estado ativo e estado de conclusão em `types/`.
- [x] 2.2 Implementar overlay spotlight responsivo com fundo escurecido, painel compacto próximo ao alvo e contador etapa/total.
- [x] 2.3 Implementar controles acessíveis para avançar, voltar, pular, fechar e concluir; garantir que o tutorial não acione controles de negócio.
- [x] 2.4 Implementar navegação única para o módulo ao iniciar e recuperação quando o alvo ainda não estiver disponível, sem trocar de página ao avançar ou voltar.
- [x] 2.5 Persistir conclusão, pausa e etapa por usuário, identificador de tutorial e versão do roteiro; retomar Proponente pelo acesso a Submissões e oferecer repetição BraCVAM no cartão Formulários.
- [x] 2.6 Disparar cada tutorial somente na entrada do módulo correspondente, sem apresentá-lo na página inicial autenticada.

## 3. Alvos e integração dos roteiros

- [x] 3.1 Marcar os controles de Submissões e seu formulário com identificadores estáveis para as etapas do Proponente.
- [x] 3.2 Marcar os controles de gestão/criação de formulários dinâmicos com identificadores estáveis para as etapas BraCVAM.
- [x] 3.3 Garantir que cada etapa conduza à página correta sem criar processo, salvar resposta ou publicar formulário.

## 4. Verificação

- [ ] 4.1 Validar first-run para cada perfil, prioridade BraCVAM em usuários com capacidades combinadas, estado independente, retomada, pulo e conclusão.
- [ ] 4.2 Validar rolagem, mudança de rota, sidebar expandida/recolhida, viewport estreita, teclado, leitor de tela e movimento reduzido.
- [x] 4.3 Validar ambos os idiomas e executar `pnpm i18n:check`, `pnpm lint` e `pnpm exec tsc --noEmit`.

## 5. Tour do diretório de usuários e padrão de interação

- [x] 5.1 Documentar regras para alvos distintos, painel separado do destaque, rolagem bidirecional e fechamento de prévias ao voltar.
- [x] 5.2 Implementar tour de cinco etapas na listagem de usuários, condicionado à permissão `users.read`, com início na primeira entrada e atalho no cartão Usuários, sem executar ações de negócio.
- [x] 5.3 Adicionar alvos estáveis para busca, filtro, contagem, tabela e coluna de ações e textos equivalentes em pt-BR e en.
