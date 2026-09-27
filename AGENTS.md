## Visão geral do pi*VMA

O pi*VMA (Plataforma Integrada de Validação de Métodos Alternativos) é uma plataforma da BraCVAM/Fiocruz para organizar fluxos de submissão, triagem e avaliação de métodos alternativos, com foco em rastreabilidade e governança técnica.

- O frontend usa Next.js App Router, TypeScript, React, Tailwind CSS e Sonner. Use `pnpm` para dependências e scripts.
- As rotas públicas e autenticadas ficam em `app/(paginas)/`; os parênteses são apenas uma organização e não alteram a URL.
- A autenticação usa somente rotas internas (`/api/auth/*`). A URL da API externa deve permanecer no servidor; chamadas externas ficam em `services/`, com Axios e Radash.
- Toda tipagem de domínio ou de interface deve ficar em `types/`, organizada por assunto (por exemplo, `types/Usuario.ts` e `types/Rbac.ts`). Componentes, rotas e serviços devem somente importar esses tipos, sem declarar `type` ou `interface` localmente.
- Hoje existem as telas de login/cadastro em `/login` e a área autenticada inicial em `/inicio`, com header, barra lateral recolhível, perfil e logout.
- O planejamento de funcionalidades é mantido em `openspec/`; changes concluídas ficam em `openspec/changes/archive/` e specs consolidadas em `openspec/specs/`.

## Internacionalização obrigatória

- Todo novo conteúdo controlado pela aplicação deve ser criado simultaneamente em português do Brasil e inglês. Isso inclui títulos, menus, rótulos, botões, placeholders, textos de ajuda, validações, toasts, estados vazios, mensagens de erro seguras e nomes acessíveis.
- No frontend, não adicione texto de interface diretamente em componentes ou páginas. Use chaves semânticas do `i18next` e inclua a mesma chave em `i18n/locales/pt-BR.json` e `i18n/locales/en.json`, preservando estrutura, tipos e variáveis de interpolação.
- Alterações que envolvam datas, horas, números, moedas, custos, durações, ordenação textual ou rótulos de enums devem respeitar o locale ativo sem alterar identificadores técnicos enviados à API.
- Conteúdo científico, texto escrito por pessoas, nomes próprios, identificadores e valores configuráveis recebidos do backend não devem ser traduzidos automaticamente. Quando o backend controlar conteúdo institucional traduzível, modele versões localizadas ou devolva códigos estáveis que o frontend possa resolver nos dicionários.
- Toda implementação ou revisão que crie ou altere conteúdo deve verificar os dois idiomas e executar `pnpm i18n:check`. Uma funcionalidade com texto novo em apenas um idioma é considerada incompleta.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
