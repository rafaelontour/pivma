## Why

A página Submissões usa nomes e explicações que não refletem a terminologia solicitada pelo BraCVAM para alinhamento ao OECD Guidance Document No. 34, e pede novamente a identificação do método durante o preenchimento. Além disso, o formulário de submissão institucional ainda não está integrado ao fluxo, deixando o proponente sem orientação suficiente sobre o envio, a pré-avaliação, a análise da BraCVAM e os códigos dos processos.

## What Changes

- Reordenar o catálogo para apresentar Método Novo, Método Novo – Dossiê Completo, Extensão do Domínio de Aplicação e Método Similar, com os textos institucionais fornecidos.
- Retirar Prova de Conceito das novas opções sem remover nem invalidar processos já existentes.
- Remover a classificação de Fitness for Purpose Validation como tipo independente e explicar sua consideração na avaliação da relevância e confiabilidade do método.
- Solicitar o título do método uma única vez e reaproveitá-lo no formulário associado à submissão.
- Incorporar o formulário de submissão do BraCVAM na gestão de formulários e vinculá-lo ao tipo de submissão para que seja aberto após a identificação do método.
- Explicar o conteúdo enviado, a função e disponibilidade de eventual pré-avaliação automatizada, o acesso ao processo, a responsabilidade de análise e os próximos passos.
- Esclarecer o estado “Nenhum relatório” e informar como o código do processo é atribuído, após confirmação da regra no backend.

## Capabilities

### New Capabilities

### Modified Capabilities
- `dynamic-process-forms`: revisar catálogo, identificação, formulário inicial, envio, acompanhamento e textos de orientação ao proponente.
- `form-template-management`: permitir vincular a definição aprovada do formulário de submissão aos tipos de submissão oferecidos.

## Impact

- A página Submissões, o catálogo de opções, o diálogo de identificação, os formulários dinâmicos e o acompanhamento de pré-avaliação.
- Configurações e gestão de formulários para configurar e versionar o formulário do BraCVAM associado a cada tipo.
- Dicionários de interface em português do Brasil e inglês.
- Contratos da API para garantir a ligação entre tipo de submissão, definição/versionamento do formulário, título único e dados apresentados sobre pré-avaliação e código do processo.
- A definição oficial do formulário mencionada pelo BraCVAM é uma dependência de conteúdo; não foi localizada nos arquivos deste repositório.
