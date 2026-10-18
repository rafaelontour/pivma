## Purpose

Permitir que a equipe BraCVAM e administradores mantenham o catálogo hierárquico de instituições e laboratórios usado nas afiliações e na composição dos processos da plataforma.

## ADDED Requirements

### Requirement: Consulta hierárquica do catálogo institucional

O sistema SHALL apresentar às pessoas autorizadas todas as instituições acessíveis e seus respectivos laboratórios. Cada item MUST identificar nome e situação ativa, e os laboratórios MUST permanecer associados visualmente à instituição retornada pela API.

#### Scenario: Catálogo preenchido

- **WHEN** a consulta completa retorna instituições e laboratórios
- **THEN** o sistema apresenta cada laboratório dentro de sua instituição com os respectivos estados

#### Scenario: Catálogo vazio

- **WHEN** não existem instituições cadastradas
- **THEN** o sistema apresenta um estado vazio e oferece a ação para cadastrar a primeira instituição

#### Scenario: Instituição sem laboratórios

- **WHEN** uma instituição ativa não possui laboratórios
- **THEN** o sistema mantém a instituição visível e informa que nenhum laboratório foi cadastrado nela

#### Scenario: Falha na consulta

- **WHEN** instituições ou laboratórios não podem ser carregados completamente
- **THEN** o sistema não apresenta um catálogo parcial como completo e oferece uma ação para tentar novamente

### Requirement: Cadastro de instituições

O sistema SHALL permitir que uma pessoa com `institutional.catalogs.manage` cadastre uma instituição informando um nome não vazio de até 255 caracteres. A instituição MUST ser persistida antes que a interface permita cadastrar laboratórios vinculados a ela.

#### Scenario: Instituição criada

- **WHEN** a pessoa confirma um nome válido e a API aceita o cadastro
- **THEN** o sistema inclui a instituição no catálogo e disponibiliza a criação de laboratórios nela

#### Scenario: Nome inválido

- **WHEN** o nome está vazio ou excede o limite publicado
- **THEN** o sistema não envia o cadastro e apresenta a validação aplicável

#### Scenario: Cadastro rejeitado

- **WHEN** a API rejeita a criação por duplicidade, conflito ou outra regra institucional
- **THEN** o sistema preserva o nome informado e apresenta uma mensagem segura sem simular sucesso

### Requirement: Cadastro de laboratórios em uma instituição

O sistema SHALL permitir cadastrar um laboratório informando um nome válido e selecionando uma instituição ativa. O pedido MUST conter o identificador da instituição escolhida e MUST NOT permitir laboratório sem instituição.

#### Scenario: Laboratório criado

- **WHEN** a pessoa seleciona uma instituição ativa, informa um nome válido e a API aceita o cadastro
- **THEN** o sistema apresenta o novo laboratório dentro da instituição selecionada

#### Scenario: Instituição não selecionada

- **WHEN** a pessoa tenta confirmar um laboratório sem instituição
- **THEN** o sistema não envia o cadastro e solicita a instituição obrigatória

#### Scenario: Instituição ficou indisponível

- **WHEN** a instituição selecionada foi desativada antes da confirmação
- **THEN** o sistema não apresenta sucesso e atualiza o catálogo para nova escolha

### Requirement: Renomeação de instituições e laboratórios

O sistema SHALL permitir renomear instituições e laboratórios ativos, preservando seus identificadores e vínculos. Uma falha MUST manter o valor persistido anterior e a entrada digitada disponível para correção.

#### Scenario: Instituição renomeada

- **WHEN** a pessoa confirma um novo nome válido para uma instituição e a API aceita a alteração
- **THEN** o sistema atualiza o nome exibido sem alterar seus laboratórios

#### Scenario: Laboratório renomeado

- **WHEN** a pessoa confirma um novo nome válido para um laboratório e a API aceita a alteração
- **THEN** o sistema atualiza o nome exibido mantendo a instituição associada

#### Scenario: Renomeação rejeitada

- **WHEN** a API rejeita a alteração
- **THEN** o sistema mantém o nome persistido no catálogo e permite revisar a entrada

### Requirement: Desativação confirmada

O sistema SHALL permitir desativar instituições e laboratórios por confirmação explícita. A interface MUST comunicar que a operação retira o item do uso futuro, MUST NOT tratá-la como exclusão física e MUST NOT oferecer reativação enquanto o contrato externo não publicar essa operação.

#### Scenario: Laboratório desativado

- **WHEN** a pessoa confirma a desativação de um laboratório e a API conclui a operação
- **THEN** o sistema atualiza o catálogo e impede o uso do laboratório em novos vínculos

#### Scenario: Instituição desativada

- **WHEN** a pessoa confirma a desativação de uma instituição e a API conclui a operação
- **THEN** o sistema atualiza o catálogo conforme a resposta autoritativa sem enviar desativações adicionais em cascata

#### Scenario: Desativação cancelada

- **WHEN** a pessoa cancela ou fecha a confirmação
- **THEN** o sistema não envia a operação e mantém o catálogo inalterado

#### Scenario: Desativação rejeitada por dependência

- **WHEN** a API recusa a desativação por laboratórios, afiliações ou processos dependentes
- **THEN** o sistema mantém o item ativo e apresenta a falha segura sem alterar dependências localmente

### Requirement: Autorização e integração protegida

O sistema MUST restringir todas as mutações do catálogo a sessões com `institutional.catalogs.manage`. O navegador MUST usar somente Route Handlers internos, mantendo a URL externa e a credencial de sessão no servidor.

#### Scenario: Sessão sem permissão de gestão

- **WHEN** uma pessoa sem `institutional.catalogs.manage` acessa diretamente o módulo ou solicita uma mutação
- **THEN** o sistema não apresenta dados protegidos nem executa a operação

#### Scenario: Sessão ausente

- **WHEN** uma operação é solicitada sem sessão válida
- **THEN** o sistema exige nova autenticação sem revelar o catálogo

#### Scenario: Integração interna

- **WHEN** a interface consulta ou altera instituições e laboratórios
- **THEN** o navegador acessa uma rota interna sem receber a origem externa ou o cookie da API

### Requirement: Conteúdo localizado e dados institucionais preservados

Todo texto controlado pela aplicação no módulo MUST existir em português do Brasil e inglês e respeitar o locale ativo. Nomes de instituições e laboratórios recebidos ou informados por pessoas MUST permanecer inalterados e MUST NOT ser traduzidos automaticamente.

#### Scenario: Troca de idioma

- **WHEN** a pessoa alterna o idioma no módulo
- **THEN** títulos, ações, validações, confirmações, estados e erros mudam de locale sem modificar nomes cadastrados

