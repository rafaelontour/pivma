## Context

As operações de recebimento são contextualizadas por processo, frasco cego e laboratório efetivo da sessão. Fotos usam multipart e download protegido. Não conformidades possuem ciclo de decisão próprio. O sigilo impede que dados da substância sejam enviados ao navegador do laboratório.

## Goals / Non-Goals

**Goals:**

- Entregar um fluxo rápido de conferência por código e registro de recebimento.
- Isolar dados por laboratório e processo no servidor.
- Tratar fotos e não conformidades sem romper o cegamento.

**Non-Goals:**

- Definir substâncias ou gerar códigos.
- Decodificar QR no navegador nesta primeira entrega; o código poderá ser informado ou colado.
- Resolver automaticamente uma não conformidade sem decisão explícita.

## Decisions

### 1. Contexto derivado da sessão

Route Handlers localizarão o escopo de processo e laboratório. Identificadores de laboratório enviados pelo cliente não serão usados como autoridade.

### 2. Verificação e registro são operações separadas

O check será somente leitura e precederá a confirmação. O registro será bloqueado enquanto outra mutação estiver em voo.

### 3. Snapshot limitado ao laboratório

Lista de frascos e não conformidades será normalizada por allowlist. Campos científicos protegidos serão descartados mesmo se aparecerem inesperadamente.

### 4. Fotos são transmitidas sob demanda

Uploads usarão multipart server-only; visualização e download passarão por rota interna. URLs externas e cookies não chegarão ao cliente.

### 5. Conflito leva à reconsulta

Respostas de duplicidade ou concorrência não repetirão POST. O item será recarregado para mostrar quem já registrou o estado.

## Risks / Trade-offs

- [A câmera móvel produz arquivos grandes] → aplicar limites do contrato antes do upload e feedback de progresso básico.
- [Um código pode ser tentado em laboratório incorreto] → validar escopo no servidor e confiar na recusa autoritativa da API.
- [Dados protegidos podem aparecer em erros] → apresentar apenas código estável e mensagem segura publicada.

## Migration Plan

1. Publicar consulta de frascos e check por código.
2. Validar isolamento com duas sessões laboratoriais.
3. Habilitar recebimento e fotos.
4. Habilitar não conformidades e decisões.
5. Em rollback, retirar a navegação sem remover registros externos.
