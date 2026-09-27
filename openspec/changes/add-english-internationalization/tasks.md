## 1. Preparação e inventário

- [x] 1.1 Consultar a documentação instalada do Next.js 16.3.3 sobre internacionalização, cookies, layouts, metadados e fronteiras entre Server e Client Components antes de alterar essas áreas.
- [x] 1.2 Inventariar textos próprios em `app/` e `components/`, classificando interface traduzível, nomes próprios, valores técnicos e conteúdo configurável da API; registrar a allowlist e um glossário BraCVAM/Fiocruz português-inglês.
- [x] 1.3 Instalar `i18next` e `react-i18next` com `pnpm`, sem adicionar backend remoto de tradução nem dependência de serviço pago.

## 2. Fundação de internacionalização

- [x] 2.1 Criar em `types/I18n.ts` os locales suportados e as propriedades compartilhadas do provider, botão de alternância e utilitários de formatação.
- [x] 2.2 Criar `i18n/locales/pt-BR.json` e `i18n/locales/en.json` com estrutura hierárquica idêntica, fallback essencial e chaves semânticas organizadas por módulo.
- [x] 2.3 Implementar configuração e provider cliente com instância isolada por árvore, recursos estáticos, fallback `pt-BR`, interpolação segura e locale inicial validado.
- [x] 2.4 Integrar o provider ao layout raiz, validar a preferência não sensível do cookie, declarar o `lang` correto no primeiro HTML e localizar os metadados controlados pela aplicação.
- [x] 2.5 Ampliar os tipos e a normalização da sessão para aceitar `preferred_locale` opcional sem rejeitar respostas do backend que ainda não publiquem o campo.
- [x] 2.6 Criar um script `pnpm` que falhe quando os dicionários divergirem em chaves, tipos de valores ou variáveis de interpolação.

## 3. Seleção e persistência do idioma

- [x] 3.1 Implementar o `LanguageToggle` acessível para alternar diretamente entre Português e English, com foco visível, nome que comunique o idioma de destino, gravação segura do cookie e atualização imediata do documento.
- [x] 3.2 Adicionar o botão à barra do cabeçalho público de autenticação sem aumentar a rolagem ou prejudicar os layouts responsivos existentes.
- [x] 3.3 Adicionar o botão ao grupo de ações do header autenticado, preservando altura, autorização, logout, item ativo e estado recolhido da sidebar.
- [x] 3.4 Implementar a resolução na ordem cookie válido, `session.user.preferred_locale` e fallback `pt-BR`, persistindo no cookie a preferência válida obtida da sessão.
- [ ] 3.5 Validar cookie e sessão concordantes ou divergentes, cookie inválido, sessão sem o novo campo, navegação, recarregamento e troca durante formulário ou diálogo parcialmente preenchido.

## 4. Mensagens, formatos e componentes compartilhados

- [ ] 4.1 Migrar componentes compartilhados, diálogos, toaster, mensagens genéricas, estados de carregamento/vazio e nomes acessíveis para chaves de tradução.
- [ ] 4.2 Criar utilitários dependentes do locale para datas, horas, números, moedas, custos, durações e ordenação textual, removendo locales de apresentação fixos em `pt-BR`.
- [ ] 4.3 Substituir tabelas de rótulos de enums e estados por resolução localizada, preservando os identificadores técnicos usados em payloads e filtros.
- [ ] 4.4 Adicionar códigos estáveis às respostas de erro das Route Handlers internas e resolver no cliente mensagens seguras localizadas, mantendo texto em português apenas como fallback temporário de compatibilidade.

## 5. Autenticação e navegação

- [x] 5.1 Migrar apresentação, login, cadastro, critérios de senha, validações e feedbacks da área pública para os dicionários.
- [x] 5.2 Migrar shell autenticado, títulos de página, sidebar, perfil, logout, configurações e página inicial para os dicionários.
- [ ] 5.3 Verificar login, cadastro, sessão expirada, logout e negações de acesso em ambos os idiomas sem alterar credenciais, cookies de sessão ou destinos.

## 6. Módulos administrativos

- [x] 6.1 Migrar diretório de usuários, gestão individual, perfis e permissões, incluindo filtros, diálogos, validações e toasts.
- [ ] 6.2 Migrar catálogo e editor de formulários, campos dinâmicos e regras de IA, preservando textos configuráveis recebidos do backend.
- [ ] 6.3 Migrar biblioteca de avaliações por IA, critérios, versões, testes, publicação e associações, mantendo payloads e identificadores inalterados.
- [ ] 6.4 Migrar central de configurações e verificar permissões, estados vazios, falhas e fluxos de edição dos três módulos em português e inglês.

## 7. Fluxos operacionais

- [ ] 7.1 Migrar catálogo, rascunhos, formulário, anexos, acompanhamento e pré-avaliação de submissões, preservando valores e arquivos ao trocar o idioma.
- [x] 7.2 Migrar Kanban, detalhes e sincronização de processos, localizando rótulos conhecidos e mantendo estados desconhecidos no valor original.
- [x] 7.3 Migrar fila, proposta, pareceres, feedbacks, decisão e timeline de triagem sem traduzir conteúdo científico ou texto fornecido por pessoas.
- [x] 7.4 Migrar observabilidade operacional e de IA, incluindo filtros, conexão, eventos, etapas e formatos numéricos, sem traduzir payloads técnicos inspecionados.

## 8. Tradução inglesa e qualidade

- [ ] 8.1 Gerar uma primeira versão dos valores de `en.json` com ferramenta gratuita de IA, enviando somente o dicionário controlado e exigindo preservação exata de chaves, placeholders e estrutura.
- [ ] 8.2 Revisar humanamente o inglês com o glossário institucional e técnico, corrigindo terminologia, voz, acessibilidade e textos que dependam de contexto.
- [ ] 8.3 Auditar literais restantes em `app/` e `components/`, documentar somente exceções legítimas na allowlist e confirmar que nenhuma chave de tradução aparece na interface.
- [x] 8.4 Executar a verificação de dicionários, `pnpm lint`, `pnpm exec tsc --noEmit`, `git diff --check`, `pnpm build` e `openspec validate add-english-internationalization --strict`, registrando separadamente limitações ambientais ou falhas preexistentes.
- [ ] 8.5 Executar roteiros responsivos, por teclado e com tecnologia assistiva em login, cadastro, shell, formulários, diálogos, submissões, Kanban, triagem e observabilidade nos dois idiomas.
- [ ] 8.6 Confirmar por inspeção de rede que a troca de idioma não chama serviços de tradução, não envia conteúdo da sessão a terceiros e mantém o navegador restrito às rotas internas já previstas.
