## Purpose

Orientar cada pessoa na primeira utilização das tarefas principais de seu perfil com tutoriais localizados, acessíveis e ligados aos controles reais da plataforma.

## ADDED Requirements

### Requirement: Tutorial inicial por perfil

O sistema SHALL aguardar a entrada da pessoa no módulo correspondente antes de iniciar o tutorial: Submissões para Proponentes, Formulários para pessoas BraCVAM autorizadas a gerir formulários e Usuários para sessões com `users.read`. Nenhum tutorial MUST aparecer automaticamente na página inicial após a autenticação. Cada tutorial MUST ser independente e MUST NOT aparecer simultaneamente a outro tutorial.

O tutorial do Proponente SHALL orientar uma submissão desde a entrada em Submissões até o acompanhamento após o envio. O tutorial BraCVAM SHALL orientar a criação e configuração de um formulário dinâmico até sua publicação e, quando aplicável, associação ao fluxo de submissão. O tutorial de usuários SHALL apresentar busca, filtro de situação, contagem, tabela e ações disponíveis na listagem sem executar ações nem abrir diálogos.

O cartão Usuários em Configurações MUST oferecer uma ação explícita para iniciar ou rever o tutorial de gerenciamento de usuários. Uma sessão autorizada MUST iniciar o tutorial automaticamente na primeira entrada em Usuários, mesmo quando também tiver autorização para gerir Formulários.

#### Scenario: Proponente entra em Submissões

- **WHEN** uma pessoa com capacidade de proponente abre Submissões pela primeira vez
- **THEN** o tutorial de submissão começa e apresenta os passos para abrir Submissões, escolher o tipo, identificar o método, preencher ou salvar o formulário e enviar ou acompanhar a submissão

#### Scenario: Pessoa BraCVAM entra em Formulários

- **WHEN** uma pessoa autorizada da BraCVAM abre o módulo Formulários pela primeira vez
- **THEN** o tutorial de formulário dinâmico começa e conduz à gestão de formulários para apresentar a criação, organização de seções e campos, configuração de validações, pré-visualização e publicação/associação do formulário

#### Scenario: Sessão autorizada entra no diretório de usuários

- **WHEN** uma pessoa com permissão `users.read` abre Usuários pela primeira vez
- **THEN** o tutorial apresenta os filtros, a contagem, a tabela e a coluna de ações da listagem sem abrir perfis ou alterar contas

#### Scenario: Entrada na plataforma

- **WHEN** uma pessoa elegível entra na página inicial após autenticar
- **THEN** o sistema não inicia tutorial até que ela abra Submissões ou Formulários, conforme seu perfil

#### Scenario: Pessoa BraCVAM também possui capacidade de Proponente

- **WHEN** uma pessoa possui capacidades de Proponente e BraCVAM
- **THEN** o sistema inicia somente o tutorial BraCVAM de configuração de formulários e não oferece o tutorial de submissão

#### Scenario: Perfil sem capacidade do tutorial

- **WHEN** uma pessoa não possui a capacidade correspondente ao tutorial
- **THEN** o sistema não inicia nem revela etapas de área restrita daquele tutorial

### Requirement: Destaque visual progressivo

O tutorial SHALL destacar o controle relacionado à etapa atual e SHALL escurecer visualmente o restante da interface. O destaque MUST acompanhar o elemento durante rolagem e redimensionamento, trazer a orientação em um painel separado do alvo e permitir avançar e voltar entre etapas. O painel MUST permanecer dentro da viewport e MUST NOT cobrir o elemento destacado; quando houver espaço, deve usar uma posição lateral ou um canto livre. Etapas diferentes MUST usar alvos diferentes quando suas explicações apontarem para áreas diferentes. Mudanças de etapa MUST atualizar a rolagem e o destaque sem cintilação. O progresso MUST exibir a etapa atual e o total, por exemplo “1/5”. Ao iniciar ou retomar, o tour MUST abrir uma única vez o módulo correspondente; avançar ou voltar MUST somente trocar a etapa, sem recarregar nem navegar para outra página.

#### Scenario: Etapa em destaque

- **WHEN** o tutorial apresenta uma etapa
- **THEN** o controle correspondente permanece visualmente destacado, o restante da página fica escurecido e o painel mostra a orientação e o progresso

#### Scenario: Avançar e voltar

- **WHEN** a pessoa aciona Avançar ou Voltar
- **THEN** o destaque, a orientação e o contador são atualizados para a etapa correspondente

#### Scenario: Avançar sem atualizar a página

- **WHEN** a pessoa avança ou volta entre etapas do tutorial
- **THEN** o sistema mantém a página atual e atualiza somente o destaque, a explicação e o contador

#### Scenario: Abrir a configuração no tutorial BraCVAM

- **WHEN** a pessoa avança da apresentação do catálogo para a etapa de seções e campos
- **THEN** o sistema abre automaticamente um formulário existente em modo de consulta para apresentar sua configuração, sem exigir uma ação intermediária e sem salvar alterações

#### Scenario: Controle da etapa não está disponível

- **WHEN** uma permissão, estado da página ou largura de tela impede a apresentação do controle esperado
- **THEN** o tutorial oferece uma orientação alternativa ou permite pular a etapa sem bloquear a navegação

### Requirement: Conclusão e retomada dos tutoriais

O sistema SHALL oferecer ações visíveis para avançar, voltar, pular e concluir o tutorial. Ao concluir ou pular, MUST registrar separadamente o estado do tutorial de Proponente e o tutorial BraCVAM para a pessoa atual, evitando sua reapresentação automática em entradas futuras no mesmo navegador. Fechar ou interromper sem escolher pular ou concluir MUST pausar o tutorial sem reapresentá-lo ao recarregar a página. Um novo clique no item Submissões SHALL retomar o tutorial pausado do Proponente. O cartão do módulo Formulários MUST oferecer a ação Ver tutorial para retomar ou rever o roteiro BraCVAM.

#### Scenario: Tutorial concluído

- **WHEN** a pessoa chega à última etapa e conclui o tutorial
- **THEN** o sistema registra a conclusão para aquela pessoa e tarefa e não o inicia automaticamente de novo

#### Scenario: Tutorial pulado

- **WHEN** a pessoa escolhe Pular tutorial
- **THEN** o sistema registra a dispensa somente para aquele tutorial e não o reinicia automaticamente em acessos posteriores

#### Scenario: Tutorial interrompido

- **WHEN** a pessoa fecha ou abandona o tutorial sem concluí-lo nem pulá-lo
- **THEN** o sistema preserva a etapa, não reabre o tutorial ao recarregar e permite retomá-lo ao abrir novamente o módulo correspondente

#### Scenario: Retomar ou rever pelo cartão Formulários

- **WHEN** uma pessoa BraCVAM aciona Ver tutorial no cartão do módulo Formulários
- **THEN** o sistema abre Formulários e retoma a etapa pausada ou reinicia o roteiro já concluído

### Requirement: Acessibilidade e localização do tutorial

Todo conteúdo do tutorial SHALL estar disponível em português do Brasil e inglês por chaves semânticas. O tutorial MUST ser operável por teclado, manter foco visível, anunciar etapa e progresso a tecnologias assistivas, oferecer nomes acessíveis aos controles e respeitar a preferência por movimento reduzido. A camada de destaque MUST impedir que controles escurecidos recebam ações acidentais e MUST restaurar o foco de forma previsível ao concluir, pular ou interromper.

#### Scenario: Uso por teclado e leitor de tela

- **WHEN** uma pessoa opera o tutorial com teclado ou tecnologia assistiva
- **THEN** consegue identificar a etapa, seu progresso e todas as ações, navegar entre elas e retornar o foco ao contexto ao sair

#### Scenario: Conteúdo localizado

- **WHEN** a pessoa altera o idioma ativo
- **THEN** rótulos, instruções, contador, estados e mensagens do tutorial são apresentados no idioma escolhido

#### Scenario: Movimento reduzido

- **WHEN** o dispositivo solicita movimento reduzido
- **THEN** o tutorial mantém o destaque e a navegação sem animações não essenciais
