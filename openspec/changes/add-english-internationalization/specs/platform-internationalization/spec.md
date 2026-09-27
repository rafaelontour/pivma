## Purpose

Permitir que pessoas usem toda a interface do pi*VMA em português do Brasil ou inglês, com preferência persistente, formatos locais e comportamento consistente em todos os módulos.

## ADDED Requirements

### Requirement: Idiomas disponíveis e seleção global

O sistema SHALL oferecer português do Brasil e inglês como idiomas da interface. A pessoa MUST poder alternar o idioma por um botão na barra do cabeçalho das áreas pública e autenticada sem alterar a URL ou perder o estado funcional da tela atual.

#### Scenario: Pessoa seleciona inglês

- **WHEN** uma pessoa aciona o botão para mudar de português do Brasil para inglês
- **THEN** o sistema atualiza imediatamente os textos próprios da interface para inglês sem navegar para outra URL nem reiniciar o fluxo atual

#### Scenario: Pessoa retorna ao português

- **WHEN** uma pessoa aciona o botão para mudar de inglês para português do Brasil
- **THEN** o sistema restaura imediatamente os textos próprios da interface em português do Brasil

### Requirement: Resolução e persistência da preferência

O sistema SHALL persistir a seleção no cookie de idioma do navegador. Ao resolver o idioma, o sistema MUST usar primeiro um cookie válido; quando esse cookie não existir ou for inválido, MUST usar o campo opcional `preferred_locale` do objeto de sessão; quando nenhuma dessas fontes contiver um locale suportado, MUST usar português do Brasil. A preferência resolvida MUST ser reaplicada em novas páginas sem impedir o carregamento quando o backend ainda não fornecer `preferred_locale`.

#### Scenario: Cookie possui preferência válida

- **WHEN** o navegador possui um cookie com um locale suportado
- **THEN** o sistema usa esse locale independentemente do valor presente na sessão

#### Scenario: Sessão fornece preferência sem cookie

- **WHEN** não existe cookie válido e o objeto de sessão possui `preferred_locale` com um locale suportado
- **THEN** o sistema muda a interface para o idioma da sessão e persiste essa resolução no navegador

#### Scenario: Backend ainda não fornece preferência

- **WHEN** não existe cookie válido e o objeto de sessão não possui `preferred_locale`
- **THEN** o sistema usa português do Brasil sem tratar a ausência do campo como erro de sessão

#### Scenario: Navegação preserva o idioma

- **WHEN** uma pessoa escolhe inglês e navega entre módulos da plataforma
- **THEN** as páginas seguintes permanecem em inglês

#### Scenario: Cookie inválido com sessão válida

- **WHEN** o cookie não corresponde a um idioma suportado e a sessão possui uma preferência válida
- **THEN** o sistema ignora o cookie inválido, usa a preferência da sessão e continua operacional

#### Scenario: Nenhuma preferência válida

- **WHEN** cookie e sessão não fornecem um locale suportado
- **THEN** o sistema usa português do Brasil e continua operacional

### Requirement: Cobertura dos textos próprios da interface

O sistema SHALL apresentar no idioma selecionado todos os textos próprios da interface, incluindo menus, cabeçalhos, instruções, rótulos, placeholders, botões, estados vazios, carregamento, erros seguros, validações, diálogos, toasts, dicas, textos alternativos e nomes acessíveis. A troca de idioma MUST manter permissões, valores preenchidos, seleções e operações em andamento.

#### Scenario: Jornada em inglês

- **WHEN** uma pessoa usa login, cadastro ou qualquer módulo autenticado com inglês selecionado
- **THEN** os textos próprios apresentados pela aplicação e por tecnologias assistivas estão em inglês, sem chaves técnicas de tradução visíveis

#### Scenario: Troca durante preenchimento

- **WHEN** uma pessoa muda o idioma enquanto possui valores não enviados em um formulário
- **THEN** o sistema traduz os elementos da interface e preserva os valores, arquivos selecionados e estado da operação

#### Scenario: Falha de operação em inglês

- **WHEN** uma operação falha enquanto inglês está selecionado
- **THEN** o sistema apresenta uma mensagem segura e acionável em inglês sem expor diretamente detalhes externos não controlados

### Requirement: Localização de formatos e estados conhecidos

O sistema SHALL formatar datas, horas e números conforme o idioma selecionado e SHALL apresentar rótulos localizados para estados, enumerações e opções estáveis conhecidos pela aplicação. Valores técnicos enviados à API MUST permanecer inalterados.

#### Scenario: Formatos em inglês

- **WHEN** inglês está selecionado e a interface apresenta uma data, duração, custo ou quantidade
- **THEN** o valor usa convenções de formatação inglesas sem modificar o dado original

#### Scenario: Opção de domínio traduzida

- **WHEN** a interface apresenta uma opção estável de domínio no idioma selecionado
- **THEN** a pessoa vê o rótulo traduzido, mas qualquer solicitação ao backend conserva o identificador técnico original

### Requirement: Conteúdo externo preservado

O sistema MUST NOT traduzir automaticamente nomes próprios, identificadores, valores informados por pessoas ou conteúdo configurável recebido da API. Textos externos sem tradução controlada MUST ser apresentados como conteúdo de domínio, sem serem incorporados aos dicionários da interface.

#### Scenario: Conteúdo de formulário vindo da API

- **WHEN** um template, campo ou processo possui texto configurado no backend
- **THEN** o sistema apresenta esse conteúdo como recebido, independentemente do idioma da interface

#### Scenario: Identificador técnico necessário

- **WHEN** um identificador técnico desconhecido precisa ser exibido como contingência
- **THEN** o sistema preserva o valor original e não inventa uma tradução

### Requirement: Sem tradução externa em runtime

O sistema SHALL resolver as traduções da interface a partir de recursos versionados com a aplicação e MUST NOT chamar serviços de tradução, ferramentas de IA ou endpoints externos para traduzir conteúdo durante execução, build ou uso da plataforma.

#### Scenario: Troca de idioma sem serviço de tradução

- **WHEN** uma pessoa alterna entre português e inglês
- **THEN** a tradução é carregada dos recursos da aplicação sem enviar textos ou dados da sessão a um serviço de tradução

### Requirement: Integridade e fallback dos dicionários

Os recursos de português e inglês MUST possuir as mesmas chaves e variáveis de interpolação. Se um recurso localizado não puder ser resolvido em runtime, o sistema MUST usar o texto em português do Brasil e MUST NOT apresentar a chave interna à pessoa.

#### Scenario: Tradução inglesa ausente em runtime

- **WHEN** uma chave inglesa não pode ser resolvida apesar das verificações de desenvolvimento
- **THEN** o sistema apresenta o texto correspondente em português do Brasil sem exibir a chave técnica

#### Scenario: Dicionários divergentes na verificação

- **WHEN** os dicionários possuem chaves ou variáveis de interpolação incompatíveis
- **THEN** a verificação automatizada falha antes da liberação

### Requirement: Idioma declarado e controle acessível

O sistema SHALL manter o idioma ativo declarado no documento e SHALL oferecer um botão de alternância de idioma operável por teclado e tecnologia assistiva, com nome acessível que comunique o idioma de destino.

#### Scenario: Documento em inglês

- **WHEN** inglês está ativo
- **THEN** o documento declara inglês como idioma e o botão comunica que sua ação muda a interface para português do Brasil

#### Scenario: Seleção por teclado

- **WHEN** uma pessoa alcança o botão de idioma usando teclado
- **THEN** ela consegue identificar o idioma de destino, acionar a alternância e perceber foco visível
