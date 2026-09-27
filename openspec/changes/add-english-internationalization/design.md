## Context

Veja [proposal.md](./proposal.md) para a motivação. O layout raiz declara hoje `lang="pt-BR"`, os metadados são estáticos em português e textos próprios aparecem diretamente em pelo menos 74 arquivos de `app/` e `components/`, incluindo validações, toasts, nomes acessíveis e formatadores com locale fixo. A maior parte das experiências interativas já está em Client Components, enquanto páginas e layouts finos permanecem no servidor.

A implementação deve preservar App Router, URLs atuais, fronteiras cliente-servidor e a regra de manter tipos compartilhados em `types/`. Conteúdo configurável e dados de domínio chegam pela API sem um contrato de tradução, as Route Handlers internas produzem atualmente mensagens textuais em português e o objeto de sessão ainda não publica `preferred_locale`.

## Goals / Non-Goals

**Goals:**

- Estabelecer uma única infraestrutura de tradução reutilizável por todos os módulos.
- Evitar diferença de idioma entre o primeiro HTML e a interface hidratada.
- Permitir troca instantânea sem perder estado local e preservar a escolha entre páginas.
- Manter chaves, interpolações e formatos verificáveis antes da liberação.
- Permitir que ferramentas gratuitas de IA acelerem a criação inicial do inglês sem participar do produto executável.

**Non-Goals:**

- Criar URLs como `/pt-BR/inicio` ou `/en/inicio`.
- Traduzir conteúdo configurável no backend, texto digitado por pessoas, documentos ou nomes próprios.
- Adicionar tradução automática, serviço remoto de localização ou painel de gestão de traduções.
- Alterar permissões, fluxos de processo ou contratos da API externa.
- Implementar nesta entrega a gravação de locale na conta ou a modelagem multilíngue dos cadastros do backend; essas integrações ficam preparadas, mas dependem de uma change própria no serviço externo.
- Suportar idiomas além de português do Brasil e inglês nesta entrega.

## Decisions

### 1. Usar `i18next` com `react-i18next` e recursos JSON empacotados

A aplicação usará `i18next` para resolução, fallback e interpolação e `react-i18next` para contexto e hooks React. Os recursos ficarão em `i18n/locales/pt-BR.json` e `i18n/locales/en.json`, com chaves semânticas hierárquicas organizadas por módulo (`common`, `auth`, `navigation`, `submissions`, `processes`, `forms`, `aiEvaluations`, `triage`, `observability`, `users` e `settings`). Os dois arquivos serão importados estaticamente no bundle, sem backend HTTP de tradução.

Um único arquivo por idioma foi escolhido por corresponder ao fluxo de tradução proposto e tornar simples a validação de paridade nesta primeira entrega. A divisão posterior por namespace continua possível se o tamanho dos recursos passar a afetar o carregamento.

Alternativas consideradas: dicionários próprios sem biblioteca repetiriam fallback, pluralização e integração React; carregar JSON por HTTP introduziria estado adicional de rede; tradução em runtime enviaria conteúdo da plataforma a terceiros e criaria custo, latência e risco de privacidade.

### 2. Manter URLs estáveis e resolver o locale por preferência persistida

Os locales suportados serão `pt-BR` e `en`, com `pt-BR` como fallback. O botão gravará uma preferência não sensível em cookie próprio com `SameSite=Lax` e chamará `changeLanguage` para atualizar a árvore cliente imediatamente. O layout raiz lerá e validará esse cookie para fornecer o locale inicial ao provider e declarar o atributo `lang` correto no primeiro HTML. O botão também atualizará `document.documentElement.lang` na troca instantânea.

Quando existir um cookie válido, ele será a fonte prioritária e a sessão não o substituirá. Quando não existir cookie válido, o shell autenticado usará o campo opcional `session.user.preferred_locale`; se o valor for suportado, aplicará o idioma e gravará o cookie para as páginas seguintes. Se o campo estiver ausente ou for inválido, a aplicação continuará em `pt-BR`. Essa ordem permite que o frontend funcione agora e passe a aproveitar a preferência da conta automaticamente quando o backend começar a publicá-la.

O cookie não será encaminhado à API externa e não conterá identidade ou dados funcionais. Centralizar o nome, os valores aceitos, a presença de cookie válido e a normalização evita leituras divergentes. Os tipos de locale, o campo opcional da sessão e as propriedades dos componentes ficarão em `types/I18n.ts` e no tipo de autenticação correspondente.

Alternativas consideradas: `localStorage` isolado causaria primeiro render sempre em português e possível flash após hidratação; usar sempre a preferência da sessão impediria uma escolha mais recente no navegador; detecção automática por `Accept-Language` poderia surpreender pessoas que esperam português; segmentos de rota exigiriam reorganizar todas as páginas e alterar URLs existentes.

### 3. Criar uma instância isolada e um provider cliente no topo da aplicação

Um Client Component compartilhado criará a instância do i18next com os recursos estáticos, `fallbackLng: "pt-BR"`, locale inicial validado e escape de interpolação delegado ao React. A instância não será um singleton mutável compartilhado entre renderizações de servidor, evitando vazamento de idioma entre requisições. O provider envolverá as páginas no layout raiz.

Componentes interativos usarão `useTranslation`. Conteúdo atualmente escrito em Server Components será movido para componentes cliente de apresentação ou receberá strings já resolvidas por um utilitário que lê os mesmos recursos; não haverá um segundo conjunto de traduções. Metadados localizáveis serão produzidos a partir do locale validado quando a API de metadata permitir leitura request-time.

### 4. Colocar o botão de alternância nos pontos globais existentes

Um componente reutilizável `LanguageToggle` será exibido na barra do cabeçalho da página pública de autenticação e no grupo de ações do `AuthenticatedShell`. O botão compacto alternará diretamente entre `pt-BR` e `en`, terá foco visível e usará um nome acessível traduzido que comunique o idioma de destino. A troca não chamará `router.refresh`, para preservar formulários, diálogos e estados não enviados.

### 5. Traduzir mensagens controladas e preservar conteúdo de domínio

Todo texto criado pelo frontend será substituído por chaves: JSX, placeholders, `aria-*`, `alt`, `title`, toasts, validações, estados de carregamento/erro e fallbacks. Tabelas de apresentação de enums passarão a guardar identificadores estáveis e resolver o rótulo no momento da renderização.

Mensagens das Route Handlers internas evoluirão para incluir um código estável de erro. Os clientes localizarão esse código e usarão uma mensagem segura traduzida; o campo textual em português poderá permanecer temporariamente como fallback de compatibilidade, mas não será a fonte principal da apresentação. Mensagens e detalhes brutos da API externa não serão exibidos nem enviados ao mecanismo de tradução.

Textos configurados na API, como nomes e descrições de templates, seções e campos, continuarão temporariamente no idioma em que foram cadastrados. Uma futura change de backend deverá persistir `preferred_locale` na conta, incluir o campo em `/auth/me`, armazenar versões localizadas dos cadastros e devolver cada texto no locale efetivo com fallback em português. Quando esse contrato existir, o frontend poderá revalidar somente os dados remotos ao trocar o idioma, preservando valores e arquivos locais.

### 6. Centralizar formatação dependente de locale

Utilitários compartilhados receberão o locale ativo para `Intl.DateTimeFormat`, `Intl.NumberFormat`, custos, durações e ordenação textual. O valor técnico enviado ao backend não mudará. Chamadas fixas com `"pt-BR"` serão removidas ou explicitamente mantidas apenas quando representarem uma regra de dados, nunca apresentação.

### 7. Gerar a primeira tradução com IA, mas revisar e versionar o resultado

O `pt-BR.json` será a fonte editorial inicial. Durante o desenvolvimento, seus valores poderão ser fornecidos a ChatGPT, Claude, DeepSeek ou ferramenta gratuita equivalente, com instrução para manter chaves, placeholders, marcações e estrutura. Nenhum dado de usuário, resposta de formulário, segredo ou conteúdo obtido da API será incluído.

O resultado será revisado por uma pessoa para terminologia BraCVAM/Fiocruz, acessibilidade, consistência verbal e sentido técnico antes de entrar em `en.json`. Depois disso, ambos os arquivos serão artefatos normais do repositório; a build não chamará IA.

### 8. Validar paridade e cobertura antes da liberação

Um script executado por `pnpm` comparará recursivamente as chaves dos dois JSONs e as variáveis de interpolação de cada valor. Divergências encerrarão a verificação com erro. Lint e uma auditoria direcionada identificarão literais de interface remanescentes em `app/` e `components/`, com allowlist explícita apenas para nomes próprios, valores técnicos, caminhos e conteúdo de domínio.

Os roteiros manuais cobrirão troca de idioma em login, formulário parcialmente preenchido, shell recolhido, diálogos, toasts, tabelas, Kanban, triagem e observabilidade, incluindo teclado, leitores de tela e viewports responsivos.

## Risks / Trade-offs

- [O cookie de locale torna o layout dependente da requisição] → aceitar o custo porque a aplicação já depende de sessão e dados dinâmicos; manter recursos estáticos e sem consulta adicional.
- [Um único JSON por idioma pode crescer] → usar hierarquia por módulo e medir o bundle; dividir por namespace somente se houver impacto mensurável.
- [Troca instantânea pode deixar texto hardcoded no idioma anterior] → inventário automatizado, revisão por módulo e roteiros de troca com estado preservado.
- [Tradução gerada por IA pode distorcer termos regulatórios ou científicos] → revisão humana obrigatória, glossário de termos e português como fallback.
- [Mensagens da API podem chegar apenas como texto] → mapear códigos/status conhecidos para mensagens locais seguras e tratar texto externo como diagnóstico server-only.
- [Componentes servidor e cliente podem iniciar com locales diferentes] → validar o cookie no servidor, passar o locale inicial ao provider e evitar singleton global mutável.
- [Sem cookie, `preferred_locale` chega apenas depois da sessão] → iniciar com o fallback seguro e reconciliar uma única vez ao carregar a sessão, persistindo o resultado para eliminar novas trocas nas páginas seguintes.
- [Textos configuráveis continuarão em português dentro da interface inglesa] → comunicar essa fronteira como conteúdo de domínio e não prometer tradução automática sem contrato multilíngue do backend.

## Migration Plan

1. Instalar as dependências, criar tipos, configuração, provider, cookie, suporte opcional a `preferred_locale` e os dois dicionários mínimos sem alterar rotas externas.
2. Integrar o provider ao layout e adicionar o botão público e autenticado, validando primeiro HTML, hidratação, precedência cookie-sessão, persistência e acessibilidade.
3. Migrar textos compartilhados, autenticação e shell; depois avançar módulo a módulo pelos fluxos administrativos e do proponente.
4. Centralizar formatos e códigos de erro durante a migração de cada módulo.
5. Gerar e revisar o dicionário inglês, executar paridade, lint, TypeScript, build e roteiros manuais completos.
6. Liberar com português como fallback. Em caso de regressão, ocultar temporariamente o botão de idioma e fixar `pt-BR` no provider sem desfazer as chaves já migradas.
