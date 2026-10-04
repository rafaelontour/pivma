## Context

Veja [proposal.md](./proposal.md). O popup já deriva as seções da propriedade `section` dos campos e mantém todos os valores em um único estado no componente cliente, mas renderiza todos os `fieldset` simultaneamente dentro da área rolável. A mudança deve preservar os contratos de formulário, anexos, salvamento e envio existentes.

## Goals / Non-Goals

**Goals:**

- Limitar a altura do conteúdo visível a uma seção por vez quando houver múltiplas seções.
- Reutilizar o mesmo padrão na proposta somente leitura apresentada durante a análise BraCVAM.
- Implementar o padrão ARIA de abas com foco por teclado e associação entre aba e painel.
- Manter os valores de todas as seções no estado já existente, independentemente da seção renderizada.
- Revelar o campo inválido antes de tentar focá-lo.

**Non-Goals:**

- Transformar o formulário em um assistente linear ou impedir acesso a seções posteriores.
- Salvar automaticamente ao mudar de seção.
- Alterar a definição recebida do backend ou traduzir nomes de seções configurados por pessoas.
- Alterar a organização do editor administrativo de formulários.

## Decisions

### Estado da aba no diálogo que executa a validação

O índice da seção ativa ficará no diálogo do formulário, junto do estado dos valores e da rotina de envio. Assim, uma falha de validação pode identificar a seção do campo, ativá-la e aguardar a nova renderização antes de mover o foco. Manter esse estado somente no componente visual foi descartado porque exigiria uma comunicação indireta para revelar campos inválidos.

### Ordem e identidade derivadas da definição

As seções serão deduplicadas na ordem dos campos já ordenados por `order_index`; valores vazios usarão o rótulo localizado de seção geral. Os identificadores ARIA usarão o índice estável dentro do formulário, evitando incorporar nomes configuráveis em IDs do DOM.

### Abas somente quando agregam valor

Com duas ou mais seções, será renderizado um `tablist` horizontal com roving `tabIndex`, suporte a setas, Home e End, seguido de um único `tabpanel`. Com uma seção, o `fieldset` atual permanece visível diretamente. Isso evita introduzir uma aba única sem função de navegação.

Os painéis permanecerão montados e os inativos usarão o atributo HTML `hidden`. Isso preserva também o estado local dos controles de anexo; ao contrário de uma ocultação apenas visual por CSS, `hidden` retira os campos inativos da árvore de acessibilidade e da navegação por foco.

Alternativa considerada: desmontar os painéis inativos. Embora os valores simples permaneçam seguros no estado do diálogo, essa opção reinicializaria o estado local de anexos recém-enviados ao retornar à seção.

### Rolagem horizontal da barra em telas estreitas

A lista de abas permitirá rolagem horizontal sem quebrar os nomes das seções. O corpo e o rodapé do diálogo mantêm seus limites atuais, reduzindo a rolagem vertical sem ampliar o popup além da tela.

### Navegação equivalente no modal de análise

O workspace de triagem derivará as seções dos campos na mesma ordem da proposta e manterá todos os painéis montados, ocultando os inativos com `hidden`. A barra de abas será exibida somente quando houver mais de uma seção e aceitará clique, setas, Home e End. Pareceres já preenchidos permanecerão no estado do workspace ao alternar entre as abas.

## Risks / Trade-offs

- [A seção configurada pode ter nome longo] → Permitir rolagem horizontal e impedir que cada aba encolha a ponto de perder legibilidade.
- [O campo inválido ainda não existe no DOM ao trocar de aba] → Agendar o foco para depois da atualização do estado da seção ativa.
- [Trocar o idioma altera o nome da seção geral] → Derivar novamente as seções e corrigir o índice ativo caso ele deixe de ser válido.

## Migration Plan

1. Publicar a mudança somente no componente cliente; não há migração de dados ou API.
2. Validar um formulário com uma seção, a prova de conceito com várias seções e um erro obrigatório fora da aba ativa.
3. Em rollback, restaurar a renderização sequencial dos `fieldset`; os rascunhos e valores persistidos não são afetados.
