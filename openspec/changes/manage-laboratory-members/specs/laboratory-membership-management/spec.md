## Purpose

Permitir que sessões BraCVAM autorizadas adicionem contas existentes a laboratórios ativos diretamente no catálogo institucional.

## ADDED Requirements

### Requirement: Adicionar pessoa pela listagem de laboratórios
O sistema SHALL oferecer uma ação para adicionar uma pessoa na linha de cada laboratório ativo para sessões com `institutional.affiliations.manage`, `users.read` e `institutional.read`. A interface SHALL permitir buscar contas ativas exclusivamente pelo nome completo e selecionar uma conta existente. A busca nominal MUST desconsiderar diferenças de caixa e acentuação e MUST NOT usar nome de usuário ou e-mail como critério. Cada mutação MUST repetir a autorização no servidor.

#### Scenario: Sessão autorizada adiciona conta ativa
- **WHEN** uma pessoa autorizada busca uma conta ativa, seleciona um resultado e confirma a inclusão em um laboratório ativo
- **THEN** o sistema cria a afiliação e confirma qual pessoa foi adicionada ao laboratório

#### Scenario: Conta inativa
- **WHEN** uma conta selecionada está inativa no momento da criação
- **THEN** o servidor recusa a operação e não cria uma afiliação

#### Scenario: Laboratório ou instituição inativos
- **WHEN** o laboratório não existe, está inativo ou sua instituição está inativa
- **THEN** o servidor recusa a operação sem enviar uma criação inválida à API

#### Scenario: Vínculo já existente
- **WHEN** a API informa conflito porque já existe um vínculo ativo entre a conta e o laboratório
- **THEN** a interface apresenta uma mensagem localizada e não repete a criação automaticamente

### Requirement: Autorização e proteção da integração
O navegador MUST acessar somente rotas internas. O Route Handler SHALL exigir `institutional.affiliations.manage`, `users.read` e `institutional.read`, validar os identificadores e derivar `institution_id` do laboratório encontrado no catálogo. Credenciais e chamadas à API externa MUST permanecer no servidor.

#### Scenario: Sessão sem permissão
- **WHEN** uma sessão sem qualquer permissão exigida tenta buscar contas ou criar uma afiliação
- **THEN** o servidor recusa a operação sem expor credenciais ou permitir a mutação

#### Scenario: Inclusão bem-sucedida
- **WHEN** o servidor valida a conta e o laboratório ativos
- **THEN** envia à API externa os identificadores da conta, instituição e laboratório correspondentes

### Requirement: Não inferir membros a partir de buscas em contas
O sistema MUST NOT percorrer o diretório de contas nem consultar afiliações de cada pessoa para compor membros de um laboratório. Enquanto a API não oferecer uma listagem inversa, a página SHALL limitar-se a permitir a inclusão e confirmar o resultado.

#### Scenario: Abrir o catálogo
- **WHEN** uma pessoa consulta a listagem de instituições e laboratórios
- **THEN** o sistema não realiza chamadas N+1 para determinar membros

### Requirement: Internacionalização e acessibilidade
Todo texto controlado pela interface MUST existir em português do Brasil e inglês. O diálogo SHALL oferecer rótulos acessíveis, busca por teclado, seleção inequívoca de conta, mensagens de carregamento e erro, foco inicial e Escape.

O diálogo SHALL identificar o laboratório, separar visualmente busca, resultados e ações, e apresentar estados distintos antes da busca, durante o carregamento e quando não houver correspondências.

#### Scenario: Alternar idioma
- **WHEN** a pessoa usa a interface em português ou inglês
- **THEN** rótulos, validações, mensagens de estado e confirmações acompanham o locale ativo

#### Scenario: Busca e inclusão em andamento
- **WHEN** uma busca ou mutação está em andamento
- **THEN** os controles correspondentes ficam indisponíveis e a ação não é repetida automaticamente

### Requirement: Afiliação institucional isolada de acessos e designações
Criar uma afiliação MUST NOT criar ou alterar perfis globais, convites ou papéis locais em processos.

#### Scenario: Pessoa adicionada ao laboratório
- **WHEN** a API confirma a afiliação
- **THEN** a operação não altera as permissões nem as designações da pessoa em processos
