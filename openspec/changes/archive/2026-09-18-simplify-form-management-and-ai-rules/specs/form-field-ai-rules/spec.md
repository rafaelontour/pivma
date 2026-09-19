## Purpose

Permitir que a pessoa usuária configure, selecione, crie em linguagem natural, teste e vincule regras de avaliação por inteligência artificial diretamente nos campos do formulário através de uma experiência progressiva e intuitiva.

## ADDED Requirements

### Requirement: Estado visual progressivo de IA no campo de formulário

O sistema SHALL apresentar, em cada campo do editor de formulários, um componente dedicado de avaliação por IA com estados visuais explícitos: IA desativada, IA ativada sem regra vinculada e IA ativada com regra vinculada. O sistema MUST traduzir termos e identificadores técnicos para linguagem de negócio, ocultando identificadores internos como `target_type`, `definition_id` ou `EvaluationAssignment`.

#### Scenario: Campo com IA desativada
- **WHEN** a pessoa visualiza um campo em que a avaliação por IA não está habilitada
- **THEN** o sistema exibe o controle em estado desativado, sem exigir configurações adicionais

#### Scenario: Ativação inicial da IA no campo
- **WHEN** a pessoa ativa a avaliação por IA em um campo sem regra configurada
- **THEN** o sistema apresenta a indicação de que nenhuma regra está vinculada e oferece a ação principal "Configurar avaliação"

#### Scenario: Campo com regra vinculada
- **WHEN** um campo possui uma regra de avaliação vinculada
- **THEN** o sistema exibe o nome amigável da regra, versão publicada, contagem de critérios, indicação de campos adicionais utilizados (quando houver) e ações para "Alterar regra" e "Remover vínculo"

### Requirement: Seleção e reaproveitamento de regras existentes

O sistema SHALL permitir pesquisar e selecionar regras de avaliação existentes a partir do campo em edição. O sistema MUST oferecer busca por texto (nome e objetivo), visualização prévia dos critérios da regra antes da vinculação e a opção de duplicar uma regra publicada para novo rascunho.

#### Scenario: Pesquisa e seleção de regra do catálogo
- **WHEN** a pessoa aciona a seleção de regras existentes e digita um termo de busca
- **THEN** o sistema lista as regras correspondentes exibindo nome, versão, contagem de critérios e objetivo, permitindo a seleção direta

#### Scenario: Pré-visualização da regra antes da vinculação
- **WHEN** a pessoa solicita visualizar os detalhes de uma regra listada
- **THEN** o sistema exibe o objetivo completo, a lista de critérios objetivos e os campos avaliados, oferecendo as ações "Usar esta regra" e "Duplicar e editar"

### Requirement: Criação rápida de regra com sugestão de critérios por IA

O sistema SHALL disponibilizar um fluxo rápido de criação de regra no qual a pessoa usuária informa um nome, o objetivo em linguagem natural (apoiada por exemplos práticos de redação) e o escopo da análise (somente este campo, este campo + outros campos, ou todo o formulário). O sistema SHALL acionar a sugestão automática de critérios por IA a partir do objetivo informado e apresentar os critérios sugeridos como cards editáveis.

#### Scenario: Criação em modo rápido com sugestões geradas
- **WHEN** a pessoa preenche nome, objetivo e escopo e solicita a geração de critérios
- **THEN** o sistema consulta o serviço de sugestão de critérios e apresenta cada critério sugerido em formato editável, com severidade amigável e tipo de verificação em linguagem natural

#### Scenario: Edição e regeneração de critérios
- **WHEN** a pessoa ajusta os critérios sugeridos ou solicita novas sugestões
- **THEN** o sistema permite ativar, desativar, editar ou regenerar as sugestões, solicitando confirmação caso existam alterações manuais anteriores

### Requirement: Teste e validação de regras em playground integrado

O sistema SHALL oferecer uma etapa de teste controlado (playground) antes da publicação da regra, permitindo testar o comportamento da avaliação com entradas simuladas do usuário. O sistema MUST exibir o resultado de forma estruturada, com indicação clara dos critérios atendidos, critérios não atendidos e evidências, sem marcar respostas indeterminadas como erro de sistema.

#### Scenario: Teste bem-sucedido com dados simulados
- **WHEN** a pessoa submete uma resposta de teste no playground
- **THEN** o sistema executa a pré-avaliação sem alterar dados reais e apresenta o resumo de conformidade e o detalhamento por critério

#### Scenario: Validação impeditiva antes de publicar
- **WHEN** uma regra não atende aos requisitos mínimos (ausência de critérios ou campos cruzados obrigatórios não selecionados)
- **THEN** o sistema mantém a publicação bloqueada e destaca os pontos de correção necessários

### Requirement: Publicação e vinculação em etapa única com preservação de estado

O sistema SHALL disponibilizar a ação unificada "Salvar e vincular ao campo", orquestrando automaticamente a criação da regra, o salvamento de seus critérios, a publicação da versão e a atualização dos vínculos do formulário. Ao atualizar os vínculos (`evaluation-assignments`), o sistema MUST preservar integralmente todas as associações de outros campos não alteradas.

#### Scenario: Vinculação concluída com sucesso
- **WHEN** a pessoa aciona salvar e vincular após validar a regra
- **THEN** o sistema executa a cadeia de persistência e publicação, associa a regra ao formulário preservando os demais vínculos existentes, e atualiza o estado visual do campo para ativo com a regra vinculada

#### Scenario: Falha em etapa intermediária
- **WHEN** ocorre uma falha na publicação ou na vinculação à API
- **THEN** o sistema preserva o rascunho criado, comunica em linguagem clara qual etapa falhou e oferece opção de tentar a vinculação novamente sem duplicar a regra

### Requirement: Desvinculação segura de regras de avaliação

O sistema SHALL exigir confirmação antes de desvincular uma regra de um campo de formulário. O sistema MUST esclarecer que a remoção desativa a avaliação no campo específico, mas mantém a regra preservada na biblioteca para reutilização em outros formulários.

#### Scenario: Desvinculação confirmada pelo usuário
- **WHEN** a pessoa confirma a remoção da regra vinculada ao campo
- **THEN** o sistema atualiza as associações do formulário removendo o vínculo do campo atual, preserva os demais vínculos e a regra na biblioteca, e retorna o componente de IA do campo para o estado desativado
