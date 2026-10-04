## Why

Formulários de submissão com várias seções são exibidos hoje como uma sequência única de blocos, produzindo um popup muito alto e exigindo rolagem vertical extensa. A navegação por seções precisa tornar o preenchimento mais curto e previsível sem perder valores, ordem ou acessibilidade.

## What Changes

- Organizar em abas as seções de formulários dinâmicos que possuam mais de uma seção, exibindo somente a seção ativa.
- Aplicar a mesma navegação por seções à proposta exibida no modal de análise da BraCVAM, evitando que a pessoa avaliadora percorra todos os campos em uma única página longa.
- Manter o comportamento compacto atual para formulários com uma única seção.
- Permitir troca das abas por clique e teclado, com nomes e estados acessíveis.
- Preservar todos os valores digitados durante a troca de seção e levar a pessoa à aba que contém o primeiro campo inválido ao tentar enviar.
- Manter salvamento, envio, anexos e conteúdo configurável do backend inalterados.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `dynamic-process-forms`: o popup de formulário passa a apresentar múltiplas seções como abas navegáveis e a revelar a seção do primeiro campo inválido.

## Impact

- Componentes cliente do catálogo de submissões e do workspace de triagem usado no modal de análise.
- Tipos compartilhados do fluxo em `types/Submissao.ts`.
- Dicionários `pt-BR` e `en` para o nome acessível da navegação entre seções.
- Nenhuma alteração em APIs, payloads, persistência ou dependências.
