## 1. Contrato e sigilo

- [x] 1.1 Ler a documentação instalada do Next.js para Route Handlers, formulários, multipart e respostas binárias.
- [x] 1.2 Confirmar no OpenAPI CRUD de substâncias, SDS, códigos, etiquetas, lookup, QR e conclusão.
- [x] 1.3 Registrar quais papéis recebem `reference_classification`, códigos cegos e ações de edição.
- [ ] 1.4 Validar com sessões reais que respostas de laboratório não expõem o gabarito.

## 2. Tipos e integração protegida

- [x] 2.1 Criar tipos de substância, armazenamento, GHS, SDS, códigos, etiquetas, capacidades, formulários e estados.
- [x] 2.2 Implementar serviço server-only para listar, criar, editar e remover substâncias.
- [x] 2.3 Implementar uploads/downloads de SDS e downloads de etiquetas e QR preservando cabeçalhos seguros.
- [x] 2.4 Implementar lookup por código e conclusão das amostras.
- [x] 2.5 Criar autorizador e Route Handlers internos com allowlists diferentes por papel.
- [x] 2.6 Preservar códigos e mensagens do backend e rejeitar respostas externas inválidas.

## 3. Workspace de amostras

- [x] 3.1 Criar `/processos/[processId]/amostras` dentro do shell autenticado.
- [x] 3.2 Implementar snapshot com carregamento, vazio, erro, acesso negado, desatualização e nova tentativa.
- [x] 3.3 Implementar formulário seccionado de identificação, segurança, armazenamento e acondicionamento.
- [x] 3.4 Validar campos obrigatórios, enumerações, números, datas, temperaturas e conteúdo científico antes do envio.
- [x] 3.5 Implementar criação, edição e remoção confirmada com reconciliação autoritativa.
- [x] 3.6 Implementar seleção, upload, substituição e download de SDS.
- [x] 3.7 Implementar lista paginada de códigos e etiquetas, QR e lookup sob demanda.
- [x] 3.8 Implementar confirmação de conclusão sem avançar localmente a tarefa.

## 4. Navegação e proteção

- [x] 4.1 Adicionar entrada contextual a partir de tarefas e detalhes do processo.
- [x] 4.2 Garantir modo somente leitura para participantes sem capacidade de edição.
- [x] 4.3 Confirmar que classificação, nomes químicos e mapeamento cego não aparecem em payloads de laboratório.

## 5. Internacionalização e verificação

- [x] 5.1 Adicionar todos os textos, enumerações, unidades, validações e nomes acessíveis em `pt-BR` e `en`.
- [x] 5.2 Validar locale em números e datas sem alterar formatos técnicos enviados à API.
- [ ] 5.3 Exercitar CRUD, SDS, códigos, etiquetas, QR, lookup e conclusão contra a API.
- [ ] 5.4 Validar teclado, foco, layout responsivo, upload interrompido e preservação dos formulários.
- [x] 5.5 Executar verificações de i18n, lint, TypeScript, build, diff e OpenSpec estrito.
