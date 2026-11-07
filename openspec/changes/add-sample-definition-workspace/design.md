## Context

O frontend não possui domínio de amostras. A API trabalha por `process_id`, retorna substâncias com dados de segurança e códigos cegos e separa SDS, etiquetas, lookup, QR e conclusão em operações específicas. A classificação de referência possui restrição de leitura e exige cuidado para não atravessar a fronteira do cegamento.

## Goals / Non-Goals

**Goals:**

- Representar integralmente o contrato de substâncias sem vazar campos protegidos.
- Suportar edição retomável, uploads e downloads por rotas internas.
- Dirigir a conclusão pela tarefa e resposta autoritativa.

**Non-Goals:**

- Gerar códigos cegos no navegador.
- Traduzir conteúdo científico.
- Implementar recebimento de amostras, tratado em change separada.

## Decisions

### 1. Workspace próprio por processo

A rota `/processos/[processId]/amostras` carregará um snapshot com tarefa, capacidades e substâncias. Isso reduz o tamanho da composição e permite formulários extensos.

### 2. Modelos de leitura distintos por capacidade

O servidor normalizará somente os campos presentes e autorizados. O cliente não receberá `reference_classification` quando a resposta segura do papel não a contiver; nenhum placeholder revelará sua existência.

### 3. Formulário estruturado por seções

Identificação, segurança, armazenamento e acondicionamento serão seções do mesmo formulário. Valores numéricos e datas respeitarão o locale na apresentação e o formato técnico no payload.

### 4. Arquivos passam pelo servidor

SDS e QR/etiquetas serão transferidos por Route Handlers internos, preservando nome, tipo e disposição. O arquivo selecionado não será serializado em estado persistente do navegador.

### 5. Conclusão exige confirmação e reconsulta

O POST de conclusão será separado do salvamento. Após sucesso, tarefas, substâncias e processo serão recarregados; a interface não avançará localmente.

## Risks / Trade-offs

- [Campos protegidos podem aparecer em respostas diferentes por papel] → normalização por allowlist e inspeção de rede com contas de laboratório e seleção.
- [Uploads grandes ou interrompidos] → preservar seleção quando possível e comunicar falha sem repetir automaticamente.
- [Enumerações podem evoluir] → manter identificador técnico e rótulo localizado, exibindo desconhecidos sem habilitar envio.
- [Muitos códigos e etiquetas] → usar paginação e download sob demanda.

## Migration Plan

1. Publicar tipos, serviço e rotas somente de leitura.
2. Validar diferenças de payload por papel.
3. Habilitar CRUD e SDS.
4. Habilitar etiquetas, QR, lookup e conclusão.
5. Em rollback, remover a navegação; amostras persistidas permanecem intactas.
