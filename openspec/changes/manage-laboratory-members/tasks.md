## 1. Dependências e contratos

- [ ] 1.1 Confirmar que `add-institutional-catalog-settings` foi concluída ou reconciliar esta change com a versão final da página de instituições e laboratórios.
- [ ] 1.2 Solicitar e confirmar no OpenAPI uma consulta paginada de afiliações ativas por `laboratory_id`, protegida por `institutional.affiliations.manage`, sem implementar varredura N+1 do diretório.
- [ ] 1.3 Confirmar os contratos atuais de criação, listagem por usuário e desativação de afiliações, incluindo conflitos, conta inativa, laboratório inativo e correspondência entre instituição e laboratório.
- [ ] 1.4 Validar com sessões reais que Administrador e BraCVAM possuem `institutional.affiliations.manage` e `users.read`, e que Proponente ou sessão sem permissão recebe recusa segura.
- [ ] 1.5 Ler a documentação instalada da versão atual do Next.js aplicável a Route Handlers, páginas autenticadas, consultas paginadas e mutações antes de alterar código.

## 2. Domínio e integração protegida

- [ ] 2.1 Criar ou ampliar tipos institucionais em `types/` para afiliação, membro, paginação, entradas, snapshot, diálogos e estados da interface, sem tipos locais em páginas, componentes, rotas ou serviços.
- [ ] 2.2 Implementar serviços server-only para listar membros por laboratório, consultar afiliações de um usuário, criar afiliação e desativar vínculo, normalizando estritamente todas as respostas.
- [ ] 2.3 Criar Route Handlers internos para membros do laboratório e mutações de afiliação, repetindo sessão, `institutional.affiliations.manage`, permissões de leitura e validação de UUIDs.
- [ ] 2.4 Derivar `institution_id` e `laboratory_id` do laboratório contextual no servidor e recusar valores ausentes, nulos, malformados, inativos ou divergentes antes da mutação externa.
- [ ] 2.5 Mapear autenticação, autorização, recurso inexistente, conflito, validação, limitação e indisponibilidade para códigos seguros, sem expor origem, cookie ou credencial externa.

## 3. Gestão de membros no laboratório

- [ ] 3.1 Adicionar a ação **Gerenciar membros** somente aos laboratórios ativos e às sessões com `institutional.affiliations.manage`.
- [ ] 3.2 Implementar painel ou diálogo acessível que identifique instituição e laboratório e apresente carregamento, lista paginada, estado vazio, erro e nova tentativa.
- [ ] 3.3 Integrar busca paginada de contas ativas pelo diretório, preservando o texto pesquisado e exigindo a seleção de uma identidade persistida.
- [ ] 3.4 Manter a confirmação de inclusão desabilitada até que usuário, instituição e laboratório estejam completos e válidos, repetindo a validação no envio e no servidor.
- [ ] 3.5 Criar a afiliação e reconciliar a lista autoritativa sem criar usuário, perfil, convite ou participante de processo.
- [ ] 3.6 Implementar confirmação própria para desativar vínculo, identificando pessoa e laboratório sem apresentar exclusão física ou reativação.
- [ ] 3.7 Bloquear mutações concorrentes, tratar duplicidade com reconsulta e não repetir automaticamente uma operação aceita quando a reconciliação falhar.

## 4. Internacionalização e acessibilidade

- [ ] 4.1 Adicionar simultaneamente a `pt-BR` e `en` títulos, instruções, campos, estados, validações, confirmações, toasts, erros seguros e nomes acessíveis.
- [ ] 4.2 Preservar nomes, usuários, e-mails, instituições e laboratórios recebidos do backend sem tradução automática e localizar datas, contagens e ordenação conforme o locale ativo.
- [ ] 4.3 Validar foco inicial, contenção e restauração de foco, Escape, navegação por teclado, controles desabilitados, mensagens anunciadas e layout estreito e largo.

## 5. Verificação integrada

- [ ] 5.1 Validar listagem vazia e paginada de membros sem chamadas N+1 e confirmar por rede que o navegador utiliza somente rotas internas.
- [ ] 5.2 Exercitar `buscar usuário ativo → selecionar → adicionar ao laboratório → reconciliar → desativar vínculo`, usando somente contas de teste explicitamente indicadas e limpando o vínculo temporário ao final.
- [ ] 5.3 Verificar dados nulos ou incompletos, usuário inativo, laboratório inativo, instituição divergente, duplicidade, conflito concorrente, falha de reconciliação e recusa de sessão sem permissão.
- [ ] 5.4 Confirmar que adicionar um membro não cria perfil, convite, participante ou papel de processo e que desativar a afiliação não altera designações já governadas por outros fluxos.
- [ ] 5.5 Executar `pnpm i18n:check`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `git diff --check` e `openspec validate manage-laboratory-members --strict`.
