## Why

A equipe BraCVAM precisa acompanhar todos os processos da plataforma e identificar rapidamente em que estado cada um se encontra. Uma visualização em Kanban concentra esse acompanhamento em um único espaço, enquanto o próprio fluxo do sistema continua sendo o único responsável pelas mudanças de estado.

## What Changes

- Adicionar uma página autenticada de Kanban para a equipe BraCVAM, com os processos agrupados em colunas conforme o estado informado pela API.
- Exibir em cada cartão a identificação essencial do processo e disponibilizar acesso aos seus detalhes sem carregar dados sensíveis desnecessários.
- Carregar todos os processos acessíveis, respeitando a paginação do serviço externo, e representar estados vazios, falhas e ausência de autorização.
- Manter o Kanban estritamente em modo de consulta, sem permitir que a equipe BraCVAM ou qualquer outra pessoa mova cartões ou altere estados pela interface.
- Atualizar o posicionamento dos cartões quando uma nova consulta informar que o fluxo do sistema alterou o estado do processo.
- Distribuir as colunas por toda a largura disponível do quadro, sem rolagem horizontal.
- Adicionar as rotas internas, serviços e tipos necessários, mantendo a URL da API externa e a credencial de sessão exclusivamente no servidor.
- Manter a change `add-dynamic-submission-forms` fora deste escopo.

## Capabilities

### New Capabilities

- `process-kanban`: consulta de todos os processos acessíveis e acompanhamento somente leitura de seus estados no Kanban da BraCVAM.

### Modified Capabilities

- `authenticated-navigation`: disponibilizar o acesso ao Kanban somente para pessoas autorizadas da BraCVAM e indicar o item ativo na navegação.

## Impact

- Nova página autenticada, componentes de quadro, coluna e cartão, tipos de domínio, serviço de processos e Route Handlers internos.
- Uso de `GET /processes`, atualmente paginado, para compor o quadro completo.
- Nenhuma operação de alteração de estado será adicionada: os cartões apenas refletem o valor de `status` retornado pela API.
