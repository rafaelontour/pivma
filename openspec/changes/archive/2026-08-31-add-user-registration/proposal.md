## Why

Atualmente, a plataforma oferece somente acesso para contas já existentes, o que obriga novos participantes a depender de uma etapa externa e pouco visível para criar sua identidade. Um cadastro guiado reduz esse atrito e prepara o fluxo de acesso para proponentes e colaboradores institucionais.

## What Changes

- Adicionar uma opção de cadastro na tela de autenticação.
- Permitir que uma pessoa informe nome de usuário, e-mail e senha para criar uma conta pela API do pi*VMA.
- Exigir confirmação de senha e orientar a criação com indicadores para comprimento mínimo, letras maiúsculas, letras minúsculas e número.
- Validar os dados e a política de senha no cliente e no servidor antes de encaminhá-los à API.
- Exibir estados claros de envio, sucesso e falha, sem expor detalhes sensíveis da API.
- Exibir avisos de sucesso, erro e indisponibilidade por meio de popups do Sonner.
- Orientar a pessoa cadastrada a entrar na plataforma e, quando aplicável, aguardar a vinculação do perfil de acesso pela equipe gestora.
- Centralizar chamadas de usuários e autenticação em arquivos da pasta `services/`, usados pelas rotas internas do Next.
- Organizar páginas e Route Handlers sob o Route Group `app/(paginas)/`, sem alterar as URLs públicas.

## Capabilities

### New Capabilities

- `user-registration`: criação segura de uma conta de usuário a partir da interface pública de autenticação.

### Modified Capabilities

- Nenhuma.

## Impact

- Interface em `app/login/`, rotas internas de autenticação e arquivos em `services/`.
- Integração com `POST /users/` da API externa do pi*VMA e refatoração das chamadas de login, sessão e logout existentes.
- Novas dependências: Axios para HTTP no servidor e Radash para composição segura das chamadas e seus dados.
