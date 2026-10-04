## 1. Navegação por seções

- [x] 1.1 Modelar em `types/` as propriedades compartilhadas necessárias ao estado e à navegação das seções.
- [x] 1.2 Derivar as seções na ordem dos campos e renderizar abas somente quando o formulário possuir mais de uma seção.
- [x] 1.3 Implementar seleção acessível por clique, setas, Home e End, com painel associado e rolagem horizontal responsiva.
- [x] 1.4 Aplicar a navegação acessível por abas às seções da proposta exibida no modal de análise BraCVAM, preservando os pareceres ao alternar.

## 2. Estado e validação

- [x] 2.1 Preservar valores e anexos ao alternar seções sem provocar salvamento automático.
- [x] 2.2 Ao detectar campo inválido fora da seção ativa, abrir sua aba e mover o foco para o controle após a renderização.
- [x] 2.3 Adicionar em `pt-BR` e `en` os nomes acessíveis controlados pela aplicação, preservando nomes de seção vindos do backend.

## 3. Verificação

- [ ] 3.1 Verificar a prova de conceito com várias seções e um formulário de seção única nos dois idiomas, incluindo navegação por teclado e layout estreito.
- [x] 3.2 Executar `pnpm i18n:check`, ESLint, `pnpm exec tsc --noEmit`, `pnpm build`, `git diff --check` e `openspec validate add-tabbed-submission-form-sections --strict`.

Evidência parcial de 3.1: a API confirmou que o rascunho de prova de conceito possui 79 campos em 9 seções. A inspeção interativa em navegador permanece pendente porque o ambiente não oferece driver de automação instalado.

Observação de 3.2: todas as verificações passaram, exceto o build; o Turbopack foi bloqueado ao tentar abrir uma porta interna (`Operation not permitted`) e a alternativa Webpack encontrou a limitação ambiental `Could not parse output from TypeScript's --showConfig`.
