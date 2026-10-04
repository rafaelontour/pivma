## Context

Veja [proposal.md](./proposal.md) para a motivação. O shell só é renderizado depois de `/api/auth/me` confirmar uma sessão, mas hoje calcula `canViewSubmissions` a partir do perfil global `Proponente` ou do papel local `proponent`. Nenhum desses valores existe para uma conta nova. Em contraste, as rotas internas de catálogo e criação exigem apenas o cookie de sessão, refletindo o contrato da API externa.

## Goals / Non-Goals

**Goals:**

- Fazer a navegação refletir o pré-requisito real de criação publicado pela API: sessão autenticada.
- Preservar o isolamento posterior dos processos por escopo local `proponent`.
- Remover estado e tipagem condicionais que deixariam de representar uma decisão de autorização.

**Non-Goals:**

- Alterar cadastro, perfis, permissões ou payloads de mutação da submissão.
- Simular sucesso quando a API recusar catálogo ou criação.
- Tornar públicas páginas ou rotas autenticadas.
- Relaxar as verificações de pertencimento usadas para rascunhos, formulários, anexos e acompanhamento.

## Decisions

### Link de Submissões incondicional dentro do shell autenticado

O componente da barra lateral renderizará Submissões sempre que o próprio shell estiver montado. A propriedade `canViewSubmissions` será removida do contrato compartilhado e do componente, em vez de ser passada permanentemente como `true`, porque ela não representa mais uma capacidade variável.

Alternativa considerada: manter a propriedade com valor constante. Isso preservaria complexidade sem comunicar uma decisão real e facilitaria a reintrodução acidental da condição incorreta.

### API permanece como autoridade de autorização

Mostrar o link não transforma recusas externas em sucesso. O catálogo e a criação continuarão passando pelas rotas internas existentes, que exigem sessão e preservam `401`, `403`, `404`, `409` e `422`. Se o backend futuramente introduzir uma permissão explícita de criação, uma nova mudança deverá usar essa capacidade publicada tanto na rota quanto na navegação.

Alternativa considerada: criar um perfil vazio somente para controlar o menu. O perfil não seria verificado por `POST /processes`, exigiria credencial administrativa durante o cadastro e produziria uma aparência de segurança sem autorização efetiva.

### Escopo local continua protegendo processos existentes

A abertura do catálogo e a criação inicial não dependem de escopos. Após a criação, a API associa o papel local `proponent`; as rotas de rascunho e acompanhamento continuarão filtrando os identificadores presentes nesses escopos. Esta mudança não remove nem amplia essas verificações.

### Normalizador canônico para processos listados

`GET /processes` devolve cada template como `{ key, name, version }` dentro de `template`. O normalizador duplicado de submissões valida prematuramente `template_key` e `version_number` na raiz e converte a resposta válida em falha sem status, apresentada como `502`. A listagem passará cada item por `normalizeProcessInstance`, já usado com sucesso na criação e na consulta de processo, antes de validar a página e aplicar o filtro de escopos.

Alternativa considerada: ampliar apenas o type guard duplicado em `services/Submissao.ts`. Isso manteria duas implementações do mesmo contrato sujeitas a nova divergência.

## Risks / Trade-offs

- [Contas administrativas também verão Submissões] → Esse é o comportamento coerente com `POST /processes` enquanto a API aceitar qualquer sessão; futuras restrições devem nascer no backend e ser refletidas no frontend.
- [O backend pode recusar uma conta autenticada por regra não publicada] → Manter a resposta real e a mensagem segura já tratada pelas rotas internas.
- [A mudança pode ser confundida com acesso aos processos de terceiros] → Preservar integralmente os filtros server-only por papel local `proponent` e verificar esse isolamento.

## Migration Plan

1. Remover a condição e a propriedade `canViewSubmissions` do shell e de seus tipos.
2. Reutilizar o normalizador canônico na listagem paginada de rascunhos e submissões enviadas.
3. Validar uma conta sem perfis e escopos, a criação do primeiro processo, o aparecimento posterior do escopo local e a presença do processo em Meus rascunhos.
4. Em rollback, restaurar a condição e o normalizador anteriores; nenhuma configuração, credencial ou dado externo precisa ser migrado.
