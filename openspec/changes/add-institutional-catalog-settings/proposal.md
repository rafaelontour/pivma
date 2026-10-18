## Why

O fluxo de composição de processos depende de laboratórios previamente cadastrados, e cada laboratório exige uma instituição no contrato atual. Como o ambiente ainda não possui instituições nem laboratórios, a equipe BraCVAM e administradores precisam de um módulo próprio em Configurações para manter esse catálogo antes das afiliações e designações de participantes.

## What Changes

- Adicionar o módulo **Instituições e laboratórios** à central de Configurações para sessões com `institutional.catalogs.manage`, atualmente concedida aos perfis oficiais Administrador e BraCVAM.
- Criar uma página autenticada para listar instituições e seus laboratórios, com estados de carregamento, vazio, erro e nova tentativa.
- Permitir cadastrar uma instituição informando seu nome e cadastrar laboratórios dentro de uma instituição ativa.
- Permitir renomear instituições e laboratórios conforme os contratos publicados.
- Permitir desativar instituições e laboratórios mediante confirmação acessível, sem apresentar exclusão física ou reativação que a API não oferece.
- Manter a API como autoridade para conflitos, dependências e efeitos da desativação; o frontend não realizará cascatas simuladas.
- Criar simultaneamente títulos, rótulos, validações, confirmações, estados e mensagens em português do Brasil e inglês.
- Manter afiliações de usuários e designações em processos fora desta change.

## Capabilities

### New Capabilities

- `institutional-catalog-management`: consulta e gestão administrativa do catálogo hierárquico de instituições e laboratórios, incluindo criação, renomeação e desativação autorizadas.

### Modified Capabilities

- `settings-page`: incluir Instituições e laboratórios como módulo de Configurações, visível de acordo com `institutional.catalogs.manage`.

## Impact

- Nova página autenticada sob `app/(paginas)/`, acessível pela central de Configurações.
- Novos tipos de domínio em `types/`, serviço server-only e Route Handlers internos para `/institutional/institutions` e `/institutional/laboratories`.
- Alterações nas capacidades e nos cartões da central de Configurações e nos dicionários `pt-BR` e `en`.
- Uso das permissões publicadas `institutional.catalogs.manage` e, quando aplicável para consultas, `institutional.read`.
- Nenhuma nova dependência de frontend e nenhuma criação de afiliação, usuário ou participante de processo.
