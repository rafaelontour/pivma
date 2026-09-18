## Context

A página de formulários (`/formularios`) gerencia a definição de questionários dinâmicos de submissão do pi*VMA. Atualmente, os cartões da listagem expõem detalhes técnicos desnecessários para a operação rotineira (`item.key` e descrições longas de infraestrutura), possuem um botão manual de "Atualizar lista", e a seção de inteligência artificial de cada campo resume-se a uma caixa de texto crua para prompt (`ai_context_instructions`) sem apoio para seleção, criação, teste ou versionamento de regras formais.

O backend já conta com endpoints para listagem de definições de IA, sugestão de critérios por IA, versionamento, publicação, playground de teste e vinculação de assignments aos formulários. A presente proposta projeta a camada de UX e abstração do frontend para unificar esses fluxos de maneira simples e progressiva.

## Goals / Non-Goals

**Goals:**
- Simplificar os cartões de formulário para focar em nome, processo associado, versão e ação principal de configuração.
- Remover o botão redundante de atualização manual do topo da listagem, mantendo atualização automática e retry contextual em caso de erro.
- Padronizar o acesso aos formulários para administradores e membros do perfil BraCVAM / Grupo Gestor com identidade e breadcrumbs consistentes.
- Introduzir um componente progressivo de IA no editor de campos:
  - Estado visual claro (Desativado, Ativo sem regra, Ativo com regra vinculada);
  - Modal de seleção de regras existentes com busca, visualização de critérios e duplicação;
  - Assistente de criação em Modo Rápido (nome, objetivo em linguagem natural, escopo amigável e sugestão de critérios por IA) e Modo Avançado;
  - Playground integrado de teste com dados simulados antes da publicação;
  - Fluxo atômico de UX "Salvar e vincular ao campo", orquestrando criação, persistência, publicação e associação sem expor complexidades técnicas;
  - Preservação estrita de todos os outros assignments do formulário ao salvar.

**Non-Goals:**
- Não altera o schema ou a arquitetura de banco de dados do backend do pi*VMA.
- Não substitui a página de catálogo institucional `/avaliacoes-ia`, que continua disponível para auditoria e governança avançada.
- Não remove a compatibilidade com campos do tipo `ai_context_instructions` já persistidos.

## Decisions

### 1. Modularização da interface de IA
- **Decisão**: Isolar a lógica de seleção, criação rápida, teste e vinculação de regras de IA em subcomponentes dedicados (ex.: `FieldAiRuleSection`, `FieldAiRuleModal`, `FieldAiRulePlayground`), em vez de expandir linearmente o arquivo [form-template-manager.tsx](file:///home/jaspion/Fiocruz/BraCVAM/pivma-front/app/(paginas)/formularios/form-template-manager.tsx).
- **Alternativa descartada**: Implementar todos os modais e passos dentro do arquivo único de 1340 linhas, o que prejudicaria a manutenibilidade.
- **Tipagem**: Toda a nova tipagem de suporte aos estados do assistente de IA ficará centralizada em `types/Formulario.ts` e `types/AvaliacaoIa.ts`, em estrito cumprimento às diretrizes do projeto (`AGENTS.md`).

### 2. Abstração do modelo mental e vocabulário amigável
- **Decisão**: Traduzir termos técnicos para expressões orientadas a negócio:
  - `target_type`: "Somente este campo" (`field`), "Este campo + outros campos" (`cross_field`), "Todo o formulário" (`form`).
  - Severidades: "Informativo" (`info`), "Baixa" (`low`), "Média" (`medium`), "Alta" (`high`), "Crítica" (`critical`).
  - Verificações: "Presença" (`presence`), "Conformidade" (`compliance`), "Qualidade" (`quality`), "Consistência" (`cross_field_consistency`).
- **Alternativa descartada**: Exibir selects com os enums brutos da API.

### 3. Orquestração atômica de publicação e vinculação
- **Decisão**: O botão "Salvar e vincular ao campo" executa a cadeia de 4 operações em lote:
  1. `POST /api/ai-evaluations` (criação da definição);
  2. `PATCH /api/ai-evaluations/{id}/versions/1` (salvamento dos critérios e escopo);
  3. `POST /api/ai-evaluations/{id}/versions/1/publish` (publicação imutável);
  4. Leitura dos assignments atuais do formulário e envio do array consolidado via `PUT /api/forms/{tpl}/evaluation-assignments` (preservando todos os vínculos dos demais campos).
  O usuário visualiza uma barra de etapas progressivas (*Criando regra* → *Salvando critérios* → *Publicando regra* → *Vinculando ao campo*).
- **Alternativa descartada**: Exigir que o usuário navegue manualmente entre três telas diferentes para criar, publicar e depois associar a regra.

### 4. Limpeza dos cartões e atualização automática
- **Decisão**: Remover a exibição da `key` e do texto de descrição do cartão [FormCatalogCard](file:///home/jaspion/Fiocruz/BraCVAM/pivma-front/app/(paginas)/formularios/form-template-manager.tsx#L536-L572). Exibir apenas nome do formulário, processo associado, versão/status e o botão de configuração. Remover o botão "Atualizar lista" do topo do catálogo.
- **Alternativa descartada**: Manter a `key` e a descrição em accordion colapsado no cartão (desnecessário para a visualização principal).

## Risks / Trade-offs

- **[Sobrescrita de assignments concorrentes no PUT]** → *Mitigação*: Antes de disparar o PUT de atualização de vínculos, obter o snapshot mais recente dos assignments do formulário (`GET`), mesclar o item novo/atualizado e enviar o conjunto integral, bloqueando cliques repetidos.
- **[Falha em etapa intermediária da orquestração]** → *Mitigação*: Armazenar os IDs criados no estado local da operação para que uma ação de "Tentar novamente" dê continuidade a partir da etapa que falhou, evitando criar registros órfãos ou duplicados.
- **[Exclusão acidental de regras ao desvincular]** → *Mitigação*: O modal de desvinculação deixa explícito que apenas o vínculo com o campo específico está sendo removido, garantindo que a regra continue disponível na biblioteca.
