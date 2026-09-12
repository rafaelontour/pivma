## Why

O backend e o frontend descrevem separadamente os tipos de campos e suas regras de validação, permitindo divergências silenciosas em formulários dinâmicos. A plataforma precisa publicar um contrato preciso e gerar dele a tipagem TypeScript, mantendo validação imediata na interface e validação autoritativa no servidor.

## What Changes

- Publicar no OpenAPI um contrato discriminado por `field_type`, com tipos de campo, opções e regras compatíveis explicitamente modelados.
- Gerar e verificar automaticamente os tipos TypeScript do frontend a partir de um snapshot versionado do OpenAPI, removendo duplicações manuais do contrato externo.
- Interpretar no frontend as regras retornadas pela instância do formulário para apresentar restrições e erros junto aos campos.
- Validar no backend tanto a coerência da definição do template quanto os valores recebidos para salvar ou concluir um formulário.
- Preservar a versão do template vinculada à instância, de modo que um rascunho continue sujeito às regras com que foi criado.
- Retornar erros estruturados por `field_key` e regra, permitindo que a interface destaque todos os campos rejeitados sem depender de mensagens textuais.

## Capabilities

### New Capabilities

- `dynamic-form-contracts`: contrato discriminado dos campos, geração de tipos a partir do OpenAPI, validação autoritativa e detecção automatizada de divergência entre backend e frontend.

### Modified Capabilities

- `dynamic-process-forms`: o preenchimento passa a aplicar as regras da instância versionada, apresentar erros por campo e impedir envio localmente inválido sem substituir a validação do backend.

## Impact

- Backend FastAPI/Pydantic: schemas de campos, regras, opções, respostas de formulário e erros de validação; validação de templates e valores dinâmicos.
- Frontend Next.js: tipos gerados em `types/`, adaptadores de domínio, renderização de restrições, mensagens por campo e integração com erros estruturados.
- Tooling e CI: snapshot determinístico do OpenAPI, comando de geração e verificação de tipos desatualizados.
- Dados persistidos: nenhuma mudança de formato é obrigatória para `form_fields`; definições existentes precisarão ser verificadas contra o contrato mais estrito antes da ativação.
