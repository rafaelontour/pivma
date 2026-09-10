# user-registration Specification

## Purpose

Permitir que novos participantes criem sua identidade no pi*VMA de forma clara e segura, diretamente a partir da interface de autenticação.

## Requirements

### Requirement: Acesso ao cadastro

O sistema SHALL oferecer, na área pública de autenticação, uma forma identificável de alternar do login para o cadastro de uma conta.

#### Scenario: Pessoa inicia o cadastro

- **WHEN** a pessoa seleciona a opção de criar uma conta na tela de login
- **THEN** o sistema apresenta o formulário de cadastro sem exigir uma sessão ativa

### Requirement: Coleta e validação de dados cadastrais

O sistema SHALL solicitar nome de usuário, e-mail, senha e confirmação de senha para o cadastro. O nome de usuário MUST ter entre 3 e 64 caracteres e conter somente letras, números, ponto, sublinhado ou hífen. A senha MUST ter pelo menos 8 caracteres, pelo menos uma letra maiúscula, pelo menos uma letra minúscula e pelo menos um número; a confirmação MUST coincidir com a senha informada.

O sistema SHALL exibir os quatro critérios de senha como uma lista de objetivos com caixas de seleção somente para leitura. Cada caixa MUST ser marcada assim que a senha digitada satisfizer o critério correspondente e desmarcada se deixar de satisfazê-lo.

O formulário de cadastro SHALL exibir nome de usuário e e-mail lado a lado, e os dois campos de senha lado a lado, em uma grade compacta. A página de autenticação MUST caber no viewport sem rolagem vertical da página.

O botão de criar conta MUST permanecer desabilitado até que todos os critérios de senha estejam atendidos, os campos obrigatórios sejam válidos e as duas senhas coincidam.

#### Scenario: Indicadores acompanham a senha digitada

- **WHEN** a pessoa digita ou altera a senha no formulário de cadastro
- **THEN** o sistema atualiza individualmente as caixas de comprimento mínimo, letra maiúscula, letra minúscula e número de acordo com os caracteres informados

#### Scenario: Confirmação de senha é atualizada em tempo real

- **WHEN** a pessoa digita ou altera qualquer um dos campos de senha depois de informar a confirmação
- **THEN** o sistema informa imediatamente se as senhas coincidem ou não coincidem

#### Scenario: Botão aguarda senhas coincidentes

- **WHEN** os critérios de senha são atendidos, mas os dois campos têm valores diferentes
- **THEN** o botão de criar conta permanece desabilitado

#### Scenario: Dados inválidos impedem o envio

- **WHEN** a pessoa envia o formulário com algum campo obrigatório inválido, algum critério de senha não atendido ou com senhas diferentes
- **THEN** o sistema informa o problema junto ao formulário e não solicita a criação da conta

#### Scenario: Dados válidos são enviados

- **WHEN** a pessoa fornece nome de usuário, e-mail, senha que atende aos quatro critérios e confirmação de senha correspondente
- **THEN** o sistema envia somente nome de usuário, e-mail e senha ao serviço de criação de usuário

### Requirement: Criação da conta

O sistema SHALL criar a conta pelo serviço de usuários do pi*VMA e MUST comunicar o resultado do pedido à pessoa sem expor a senha nem uma credencial de sessão.

#### Scenario: Cadastro concluído

- **WHEN** o serviço de usuários confirma a criação da conta
- **THEN** o sistema exibe uma confirmação, orienta a pessoa a entrar com as novas credenciais e informa que permissões institucionais podem depender de vinculação pela equipe gestora

#### Scenario: Cadastro recusado pelo serviço

- **WHEN** o serviço de usuários recusa ou não consegue processar o cadastro
- **THEN** o sistema mantém os dados não sensíveis no formulário, informa que a conta não foi criada e não revela detalhes que permitam enumerar contas existentes

### Requirement: Avisos da autenticação

O sistema SHALL apresentar avisos de sucesso, erro de validação e indisponibilidade do serviço em popups não bloqueantes do Sonner. Avisos contínuos que dependem da digitação de um campo, como a comparação entre as senhas, MUST permanecer junto ao respectivo campo.

#### Scenario: Cadastro é confirmado em popup

- **WHEN** uma conta é criada com sucesso
- **THEN** o sistema apresenta um popup de sucesso e direciona a pessoa de volta ao login

#### Scenario: Falha é comunicada em popup

- **WHEN** o login ou cadastro não pode ser concluído
- **THEN** o sistema apresenta um popup de erro com uma mensagem segura e acionável

### Requirement: Proteção das credenciais no cadastro

O sistema MUST encaminhar a senha apenas durante a solicitação de criação da conta, MUST NOT persistir a senha no navegador e MUST NOT iniciar uma sessão automaticamente após o cadastro. O navegador MUST chamar somente rotas internas da aplicação para criar a conta e MUST NOT receber a URL da API externa.

#### Scenario: Cadastro não cria sessão

- **WHEN** uma conta é criada com sucesso
- **THEN** o sistema não define uma sessão autenticada e apresenta a ação para retornar ao login

#### Scenario: Cadastro usa a rota interna

- **WHEN** a pessoa envia dados válidos de cadastro
- **THEN** o navegador envia os dados para a rota interna da aplicação e essa rota realiza a chamada ao serviço externo
