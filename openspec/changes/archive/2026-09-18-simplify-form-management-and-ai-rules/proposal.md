## Why

A gestão de formulários dinâmicos e a integração com regras de avaliação por IA hoje exigem do usuário conhecimento excessivo da arquitetura técnica interna (como chaves de API, payloads, `target_type`, `definition_id` e endpoints separados). Além disso, os cartões de formulários na listagem exibem informações técnicas dispensáveis (`key` e descrição de API), contêm um botão manual redundante de "Atualizar lista" e possuem inconsistências no fluxo de navegação e acesso entre perfis institucionais (BraCVAM e Administrador).

Esta mudança simplifica a listagem de formulários, padroniza a jornada de acesso e abstrai a complexidade do motor de IA em um fluxo de UX progressivo, intuitivo e orientado a negócio diretamente dentro do editor de campos.

## What Changes

- **Padronização de Acesso aos Formulários**: Alinha o fluxo e os componentes visuais de navegação para usuários administradores e membros do perfil BraCVAM / Grupo Gestor, garantindo consistência no shell, sidebar e cabeçalhos.
- **Enxugamento dos Cartões de Formulário**: Remove a exibição da chave técnica (`key`) e da descrição longa/técnica dos cards da listagem inicial `/formularios`, priorizando nome do formulário, processo vinculado, versão/status e ação principal ("Configurar formulário").
- **Remoção do Botão "Atualizar Lista"**: Elimina o botão de recarga manual acima dos cards, adotando atualização automática (ao entrar, retornar ou salvar) e botão de retry apenas em cenários de falha.
- **Configurador Progressivo de IA no Campo**: Substitui a simples caixa de texto de instruções contextuais por uma experiência completa e amigável:
  - Estado visual claro do campo (Desativado, Ativado sem regra, Ativado com regra vinculada, Regra em rascunho/publicada, Regra com atualização disponível).
  - Seleção de regra existente com busca (`GET /ai-evaluations`), prévia de critérios e opção de duplicação.
  - Criação de nova regra com dois caminhos: **Modo Rápido** (nome, objetivo em linguagem natural com exemplos, escopo simples e sugestão de critérios por IA) e **Modo Avançado** (controle detalhado de critérios, severidade amigável e tipos de verificação).
  - Playground integrado de teste de regras antes da publicação.
  - Publicação e vinculação em etapa única para o usuário (orquestrando a cadeia `POST /ai-evaluations` -> `PATCH version` -> `POST publish` -> `PUT evaluation-assignments` de forma transparente).
  - Preservação integral dos vínculos já existentes ao atualizar o conjunto de assignments.
  - Desvinculação com confirmação clara sem apagar a regra da biblioteca.

## Capabilities

### New Capabilities
- `form-field-ai-rules`: Experiência progressiva e orientada a negócio para configuração, criação rápida por linguagem natural, teste em playground, publicação e vinculação de regras de avaliação por IA diretamente no editor de campos de formulário.

### Modified Capabilities
- `form-template-management`: Simplificação dos cartões do catálogo (sem `key` nem descrição técnica), eliminação do botão manual de atualização de lista e padronização da experiência de acesso e navegação entre perfis Administrador e BraCVAM.

## Impact

- **Frontend**:
  - `app/(paginas)/formularios/form-template-manager.tsx`: Refatoração dos cards do catálogo e substituição do bloco de IA dos campos pelo novo fluxo progressivo de regras.
  - Novos componentes modulares para o fluxo de IA nos formulários: modal/drawer de seleção de regras, assistente de criação rápida com IA, playground de teste e confirmações acessíveis.
  - `app/_components/authenticated-shell.tsx` e `components/configuracoes.ts`: Padronização de rótulos, permissões e coerência visual para Admin e BraCVAM.
- **APIs e Serviços**:
  - Utilização orquestrada das rotas internas existentes de formulários e avaliações de IA (`/api/forms`, `/api/forms/[processKey]/[formKey]`, `/api/forms/evaluable-fields/[formKey]`, `/api/ai-evaluations*`).
- **Compatibilidade**: Sem quebras de contrato de backend; todas as transformações de modelo mental para as entidades técnicas (`target_type`, `field_keys`, `definition_id`) ocorrem na camada de abstração do frontend.
