## Why

Pessoas que entram pela primeira vez na plataforma precisam descobrir como realizar a tarefa principal do seu perfil sem depender de orientação externa. Tutoriais guiados com foco visual nos controles reais podem orientar proponentes no envio de uma submissão, a equipe BraCVAM na configuração de formulários dinâmicos e pessoas com acesso de leitura ao diretório na consulta e gestão de usuários.

## What Changes

- Apresentar o tutorial específico somente na primeira entrada no módulo correspondente: Submissões para Proponente e Formulários para pessoas BraCVAM autorizadas.
- Apresentar também um tutorial de gerenciamento de usuários na listagem para sessões com `users.read`.
- Guiar a sequência de ações com destaque progressivo no elemento em foco, fundo escurecido e contador de etapas como “1/5”.
- Permitir avançar, voltar, pular ou concluir o tutorial por controles acessíveis.
- Persistir a conclusão separadamente por pessoa e tipo de tutorial para não repetir em acessos posteriores.
- Tornar os tutoriais localizados e resilientes a diferentes larguras de tela, rolagem, navegação entre páginas e alterações na interface.

## Capabilities

### New Capabilities
- `role-guided-onboarding`: tutoriais iniciais, orientados pelo papel, com destaque de interface e progresso persistido.

### Modified Capabilities

## Impact

- Shell autenticado, entrada nas páginas de Submissões e Formulários e cartão do módulo Formulários em Configurações.
- Componentes de destaque guiado, estado de progresso e persistência de conclusão por pessoa e tutorial.
- Seletores estáveis nos controles destacados e texto de interface em pt-BR e inglês.
