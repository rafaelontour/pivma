This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

Useful commands:

```bash
pnpm lint
pnpm build
pnpm start
```

## Regras gerais para entradas e formulários

Estas regras são obrigatórias para todos os campos de entrada da aplicação,
incluindo formulários, diálogos, filtros, seletores e uploads:

- Trate valores ausentes, `null`, vazios, compostos somente por espaços,
  malformados ou fora dos limites permitidos como entradas inválidas.
- Normalize os valores de acordo com o domínio antes do envio, sem alterar
  identificadores técnicos ou conteúdo escrito por pessoas.
- Declare no controle as restrições aplicáveis, como obrigatoriedade, tamanho,
  formato, faixa e opções permitidas, oferecendo mensagens acessíveis e
  internacionalizadas em português do Brasil e inglês.
- Mantenha a ação de confirmação ou envio desabilitada enquanto as informações
  obrigatórias não estiverem completas e válidas. A validação também deve ser
  repetida no manipulador de envio para evitar chamadas programáticas inválidas.
- Nunca confie somente na validação do navegador. Route Handlers, serviços e a
  API devem validar novamente os dados antes de realizar qualquer mutação.
- Durante uma requisição, bloqueie novos envios e ações conflitantes para evitar
  cliques duplos, concorrência acidental e operações duplicadas.
- Quando uma operação for rejeitada, preserve as informações preenchidas para
  que a pessoa possa corrigir somente o necessário. Não envie automaticamente
  uma segunda mutação.
- Estados desabilitados, erros e instruções devem possuir indicação visual e
  semântica adequada para teclado e tecnologias assistivas.

Uma entrada de teste somente pode desconsiderar alguma dessas regras quando o
responsável pelo projeto solicitar explicitamente essa exceção no momento do
teste. A exceção deve ficar limitada aos campos e ao cenário indicados, não deve
ser generalizada para outros testes e não pode enfraquecer silenciosamente a
validação usada em produção.

## Docker

Build and start the production application at
[http://localhost:4025](http://localhost:4025):

```bash
docker compose up
```

Configure the backend documentation URL in the root `.env` file before
starting the application:

```bash
API_PIVMA=https://api.example.com/docs
docker compose up
```

The server derives the API base URL from this value. The variable is not
prefixed with `NEXT_PUBLIC_`, so it remains available only on the server.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
