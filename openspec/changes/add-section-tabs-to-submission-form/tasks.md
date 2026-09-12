## 1. Modelo de seções e validação provisória

- [x] 1.1 Ler a documentação local relevante do Next.js em `node_modules/next/dist/docs/` antes de alterar os componentes do formulário
- [x] 1.2 Declarar em `types/Submissao.ts` os tipos de seção, coleção de erros e propriedades de interface necessários
- [x] 1.3 Extrair um agrupador que ordene campos, normalize seções vazias para `Geral` e produza chaves estáveis
- [x] 1.4 Adaptar o validador manual para aceitar subconjuntos de campos e retornar todos os erros indexados por `field_key`
- [x] 1.5 Separar no validador os modos parcial e de conclusão sem adicionar Zod
- [x] 1.6 Cobrir agrupamento e validação com testes unitários, incluindo obrigatoriedade, tipos, limites, opções, arquivos e campos desconhecidos

## 2. Apresentação de erros nos campos

- [x] 2.1 Estender os controles dinâmicos para receber erro por propriedade tipada e expor `aria-invalid` e `aria-describedby`
- [x] 2.2 Renderizar a mensagem de validação junto ao campo correspondente sem remover o texto de ajuda existente
- [x] 2.3 Atualizar o estado de erros ao revalidar uma seção, removendo mensagens corrigidas sem apagar erros de outras seções
- [x] 2.4 Adicionar testes de renderização e associação acessível das mensagens de erro

## 3. Interface de abas por seção

- [x] 3.1 Adicionar ao diálogo o estado da seção ativa, reiniciado quando mudar a instância do formulário
- [x] 3.2 Substituir os fieldsets empilhados por um `tablist`, abas ordenadas e somente o `tabpanel` ativo
- [x] 3.3 Implementar relações ARIA, foco por setas, `Home` e `End`, e ativação por teclado
- [x] 3.4 Tornar a lista de abas rolável em telas estreitas e marcar de forma acessível as seções que possuem erros
- [x] 3.5 Preservar valores e referências de arquivo ao alternar repetidamente entre os painéis

## 4. Navegação e ações do formulário

- [x] 4.1 Renderizar `Avançar` na primeira seção, `Voltar` e `Avançar` nas intermediárias, e `Voltar` e `Enviar para análise` na última
- [x] 4.2 Tratar o caso de uma única seção com envio direto e sem controles de avanço ou retorno
- [x] 4.3 Permitir retorno sem validação e validar as seções precedentes ao avançar por botão ou seleção direta de aba
- [x] 4.4 Manter a seção atual e focar o primeiro campo inválido quando a validação bloquear o avanço
- [x] 4.5 Validar todas as seções antes do envio e ativar a primeira seção inválida sem chamar a integração externa
- [x] 4.6 Manter `Salvar rascunho` independente da seção ativa e preservar os bloqueios durante operações concorrentes
- [x] 4.7 Manter navegação consultiva pelas abas em formulários submetidos sem expor ações de edição

## 5. Verificação integrada

- [x] 5.1 Testar criação e retomada com templates de uma seção, várias seções e campos agrupados em `Geral`
- [x] 5.2 Testar avanço, retorno, salto para aba posterior, correção de erros e preservação de valores não salvos
- [x] 5.3 Testar envio válido e inválido, garantindo que nenhuma requisição seja iniciada quando houver erro local
- [x] 5.4 Testar navegação por teclado, foco após avanço ou erro, indicadores acessíveis e layout móvel
- [x] 5.5 Executar `pnpm lint`, a suíte de testes aplicável e `pnpm build`, corrigindo regressões antes de concluir a change

## 6. Modal amplo nas três abas

- [x] 6.1 Aplicar largura de 90% da viewport aos modais de formulário de nova submissão, retomada de rascunho e consulta
- [x] 6.2 Adicionar à aba Submissões uma ação para abrir o formulário enviado em modo somente leitura
- [x] 6.3 Identificar corretamente no cabeçalho e nas mensagens do modal se o processo é rascunho ou submissão
- [x] 6.4 Cobrir a largura e a abertura consultiva com testes automatizados
- [x] 6.5 Executar `pnpm test`, `pnpm lint`, TypeScript e a validação estrita da change

## 7. Abas fixas durante a rolagem

- [x] 7.1 Tornar o `tablist` sticky no topo do contêiner de rolagem vertical, com fundo opaco e camada adequada
- [x] 7.2 Preservar a rolagem horizontal e cobrir as classes de posicionamento com teste automatizado
- [x] 7.3 Executar testes, lint, TypeScript e validação estrita da change
- [x] 7.4 Remover o vão acima e nas laterais do `tablist` sticky para impedir que o conteúdo rolado apareça por trás
- [x] 7.5 Cobrir a correção de espaçamento e repetir as verificações da change

## 8. Regressão no pós-envio

- [x] 8.1 Confirmar o estado do processo após o `POST` de conclusão antes de reconciliar as listas do proponente
- [x] 8.2 Remover imediatamente a submissão aceita de Meus rascunhos e inserir o processo confirmado na aba Submissões sem depender de uma listagem transitória
- [x] 8.3 Cobrir o fluxo aceito com teste automatizado e repetir testes, lint, TypeScript e validação estrita da change
