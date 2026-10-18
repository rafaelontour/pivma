## 1. Contrato e preparação

- [x] 1.1 Ler a documentação instalada do Next.js 16.3.3 aplicável a páginas autenticadas, Route Handlers, carregamento de dados e mutações antes de alterar o código.
- [x] 1.2 Confirmar no OpenAPI atual os contratos paginados de instituições e laboratórios, os payloads de criação e renomeação, a desativação por `DELETE` e a ausência de reativação.
- [x] 1.3 Confirmar com sessões reais que Administrador e BraCVAM recebem `institutional.catalogs.manage` e que sessões sem essa permissão são recusadas nos endpoints institucionais.

## 2. Domínio e integração protegida

- [x] 2.1 Criar `types/Institucional.ts` com instituições, laboratórios, paginação, entradas de mutação, snapshot, diálogos e estados da interface, sem declarações locais de tipos em outros módulos.
- [x] 2.2 Implementar serviço server-only para percorrer todas as páginas e criar, renomear e desativar instituições e laboratórios conforme o contrato publicado.
- [x] 2.3 Criar Route Handlers internos para o snapshot e as mutações, validando sessão, `institutional.catalogs.manage`, UUIDs e nomes entre 1 e 255 caracteres.
- [x] 2.4 Normalizar respostas externas estritamente e mapear sessão ausente, autorização, conflito, validação, dependência e indisponibilidade para códigos seguros sem expor origem ou credencial.

## 3. Módulo Instituições e laboratórios

- [x] 3.1 Criar a página autenticada `/instituicoes-laboratorios` no shell compartilhado, com retorno para Configurações e estados de carregamento, vazio, erro e nova tentativa.
- [x] 3.2 Implementar a visualização hierárquica de instituições e laboratórios, incluindo situação, instituições sem laboratórios e agrupamento pela referência institucional da API.
- [x] 3.3 Implementar diálogo acessível para cadastrar uma instituição, preservando a entrada e permitindo correção quando a API rejeitar a operação.
- [x] 3.4 Implementar diálogo acessível para cadastrar um laboratório em uma instituição ativa, exigindo instituição e nome antes do envio.
- [x] 3.5 Implementar renomeação de instituições e laboratórios sem alterar identificadores ou vínculos e reconciliar o snapshot após sucesso.
- [x] 3.6 Implementar confirmações próprias para desativar instituições e laboratórios, sem usar confirmação nativa, simular cascata, remover fisicamente ou oferecer reativação.
- [x] 3.7 Bloquear mutações concorrentes, tratar conflitos com reconsulta e não repetir automaticamente uma mutação aceita quando a reconciliação falhar.

## 4. Central de Configurações

- [x] 4.1 Ampliar as capacidades e os tipos de Configurações com `canManageInstitutionalCatalog`, derivado exclusivamente de `institutional.catalogs.manage`.
- [x] 4.2 Adicionar o cartão Instituições e laboratórios à central, com ícone, descrição, ação e estado restrito coerentes com os módulos existentes.
- [x] 4.3 Atualizar a regra de acesso à central para considerar o novo módulo e validar o cartão em sessões Administrador, BraCVAM e sem permissão institucional.

## 5. Internacionalização e acessibilidade

- [x] 5.1 Adicionar simultaneamente aos dicionários `pt-BR` e `en` todos os títulos, descrições, rótulos, placeholders, estados, validações, confirmações, toasts, erros seguros e nomes acessíveis.
- [x] 5.2 Preservar nomes cadastrados sem tradução automática e localizar datas, estados e ordenação textual conforme o locale ativo.
- [x] 5.3 Validar foco inicial, contenção e restauração de foco nos diálogos, Escape, navegação por teclado, nomes acessíveis e layout estreito.

## 6. Verificação integrada

- [ ] 6.1 Validar o estado vazio real e o fluxo `criar instituição → criar laboratório → renomear ambos → desativar laboratório → desativar instituição` contra a API atual.
- [ ] 6.2 Verificar nomes inválidos, duplicidade, conflito concorrente, falha de reconciliação, dependências de desativação e recusa para sessão sem permissão.
- [ ] 6.3 Confirmar por inspeção de rede que o navegador usa somente rotas internas e que nenhuma operação cria afiliação, usuário ou participante de processo.
- [ ] 6.4 Executar `pnpm i18n:check`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `git diff --check` e `openspec validate add-institutional-catalog-settings --strict`.
