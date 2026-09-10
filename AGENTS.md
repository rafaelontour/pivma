## Visão geral do pi*VMA

O pi*VMA (Plataforma Integrada de Validação de Métodos Alternativos) é uma plataforma da BraCVAM/Fiocruz para organizar fluxos de submissão, triagem e avaliação de métodos alternativos, com foco em rastreabilidade e governança técnica.

- O frontend usa Next.js App Router, TypeScript, React, Tailwind CSS e Sonner. Use `pnpm` para dependências e scripts.
- As rotas públicas e autenticadas ficam em `app/(paginas)/`; os parênteses são apenas uma organização e não alteram a URL.
- A autenticação usa somente rotas internas (`/api/auth/*`). A URL da API externa deve permanecer no servidor; chamadas externas ficam em `services/`, com Axios e Radash.
- Toda tipagem de domínio ou de interface deve ficar em `types/`, organizada por assunto (por exemplo, `types/Usuario.ts` e `types/Rbac.ts`). Componentes, rotas e serviços devem somente importar esses tipos, sem declarar `type` ou `interface` localmente.
- Hoje existem as telas de login/cadastro em `/login` e a área autenticada inicial em `/inicio`, com header, barra lateral recolhível, perfil e logout.
- O planejamento de funcionalidades é mantido em `openspec/`; changes concluídas ficam em `openspec/changes/archive/` e specs consolidadas em `openspec/specs/`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
