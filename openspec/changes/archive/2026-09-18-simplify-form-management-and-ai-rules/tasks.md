## 1. Ajustes nos Cartões e Catálogo de Formulários

- [x] 1.1 Atualizar `FormCatalogCard` em `app/(paginas)/formularios/form-template-manager.tsx` para remover a exibição da `key` e da descrição técnica, exibindo nome do formulário, processo associado, versão e botão de ação, e verificar a renderização visual dos cartões simplificados
- [x] 1.2 Remover o botão manual "Atualizar lista" do cabeçalho da listagem em `app/(paginas)/formularios/form-template-manager.tsx`, mantendo atualização automática ao montar/retornar e retry contextual em caso de erro, e verificar ausência do botão no layout
- [x] 1.3 Revisar e padronizar o acesso aos formulários para usuários administradores e membros do perfil BraCVAM / Grupo Gestor em `app/_components/authenticated-shell.tsx` e `app/(paginas)/configuracoes/settings-back-link.tsx`, verificando paridade de navegação e breadcrumbs

## 2. Tipagens e Modelos de Suporte ao Fluxo de IA

- [x] 2.1 Declarar tipos para o assistente progressivo de IA, estados de seleção, DTOs de criação rápida e etapas de orquestração de publicação/vinculação em `types/Formulario.ts` e `types/AvaliacaoIa.ts`, sem declarar types em componentes
- [x] 2.2 Implementar funções utilitárias em `components/formulario.ts` para mapeamento amigável de severidades, tipos de verificação, escopo (`target_type`) e validações prévias de regras de IA antes da publicação, verificando os testes unitários ou coerência de retorno

## 3. Componente Progressivo de IA no Editor de Campos

- [x] 3.1 Refatorar a seção de IA em `FormFieldEditor` (`form-template-manager.tsx`) para exibir os estados visuais progressivos (Desativada, Ativada sem regra vinculada e Ativada com regra vinculada), incluindo contagem de critérios e indicadores de campos dependentes
- [x] 3.2 Implementar diálogo de confirmação para desvinculação de regra de um campo, esclarecendo a preservação da regra na biblioteca, e verificar a atualização segura do estado local

## 4. Modal de Seleção de Regras e Pré-visualização

- [x] 4.1 Criar modal/painel de seleção de regras existentes com pesquisa textual (`GET /api/ai-evaluations`), filtros amigáveis e lista de cards contendo nome, versão e quantidade de critérios
- [x] 4.2 Implementar tela de pré-visualização de regra selecionada com objetivo completo, critérios e campos avaliados, oferecendo ações para "Usar esta regra" e "Duplicar e editar", verificando a transição de telas no modal

## 5. Criação Rápida de Regras e Playground de Teste

- [x] 5.1 Implementar assistente de criação rápida contendo nome da regra, objetivo em linguagem natural (com exemplos guiados), seleção de escopo amigável e chamada ao endpoint de sugestão de critérios por IA (`POST /api/ai-evaluations/suggest-criteria`)
- [x] 5.2 Implementar lista de critérios sugeridos em formato de cards editáveis, com ajustes de severidade amigável, tipo de verificação, exclusão e suporte a regeneração com confirmação prévia
- [x] 5.3 Implementar aba/etapa de Playground integrado de teste para execução simulada da regra (`POST /api/ai-evaluations/{id}/versions/{v}/test`), apresentando resultado estruturado com critérios atendidos, não atendidos e evidências

## 6. Orquestração de Publicação, Vinculação e Validação

- [x] 6.1 Implementar ação "Salvar e vincular ao campo", orquestrando em sequência criação, salvamento de critérios, publicação de versão e atualização consolidada de `evaluation-assignments`, preservando integralmente os vínculos dos demais campos
- [x] 6.2 Implementar tratamento de erro e retry contextual em caso de falha de rede na cadeia de vinculação sem duplicar registros na biblioteca
- [x] 6.3 Executar `pnpm build` e checagem de tipos e lint para verificar que toda a aplicação compila sem erros e atende aos padrões de tipagem em `types/`
