## 1. Ajuste de layout e container amplo

- [x] 1.1 Atualizar o container em `app/_components/authenticated-shell.tsx` para aplicar largura expandida `max-w-[100rem]` quando `activePage === "forms"`, verificando a ampliação da área disponível na página.
- [x] 1.2 Atualizar tipagens em `types/Formulario.ts` para formalizar propriedades de navegação e componentes do configurador de formulários, verificando conformidade via `pnpm tsc --noEmit`.

## 2. Refatoração da listagem inicial e do workspace em tela cheia

- [x] 2.1 Refatorar a visualização inicial de `FormTemplateManager` em `app/(paginas)/formularios/form-template-manager.tsx` para apresentar uma grade de cartões de formulários em largura total quando nenhum formulário estiver selecionado (`editor.kind === "closed"`), com resumo e botão de configuração.
- [x] 2.2 Implementar a transição para workspace exclusivo do editor ocupando 100% da largura útil ao selecionar um formulário, ocultando completamente o catálogo lateral.
- [x] 2.3 Adicionar cabeçalho de navegação no topo do editor de formulário com botão acessível ("Voltar para a lista de formulários") e proteção contra descarte de alterações não salvas, verificando a volta segura à listagem.

## 3. Higienização terminológica da interface

- [x] 3.1 Substituir todas as menções do termo "template" e "templates" nos textos voltados ao usuário em `app/(paginas)/formularios/form-template-manager.tsx` por termos de domínio ("Formulários", "Formulários de processo"), verificando a ausência do termo nas mensagens e títulos da interface.

## 4. Validação e compilação

- [x] 4.1 Executar a checagem de tipos estáticos (`pnpm tsc --noEmit`) e a análise de código (`pnpm lint`), verificando ausência de erros e advertências.
- [x] 4.2 Executar `pnpm build` e validar a integridade da compilação e a transição responsiva entre catálogo e editor em tela cheia.
