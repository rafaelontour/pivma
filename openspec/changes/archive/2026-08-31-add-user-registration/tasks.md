## 0. Organização de rotas

- [x] 0.1 Mover as páginas e Route Handlers existentes para `app/(paginas)/`, preservando suas URLs públicas e mantendo o layout raiz em `app/`.

## 1. Camada de serviços

- [x] 1.1 Adicionar Axios e Radash ao projeto e configurar o cliente HTTP exclusivo da camada de serviços com a URL da API externa.
- [x] 1.2 Criar `services/Usuario.ts` para a criação de usuários e para futuras consultas de usuários com filtros.
- [x] 1.3 Criar `services/Autenticacao.ts` e migrar para ele as chamadas de login, sessão e logout das rotas internas existentes.

## 2. Serviço de cadastro

- [x] 2.1 Criar a rota interna `POST /api/auth/register` que valida nome de usuário, e-mail e a política de senha antes de invocar o service de usuários.
- [x] 2.2 Normalizar respostas de validação, conflito e indisponibilidade sem expor informações de contas existentes.
- [x] 2.3 Garantir que a rota de cadastro não crie, altere ou retorne credenciais de sessão.

## 3. Interface de cadastro

- [x] 3.1 Adicionar o modo de cadastro à área de autenticação, com transição acessível entre entrar e criar conta.
- [x] 3.2 Implementar os campos de nome de usuário, e-mail, senha e confirmação de senha com validação e mensagens associadas aos campos.
- [x] 3.3 Exibir quatro caixas de seleção não editáveis que acompanham, durante a digitação, os critérios de senha: mínimo de 8 caracteres, letra maiúscula, letra minúscula e número.
- [x] 3.4 Enviar os dados válidos para a rota interna, apresentar estados de carregamento e manter os dados não sensíveis em caso de falha.
- [x] 3.5 Exibir confirmação após criar a conta, limpar campos de senha e oferecer retorno explícito ao login sem iniciar sessão automaticamente.
- [x] 3.6 Reorganizar o cadastro em uma grade compacta de duas colunas e eliminar a rolagem vertical da página de autenticação.
- [x] 3.7 Informar em tempo real se os dois campos de senha coincidem ou não e habilitar o envio somente quando todos os dados e critérios forem válidos.
- [x] 3.8 Adicionar o Sonner e migrar para popups os avisos de sucesso, erro e indisponibilidade do login e cadastro.

## 4. Verificação

- [x] 4.1 Verificar manualmente os cenários de indicadores de senha, validação local, erro do serviço e sucesso de cadastro com uma conta de teste autorizada.
- [x] 4.2 Executar `pnpm lint` e `pnpm build`.
