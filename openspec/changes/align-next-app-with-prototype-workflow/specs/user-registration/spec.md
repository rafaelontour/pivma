## MODIFIED Requirements

### Requirement: Coleta e validação de dados cadastrais

O sistema SHALL solicitar nome completo, nome de usuário, e-mail, senha e confirmação de senha para o cadastro. O nome completo MUST ter entre 1 e 255 caracteres depois de removidos espaços externos. O nome de usuário MUST ter entre 3 e 64 caracteres e conter somente letras, números, ponto, sublinhado ou hífen. A senha MUST ter entre 8 e 128 caracteres, pelo menos uma letra maiúscula, pelo menos uma letra minúscula e pelo menos um número; a confirmação MUST coincidir com a senha informada.

O sistema SHALL exibir os quatro critérios de senha como uma lista de objetivos com caixas de seleção somente para leitura. Cada caixa MUST ser marcada assim que a senha digitada satisfizer o critério correspondente e desmarcada se deixar de satisfazê-lo.

O formulário de cadastro SHALL organizar os campos em uma grade compacta e responsiva. A página de autenticação MUST evitar rolagem vertical desnecessária sem ocultar campos, mensagens ou ações em viewports menores.

O botão de criar conta MUST permanecer desabilitado até que todos os critérios de senha estejam atendidos, os campos obrigatórios sejam válidos e as duas senhas coincidam.

#### Scenario: Nome completo é obrigatório

- **WHEN** a pessoa deixa o nome completo vazio ou informa somente espaços
- **THEN** o sistema mantém o botão de criação desabilitado e indica que o campo é obrigatório

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

- **WHEN** a pessoa envia o formulário com algum campo obrigatório inválido, senha acima do limite, algum critério de senha não atendido ou senhas diferentes
- **THEN** o sistema informa o problema junto ao formulário e não solicita a criação da conta

#### Scenario: Dados válidos são enviados

- **WHEN** a pessoa fornece nome completo, nome de usuário, e-mail, senha válida e confirmação correspondente
- **THEN** o sistema envia somente nome completo, nome de usuário, e-mail e senha ao serviço de criação de usuário
