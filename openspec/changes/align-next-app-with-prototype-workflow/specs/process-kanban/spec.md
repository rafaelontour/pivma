## MODIFIED Requirements

### Requirement: Organização dos processos por estado

O sistema SHALL representar o ciclo da primeira fase em colunas ordenadas para `SUBMISSION`, `AI_PRE_EVALUATION`, `TRIAGE`, `PLANNING` e `CLOSED`, com rótulos compreensíveis em português. Cada processo MUST aparecer em exatamente uma coluna correspondente ao estado atual e a quantidade de processos MUST permanecer visível no cabeçalho. Um estado novo ou não reconhecido MUST continuar visível numa coluna de contingência sem ter seu valor alterado.

#### Scenario: Rascunho ou correção está em submissão

- **WHEN** o quadro recebe um processo em `SUBMISSION`
- **THEN** o sistema o apresenta na coluna de elaboração ou correção pelo proponente

#### Scenario: Processo aguarda IA

- **WHEN** o quadro recebe um processo em `AI_PRE_EVALUATION`
- **THEN** o sistema o apresenta na coluna de pré-avaliação em andamento

#### Scenario: Processo entra em triagem

- **WHEN** o quadro recebe um processo em `TRIAGE`
- **THEN** o sistema o apresenta na coluna de triagem humana

#### Scenario: Processo é aprovado na triagem

- **WHEN** o quadro recebe um processo em `PLANNING`
- **THEN** o sistema o apresenta na coluna de planejamento

#### Scenario: Processo é encerrado

- **WHEN** o quadro recebe um processo em `CLOSED`
- **THEN** o sistema o apresenta na coluna de encerrados

#### Scenario: Estado não reconhecido

- **WHEN** o serviço retorna um processo em um estado diferente dos estados configurados
- **THEN** o sistema mantém o processo visível em uma coluna de estado não reconhecido e preserva o texto recebido

### Requirement: Proteção da integração do Kanban

O navegador MUST usar somente rotas internas da aplicação para consultar processos. A área administrativa do Kanban SHALL usar `triage.review` como capacidade de acesso da equipe BraCVAM até que o backend publique uma permissão mais específica para o quadro. A aplicação MUST manter a credencial de sessão e a URL da API externa no servidor e MUST tratar ausência de sessão e falta de autorização sem revelar dados dos processos.

#### Scenario: Integrante BraCVAM abre o Kanban

- **WHEN** uma sessão com `triage.review` solicita o quadro
- **THEN** o sistema permite consultar os processos acessíveis e exibe o item Processos na navegação

#### Scenario: Pessoa sem autorização abre o Kanban

- **WHEN** uma sessão sem `triage.review` tenta carregar o quadro administrativo
- **THEN** o sistema não apresenta cartões ou metadados de processos e comunica que o acesso não é permitido

#### Scenario: Consulta usa integração interna

- **WHEN** o quadro carrega ou revalida processos
- **THEN** o navegador consulta uma rota interna sem receber a URL externa ou a credencial de sessão
