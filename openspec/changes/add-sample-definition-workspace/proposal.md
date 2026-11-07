## Why

Depois da composição da equipe, a API já permite definir substâncias, dados de segurança, classificação de referência, frascos e códigos cegos, mas o frontend não oferece essa etapa. Isso interrompe o processo antes da preparação e distribuição das amostras.

## What Changes

- Criar um workspace por processo para listar, cadastrar, editar e remover substâncias conforme a tarefa acionável.
- Cobrir identificação química, lote, pureza, solubilidade, armazenamento, embalagem, quantidade, riscos GHS e instruções de manuseio.
- Permitir anexar, substituir e baixar a SDS de cada substância.
- Apresentar códigos cegos, etiquetas, QR codes e consulta segura por código conforme a autorização publicada.
- Permitir concluir a definição das amostras somente quando a API confirmar que o conjunto está válido.

## Capabilities

### New Capabilities

- `process-sample-definition`: definição, segurança, cegamento, identificação e conclusão das amostras de um processo.

### Modified Capabilities

Nenhuma.

## Impact

- Novos tipos, serviços server-only, Route Handlers e páginas em `/processos/[processId]/amostras`.
- Integração com `/processes/{id}/samples*`, incluindo uploads e downloads protegidos.
- Autorização por tarefa, papel local e regras de sigilo da classificação de referência.
- Internacionalização integral em português e inglês.
