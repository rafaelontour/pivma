## Why

O pi*VMA apresenta atualmente toda a interface em português e mantém textos visíveis espalhados por páginas, componentes, validadores e mensagens de operação. A plataforma precisa oferecer inglês sem duplicar telas, depender de tradução paga em runtime ou alterar os fluxos funcionais existentes.

## What Changes

- Adicionar internacionalização da interface com `i18next` e integração React, usando dicionários JSON versionados para português do Brasil e inglês.
- Manter português do Brasil como fallback e oferecer um botão de alternância de idioma na barra dos cabeçalhos público e autenticado, com troca imediata e preferência persistida em cookie.
- Resolver o idioma inicial usando primeiro um cookie válido do navegador, depois o campo opcional `preferred_locale` do objeto de sessão e, na ausência de ambos, português do Brasil.
- Traduzir textos próprios da interface, incluindo menus, títulos, botões, formulários, validações, estados vazios, diálogos, toasts e nomes acessíveis.
- Localizar datas, horas, números e rótulos estáveis de estados conforme o idioma selecionado.
- Manter URLs existentes sem prefixo de locale e não expor nem enviar a preferência de idioma à API externa.
- Manter dados informados por pessoas, conteúdo configurável vindo do backend, nomes próprios e identificadores técnicos sem tradução automática.
- Usar ferramentas gratuitas de IA somente durante o desenvolvimento para produzir uma primeira versão de `en.json`, exigindo revisão humana dos termos institucionais e técnicos antes da integração.
- Adicionar verificações de paridade entre os dicionários, variáveis de interpolação e ausência de textos próprios da interface fora da camada de tradução.

## Capabilities

### New Capabilities

- `platform-internationalization`: seleção e persistência de idioma, resolução dos dicionários, tradução da interface e localização de formatos para português do Brasil e inglês.

### Modified Capabilities

- `authenticated-navigation`: disponibilizar o botão global de alternância de idioma no header autenticado sem alterar autorização, destinos ou estado ativo da navegação.

## Impact

- Inclusão das dependências `i18next` e `react-i18next` e de uma camada cliente compartilhada de inicialização e contexto de idioma.
- Novos dicionários JSON e tipos compartilhados para locales, namespaces e propriedades dos componentes de idioma.
- Ampliação do tipo de sessão e de sua normalização para aceitar `preferred_locale` como campo opcional enquanto o backend ainda não o publica.
- Alterações transversais em `app/` e `components/` para substituir textos próprios hardcoded por chaves de tradução.
- Adequação de mensagens retornadas pelas rotas internas para que clientes possam localizar falhas sem apresentar diretamente textos externos.
- Nenhuma alteração imediata nos contratos da API externa, nas permissões, nos dados de domínio ou nas URLs públicas e autenticadas.
- A persistência da preferência na conta e a localização de conteúdo cadastrado no backend ficam registradas como integração futura; até lá, o cookie é a fonte persistente disponível e conteúdo dinâmico continua no idioma retornado pela API.
