## Context

Veja [proposal.md](./proposal.md) e a nova capability em [specs/role-guided-onboarding/spec.md](./specs/role-guided-onboarding/spec.md). O shell autenticado carrega usuário, permissões, perfis e escopos antes de renderizar a área privada. Os módulos de Submissões e Formulários vivem em rotas distintas; um tutorial pode, portanto, precisar navegar entre páginas. A plataforma já possui um hook de foco e teclado para diálogos, mas não há um componente de visita guiada nem estado persistido de tutoriais.

## Goals / Non-Goals

**Goals:**

- Mostrar somente o tutorial correspondente às capacidades autorizadas da sessão.
- Manter etapa, rota e alvo visual sincronizados durante navegação.
- Evitar efeitos de negócio enquanto a pessoa está conhecendo a interface.
- Registrar conclusão ou dispensa separadamente por conta e tutorial.

**Non-Goals:**

- Executar submissões, salvar formulários, publicar definições ou alterar dados durante a demonstração.
- Executar ações de negócio durante os tutoriais.
- Gravar dados de onboarding na API externa.

## Decisions

### Uma visita guiada comum com roteiros por capacidade

Implementar um único controlador e camada visual de visita guiada, enquanto cada tutorial mantém sua lista localizada de etapas e alvos. A capacidade será derivada da sessão já carregada: acesso ao fluxo de Submissões para Proponente e autorização existente de gestão de formulários para BraCVAM. Ao iniciar, o controlador abre `/submissoes` para Proponente ou `/formularios` para BraCVAM; todas as etapas do roteiro permanecem nessa rota, para que Avançar e Voltar não atualizem a página.

Alternativa considerada: codificar um componente independente em cada página. Isso duplica regras de foco, overlay, contador, persistência, navegação e tradução.

### Persistência local por conta, tutorial e versão

Guardar conclusão, dispensa, pausa e etapa em `localStorage` usando o identificador de usuário, código do tutorial e versão do roteiro. Fechar registra pausa e impede a reabertura em uma simples recarga. O clique em Submissões pode retomar o roteiro pausado do Proponente. O cartão Formulários oferece Ver tutorial para retomar ou reiniciar o roteiro BraCVAM. Incrementar a versão do roteiro somente quando uma revisão justificar reapresentar as etapas.

Alternativa considerada: chave global no navegador. Ela mistura contas diferentes usadas no mesmo equipamento e pode fazer uma pessoa deixar de receber seu tutorial.

### Overlay modal sem ações de negócio

Renderizar o spotlight em uma camada sobreposta ao conteúdo autenticado, escurecendo o restante da tela e deixando interativo somente o painel do tutorial. O foco fica no painel, que oferece Avançar, Voltar, Pular e Concluir. O tutorial BraCVAM pode abrir automaticamente o primeiro formulário existente em modo de consulta para tornar visíveis seções, campos e validações; essa abertura não salva nem publica alterações. A navegação entre etapas não submete formulários.

Alternativa considerada: exigir que a pessoa clique nos controles reais para avançar. Os botões em destaque podem criar rascunhos, salvar dados ou publicar formulários, efeitos que não devem ocorrer durante uma explicação.

### Iniciar na entrada do módulo correspondente

Depois de carregar `/api/auth/me`, aguardar a pessoa abrir o módulo de sua tarefa. O roteiro do Proponente começa em Submissões e o roteiro BraCVAM começa em Formulários; nenhum deles aparece na página inicial. A autorização para gerir formulários identifica a pessoa BraCVAM e seleciona exclusivamente o roteiro de configuração de formulários, mesmo que a sessão também exponha capacidade de Proponente. O cartão Formulários oferece a repetição explícita do roteiro BraCVAM.

Alternativa considerada: mostrar dois tours consecutivos automaticamente na primeira página após login. A pessoa pode não ter interesse imediato no segundo módulo e perder contexto da tela atual.

### Alvos resilientes e acessibilidade

Marcar os controles de cada etapa com seletores estáveis de visita guiada. Se o alvo não estiver montado no módulo, aguardar sua renderização por tempo limitado e então oferecer orientação alternativa ou pular a etapa. Usar portal para evitar recorte por `overflow`; posicionar o painel compacto ao lado de alvos estreitos e acima ou abaixo de alvos largos, sempre limitado à viewport. Prender/restaurar foco, anunciar o número da etapa, suportar teclado, rolagem, viewport estreita e preferência por movimento reduzido.

Alternativa considerada: identificar controles pelo texto visível ou posição da tela. Texto muda por idioma e layout muda com idioma, tamanho de tela e expansão do menu.

### Padrão para novos tutoriais

- Cada etapa deve apontar para um alvo estável e diferente quando a explicação mudar de área; não reutilizar um seletor apenas para manter o foco na mesma região.
- O painel explicativo deve ficar separado do destaque, em uma posição livre da viewport, com largura suficiente para leitura horizontal e sem cobrir o controle explicado.
- A mudança de etapa deve atualizar alvo, rolagem e painel como uma transição imediata. Evitar rolagem animada acompanhada por reposicionamento contínuo do painel, que causa cintilação.
- Na abertura inicial ou por atalho, aguardar o primeiro alvo da etapa atual estar montado antes de exibir o painel; isso evita mostrar uma posição provisória durante o carregamento da listagem.
- Se uma etapa abrir uma prévia ou editor, voltar para uma etapa anterior deve fechar essa prévia e restaurar a tela correspondente ao alvo anterior.
- Os roteiros devem funcionar nos dois sentidos. Ao voltar, restaurar a área de tela necessária para o alvo anterior; não depender apenas do fluxo de avanço.
- Alvos opcionais, como ações condicionadas por permissão, devem usar elementos sempre presentes da listagem ou apresentar fallback explícito.

O tour de gerenciamento de usuários aplica esse padrão na listagem: busca, filtro de situação, contagem, tabela e coluna de ações. Ele não abre diálogos nem executa ações sobre contas.

## Risks / Trade-offs

- [O armazenamento local pode ser apagado ou não sincroniza entre dispositivos] → Isolar a chave por conta e tutorial; tratar nova apresentação após limpeza como uma repetição segura do tutorial.
- [Mudanças nos controles podem invalidar um alvo] → Marcar os controles cobertos e validar alvos dos dois roteiros ao alterar as páginas.
- [O overlay pode prender a pessoa em uma página] → Sempre exibir Pular/Fechar e restaurar foco e rolagem ao sair.
- [A sessão pode ter permissões combinadas] → Priorizar exclusivamente o tutorial BraCVAM quando houver autorização para gerir formulários.
- [Inglês e português podem causar alvos com tamanhos diferentes] → Recalcular o retângulo após mudança de idioma, rolagem, redimensionamento e expansão da sidebar.
- [Uma etapa pode ser interpretada como ação a executar] → Não disparar mutações nem criar registros; limitar a abertura automática à consulta de um formulário existente no roteiro BraCVAM.

## Migration Plan

1. Adicionar os roteiros pt-BR/en com identificadores estáveis e alvos de interface para cada etapa.
2. Integrar o controlador de tour ao shell autenticado e selecionar o tutorial elegível após a sessão carregar.
3. Validar first-run, voltar, avançar, pular, fechar, concluir e retomada com persistência separada para as duas personas.
4. Se houver rollback, remover o ponto de entrada e o overlay; as chaves locais remanescentes podem ser ignoradas sem migração de dados.
