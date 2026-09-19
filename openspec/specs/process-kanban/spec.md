# process-kanban Specification

## Purpose

Permitir que a equipe BraCVAM acompanhe todos os processos acessíveis em um quadro único e somente leitura, organizado conforme os estados determinados pelo fluxo do sistema.

## Requirements

### Requirement: Carregamento completo do quadro

O sistema SHALL carregar todos os processos que a pessoa autenticada estiver autorizada a consultar, percorrendo a paginação do serviço até representar o conjunto completo no Kanban. Durante a carga, o sistema MUST comunicar o progresso sem apresentar um quadro parcialmente carregado como se estivesse completo.

#### Scenario: Processos ocupam mais de uma página

- **WHEN** o serviço informa que existem mais processos do que cabem em uma página
- **THEN** o sistema consulta as páginas restantes e apresenta todos os processos acessíveis no quadro

#### Scenario: Não existem processos acessíveis

- **WHEN** a consulta completa é concluída sem retornar processos
- **THEN** o sistema apresenta o quadro vazio com uma mensagem informativa e não trata o resultado como falha

#### Scenario: Consulta não pode ser concluída

- **WHEN** alguma etapa necessária para carregar o conjunto completo falha
- **THEN** o sistema não apresenta dados parciais como quadro completo e oferece uma ação para tentar novamente

### Requirement: Organização dos processos por estado

O sistema SHALL representar os estados do fluxo como colunas ordenadas e MUST colocar cada processo em exatamente uma coluna correspondente ao seu estado atual. A quantidade de processos de cada estado MUST permanecer visível no cabeçalho da respectiva coluna.

#### Scenario: Processo possui estado reconhecido

- **WHEN** o quadro recebe um processo cujo estado pertence ao fluxo configurado
- **THEN** o sistema apresenta o cartão na coluna correspondente e o inclui na contagem da coluna

#### Scenario: Estado não reconhecido

- **WHEN** o serviço retorna um processo com um estado que não pertence à configuração conhecida pelo quadro
- **THEN** o sistema mantém o processo visível em uma coluna de estado não reconhecido sem alterar o valor recebido

### Requirement: Identificação e consulta do processo

Cada cartão SHALL exibir pelo menos o código e o título do processo e MUST possuir uma ação acessível para consultar seus detalhes. O cartão MUST NOT depender somente de cor para comunicar o estado.

#### Scenario: Processo é apresentado no quadro

- **WHEN** uma coluna contém um processo
- **THEN** o cartão apresenta seu código e título e permite abrir a consulta do processo

#### Scenario: Navegação sem percepção de cores

- **WHEN** a pessoa consulta o quadro sem distinguir as cores das colunas
- **THEN** o texto e os nomes acessíveis continuam identificando o estado e o processo

### Requirement: Quadro sem rolagem horizontal

O Kanban SHALL distribuir todas as colunas configuradas por toda a largura horizontal disponível. O quadro MUST NOT criar rolagem lateral; as colunas MUST reduzir sua largura de forma fluida e preservar a rolagem vertical de seus cartões.

#### Scenario: Todas as colunas ocupam o quadro

- **WHEN** o Kanban é apresentado
- **THEN** todas as colunas dividem a largura disponível sem ultrapassar horizontalmente o contêiner

#### Scenario: Largura disponível diminui

- **WHEN** a área de conteúdo fica mais estreita
- **THEN** as colunas se comprimem proporcionalmente sem adicionar rolagem horizontal ao quadro

### Requirement: Kanban sem alteração manual de estado

O Kanban SHALL ser uma visualização somente leitura dos estados dos processos. O sistema MUST NOT oferecer drag-and-drop, seletor de estado ou qualquer outra ação que permita à equipe BraCVAM ou a outra pessoa alterar manualmente o estado de um processo pelo quadro.

#### Scenario: Pessoa interage com um cartão

- **WHEN** a pessoa aponta, toca, focaliza ou aciona um cartão
- **THEN** o sistema permite consultar o processo, mas não oferece uma operação para mudar seu estado

#### Scenario: Estado muda pelo fluxo do sistema

- **WHEN** uma atividade do fluxo altera o estado do processo na API
- **THEN** o Kanban não envia nenhuma solicitação adicional de alteração de estado

### Requirement: Sincronização dos estados exibidos

O sistema SHALL tratar o valor de estado retornado pela API como fonte de verdade e SHALL revalidar periodicamente o conjunto completo enquanto o quadro estiver visível. Quando uma revalidação concluída retornar um estado diferente, o sistema MUST reposicionar automaticamente o cartão na coluna correspondente e atualizar as contagens sem exigir ação manual.

#### Scenario: Processo avança no fluxo

- **WHEN** uma revalidação completa retorna um novo estado para um processo já exibido
- **THEN** o sistema move visualmente o cartão para a coluna do novo estado e atualiza as contagens afetadas

#### Scenario: Processo é criado ou deixa de ser acessível

- **WHEN** uma revalidação completa altera o conjunto de processos acessíveis
- **THEN** o sistema adiciona ou remove os cartões correspondentes e atualiza as contagens

#### Scenario: Revalidação falha

- **WHEN** não é possível concluir a atualização periódica do quadro
- **THEN** o sistema preserva o último conjunto completo, informa que os dados podem estar desatualizados e permite tentar novamente

### Requirement: Proteção da integração do Kanban

O navegador MUST usar somente rotas internas da aplicação para consultar processos. A aplicação MUST manter a credencial de sessão e a URL da API externa no servidor e MUST tratar ausência de sessão e falta de autorização sem revelar dados dos processos.

#### Scenario: Pessoa sem autorização abre o Kanban

- **WHEN** uma pessoa sem permissão para consultar processos tenta carregar o quadro
- **THEN** o sistema não apresenta cartões ou metadados administrativos e comunica que o acesso não é permitido

#### Scenario: Consulta usa integração interna

- **WHEN** o quadro carrega ou revalida os processos
- **THEN** o navegador consulta uma rota interna sem receber a URL externa ou a credencial de sessão
