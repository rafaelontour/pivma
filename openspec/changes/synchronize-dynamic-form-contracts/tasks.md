## 1. Preparação do contrato entre repositórios

- [ ] 1.1 Criar e aprovar no repositório backend o artefato de planejamento correspondente, referenciando os requisitos desta change
- [ ] 1.2 Inventariar os `field_type`, formatos de `options` e propriedades de `validation_rules` usados pelos templates existentes
- [ ] 1.3 Verificar como cada instância referencia ou copia a versão do template e registrar se será necessária alteração de persistência
- [ ] 1.4 Criar fixtures de contrato compartilháveis que cubram uma definição válida e casos inválidos para cada tipo de campo suportado

## 2. Contrato discriminado no backend

- [ ] 2.1 Definir schemas Pydantic estritos para regras de texto, número, seleção, data, booleano e arquivo
- [ ] 2.2 Definir as variantes de campo discriminadas por `field_type` e usá-las nas respostas de instância de formulário
- [ ] 2.3 Validar opções, regras desconhecidas e combinações incompatíveis ao carregar ou publicar definições de template
- [ ] 2.4 Confirmar no OpenAPI gerado que os campos são publicados como união discriminada com todas as variantes esperadas
- [ ] 2.5 Adicionar testes de schema e OpenAPI para variantes válidas, propriedades extras e regras incompatíveis

## 3. Validação autoritativa no backend

- [ ] 3.1 Implementar o índice de campos da instância e a validação de tipos, opções e restrições dos valores presentes
- [ ] 3.2 Aplicar validação parcial no salvamento de rascunho sem exigir campos ausentes
- [ ] 3.3 Aplicar validação completa na conclusão, distinguindo ausência de valores válidos como `false` e `0`
- [ ] 3.4 Retornar erros agregados com `field_key`, código estável e mensagem segura, incluindo suporte a violações globais
- [ ] 3.5 Garantir que carregamento, salvamento e conclusão resolvam a definição vinculada à versão da instância
- [ ] 3.6 Adicionar testes dos endpoints para múltiplos erros, valores falsos, chaves inesperadas, rascunhos parciais e versões antigas

## 4. Geração e adaptação de tipos no frontend

- [ ] 4.1 Adicionar `openapi-typescript` como dependência de desenvolvimento e definir scripts `pnpm` de geração e verificação
- [ ] 4.2 Versionar um snapshot OpenAPI normalizado e gerar seu arquivo TypeScript determinístico dentro de `types/`
- [ ] 4.3 Criar em `types/` os tipos de domínio necessários para campos, valores e erros sem redeclará-los em componentes, rotas ou serviços
- [ ] 4.4 Implementar o adaptador entre o contrato gerado e o domínio, preservando o discriminante e tratando explicitamente variantes desconhecidas
- [ ] 4.5 Remover as duplicações manuais de tipos e regras que tenham sido substituídas pelo contrato gerado
- [ ] 4.6 Adicionar à integração contínua a verificação de que snapshot e tipos gerados permanecem sincronizados

## 5. Validação dinâmica na interface

- [ ] 5.1 Organizar renderização, conversão de entrada e validação local em um registro exaustivo por `field_type`
- [ ] 5.2 Aplicar às entradas as restrições retornadas pela instância e exibir orientação compreensível junto aos campos
- [ ] 5.3 Validar todos os valores antes de salvar ou concluir, preservar o preenchimento e focar ou destacar os campos inválidos
- [ ] 5.4 Mapear os erros estruturados do backend para os respectivos campos e apresentar separadamente erros globais
- [ ] 5.5 Exibir tipos futuros desconhecidos de forma identificável e impedir conclusão que possa omitir ou corromper seus valores
- [ ] 5.6 Adicionar testes unitários para cada variante, limites, opções, arquivos, múltiplos erros e retomada de definição versionada

## 6. Migração e verificação integrada

- [ ] 6.1 Criar e executar uma auditoria reproduzível dos templates persistidos contra os schemas estritos
- [ ] 6.2 Corrigir ou migrar as definições incompatíveis sem alterar as regras vinculadas a instâncias existentes
- [ ] 6.3 Executar testes de contrato com as mesmas fixtures no backend e no frontend e corrigir diferenças de semântica
- [ ] 6.4 Validar o fluxo completo de criar, salvar, retomar e concluir formulários com cada tipo de campo suportado
- [ ] 6.5 Documentar a ordem de implantação compatível e verificar o procedimento de recuo antes de ativar a rejeição estrita
- [ ] 6.6 Executar lint, testes e build dos dois repositórios e registrar a evidência final da change
