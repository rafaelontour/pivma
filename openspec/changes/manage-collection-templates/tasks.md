## 1. Contrato e autorização

- [x] 1.1 Ler a documentação instalada do Next.js para páginas administrativas, Route Handlers e downloads binários.
- [x] 1.2 Confirmar no OpenAPI contratos de templates, colunas, paginação, remoção e exportação CSV/XLSX.
- [ ] 1.3 Identificar e validar com sessões reais a permissão efetiva de leitura e gestão.
- [x] 1.4 Registrar como dependência externa qualquer operação necessária que não esteja publicada, sem simular PDF ou associação ao processo.

## 2. Domínio e serviços

- [x] 2.1 Criar tipos de template, coluna, enumerações, paginação, editor, diálogos e estados da interface.
- [x] 2.2 Implementar serviço server-only para catálogo, detalhe, criação, edição e ciclo de vida do template.
- [x] 2.3 Implementar serviço de listagem e mutações de colunas, incluindo ordem autoritativa.
- [x] 2.4 Implementar download protegido em CSV e XLSX com nome e tipo corretos.
- [x] 2.5 Criar Route Handlers internos validando sessão, UUIDs, chaves, tipos, limites e formatos.
- [x] 2.6 Preservar códigos externos e tratar paginação ou snapshots incompletos como erro.

## 3. Módulo administrativo

- [x] 3.1 Criar página autenticada de templates de coleta e cartão condicionado em Configurações.
- [x] 3.2 Implementar catálogo com carregamento, vazio, erro, busca local e nova tentativa.
- [x] 3.3 Implementar criação e edição de nome, descrição, mínimo de experimentos e réplicas.
- [x] 3.4 Implementar editor de colunas com tipos, restrições e controles acessíveis de ordem.
- [x] 3.5 Implementar confirmação para remoção ou desativação conforme o contrato real.
- [x] 3.6 Implementar exportação CSV/XLSX e feedback de download.
- [x] 3.7 Bloquear mutações concorrentes e reconciliar após sucesso ou conflito.

## 4. Internacionalização e verificação

- [x] 4.1 Adicionar títulos, campos, tipos, validações, confirmações, erros e nomes acessíveis nos dois idiomas.
- [ ] 4.2 Validar teclado, foco, layout estreito, reordenação e preservação de entrada em falhas.
- [ ] 4.3 Exercitar criação, edição, colunas, concorrência, dependências e downloads reais.
- [ ] 4.4 Confirmar por rede que arquivos e dados passam somente pelas rotas internas.
- [x] 4.5 Executar verificações de i18n, lint, TypeScript, build, diff e OpenSpec estrito.
