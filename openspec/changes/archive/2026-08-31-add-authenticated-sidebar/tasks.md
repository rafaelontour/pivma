## 1. Preparação da área autenticada

- [x] 1.1 Consultar a documentação local do Next.js aplicável às rotas, layouts e redirecionamentos do App Router antes de alterar o código.
- [x] 1.2 Adicionar a biblioteca de ícones escolhida usando `pnpm` e manter o lockfile atualizado.
- [x] 1.3 Criar a rota protegida `/inicio` e o contêiner reutilizável da área autenticada.

## 2. Sessão e redirecionamento

- [x] 2.1 Carregar o perfil da sessão atual pela rota interna de autenticação antes de apresentar dados na área autenticada.
- [x] 2.2 Redirecionar acessos sem sessão válida para `/login`, exibindo um aviso seguro quando aplicável.
- [x] 2.3 Atualizar o sucesso do formulário de login para direcionar a pessoa com perfil válido para `/inicio`.

## 3. Barra lateral e página inicial

- [x] 3.1 Implementar a barra lateral com o item Início, ícone, estado ativo e navegação acessível.
- [x] 3.2 Exibir nome de usuário e e-mail do perfil atual na barra lateral sem expor dados sensíveis.
- [x] 3.3 Implementar o controle de recolher e expandir, preservando ícones, nomes acessíveis e foco visível no estado recolhido.
- [x] 3.4 Criar o conteúdo inicial de boas-vindas em um layout responsivo que preserve espaço para páginas futuras.
- [x] 3.5 Reposicionar o header de 72 pixels acima da barra lateral e conteúdo, com o controle de menu à esquerda da marca.
- [x] 3.6 Adicionar no canto direito do header a ação acessível de encerrar sessão pela rota interna, com estado de carregamento e retorno ao login.

## 4. Verificação

- [x] 4.1 Verificar manualmente login com redirecionamento, acesso direto sem sessão, identificação do perfil e os estados expandido e recolhido em telas grandes e reduzidas.
- [x] 4.2 Executar `pnpm lint`, `pnpm exec tsc --noEmit` e `pnpm build`.
