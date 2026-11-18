## Context

Veja [proposal.md](./proposal.md) e as alterações de comportamento em [specs/dynamic-process-forms/spec.md](./specs/dynamic-process-forms/spec.md) e [specs/form-template-management/spec.md](./specs/form-template-management/spec.md). Hoje o catálogo renderiza os nomes e descrições vindos da API de templates, a pessoa informa um título antes da criação do processo e o formulário é carregado depois que o processo existe. Os tipos de domínio recebem conteúdo de backend, então nomes institucionais não devem ser traduzidos a partir de texto livre.

A API publicada expõe templates de processo e definições versionadas de formulários, mas não foi encontrado neste repositório o formulário oficial encaminhado pelo BraCVAM nem um contrato de associação de tipo institucional a uma versão de formulário. A regra de geração do código do processo também não está descrita no OpenAPI consultado.

## Goals / Non-Goals

**Goals:**

- Separar a identidade estável do tipo de submissão do texto exibido no catálogo.
- Ligar cada tipo ativo a uma versão publicada do formulário de submissão do BraCVAM.
- Capturar o título uma vez e persistir esse valor tanto no processo quanto no campo correspondente do formulário.
- Informar o fluxo com base no estado e nas capacidades realmente retornadas pela API.
- Preservar processos e rascunhos existentes quando um tipo deixar de ser oferecido para novas submissões.

**Non-Goals:**

- Alterar ou traduzir automaticamente conteúdo científico e valores já submetidos por pessoas.
- Inventar uma regra sequencial ou aleatória para códigos que a API gera.
- Apresentar a pré-avaliação automatizada como detecção de originalidade, similaridade ou substituta da avaliação técnica humana.
- Excluir, converter ou migrar submissões anteriores de Prova de Conceito.

## Decisions

### Códigos estáveis para tipos e conteúdo localizado no frontend

Cada tipo terá um identificador técnico estável retornado pela API. A aplicação usará esse código para escolher a ordem e as chaves i18n de nome e descrição; não usará nem traduzirá `name`/`description` livres recebidos do backend. As quatro chaves institucionais serão mapeadas para pt-BR e en. A API continuará vinculando o código do tipo à definição e versão do formulário.

Alternativa considerada: ordenar e renomear os itens comparando os nomes atuais. Isso quebra com alterações de texto, tradução, acentuação e dados já existentes.

### Formulário completo aberto diretamente em Rascunhos

Ao selecionar um tipo, a interface muda para Rascunhos, cria a instância necessária para carregar o formulário e abre imediatamente o formulário completo em popup. Não há diálogo intermediário dedicado somente ao título. O campo de título faz parte do formulário dinâmico e é preenchido/alterado ali. Como a API exige um título na criação da instância, a interface envia inicialmente o nome do tipo e, ao salvar o formulário, atualiza também o título do processo pelo `PATCH /processes/{id}`.

Alternativa considerada: pedir o título em um modal separado antes de abrir o formulário. Isso interrompe a escolha do tipo e duplica o contexto antes do preenchimento.

### Associação versionada entre tipo e formulário

A gestão BraCVAM configurará para cada tipo ativo a versão publicada do formulário, o campo vinculado ao título e as descrições localizadas. Novas submissões fixarão a versão selecionada na criação do processo. Publicar revisão posterior atualizará somente novos processos; processos existentes continuarão associados à sua versão original.

Alternativa considerada: inferir o formulário pela ordem ou pelo nome do template. Essa associação é frágil e não permite auditoria da versão utilizada em cada submissão.

### Ajuda do envio baseada nas capacidades efetivas da API

Na primeira abertura do formulário, logo após a identificação e a criação do processo, a única ação de avanço será Salvar rascunho. O salvamento fecha o formulário e leva a pessoa à aba Rascunhos; Enviar para análise será oferecido somente quando esse rascunho for retomado. O texto de orientação explicará o que o formulário envia, os destinatários autorizados e a sequência de acompanhamento. A seção de pré-avaliação mostrará somente a finalidade e o resultado publicados pelo backend; a interface não deduzirá que houve análise ou que a ausência de relatório significa falha. O estado sem relatório será uma mensagem informativa vinculada ao estado atual do processo.

Alternativa considerada: texto fixo afirmando uma análise automática de originalidade ou similaridade. Não há evidência no contrato atual de que essa seja a função da pré-avaliação.

### Código do processo continua sendo atribuído pelo backend

O frontend exibirá o identificador devolvido pela API. A regra de formato e geração será confirmada com o contrato do backend antes de explicá-la em detalhe; se não houver regra publicada, a interface informará somente que o código é atribuído automaticamente pelo sistema.

Alternativa considerada: inferir sequência ou aleatoriedade pelo formato de códigos de amostra. Isso pode fornecer informação incorreta e produzir dependência de convenção não contratada.

### Prova de Conceito sai apenas do catálogo de novas submissões

O tipo será desativado para novas submissões sem apagar registros, formulários ou vínculos existentes. A consulta e o acompanhamento continuarão usando os códigos e metadados persistidos no processo antigo.

Alternativa considerada: remover o template e seus dados. Isso pode tornar rascunhos e processos enviados inacessíveis e prejudica rastreabilidade.

## Risks / Trade-offs

- [O formulário oficial não está versionado neste repositório] → Bloquear a conclusão de implementação do formulário até localizar/receber o arquivo aprovado e registrar a versão; não criar campos científicos por suposição.
- [O backend ainda não modela códigos estáveis para os quatro tipos e suas traduções] → Adicionar códigos estáveis à configuração do tipo e manter rótulos e descrições nos dicionários da aplicação.
- [A API não fixa versão de formulário na instância do processo] → Ajustar o contrato externo para persistir a versão ao criar o processo; sem isso, processos antigos podem passar a renderizar uma definição diferente.
- [O formulário exige um campo de título além do título do processo] → Configurar a chave desse campo e inserir o valor capturado antes de abrir a tela, sem exibir entrada duplicada.
- [A finalidade da pré-avaliação ou a regra de códigos diverge da percepção do BraCVAM] → Validar o texto informativo com a equipe e documentar no backend as regras e transições antes de afirmar detalhes.
- [Nomes antigos já foram salvos em processos] → Aplicar rótulos novos às opções de criação e preservar os dados e versões que identificam processos existentes.

## Migration Plan

1. Receber e versionar o formulário aprovado pelo BraCVAM; identificar a chave do campo de título e o conteúdo de cada tipo.
2. Confirmar com a API códigos estáveis de tipos, associação e snapshot de versão de formulário, autorização de leitura e regra de geração do código de processo.
3. Migrar os tipos existentes para os quatro códigos estáveis, preservando os templates históricos e desativando Prova de Conceito apenas para novas criações.
4. Publicar a versão inicial do formulário para cada tipo ativo e validar a captura única do título, salvamento, envio, acompanhamento e permissões.
5. Em rollback, restaurar os rótulos e a disponibilidade anteriores sem excluir instâncias criadas nem alterar respostas já submetidas.

## Open Questions

- A equipe precisa disponibilizar o arquivo ou versão oficial do formulário BraCVAM referido no documento de sugestões; ele não consta no repositório atual.
- A API precisa confirmar a regra de geração e o significado oficial do código exibido ao proponente antes de a interface apresentar detalhes além da atribuição automática.
- A equipe BraCVAM precisa confirmar se a pré-avaliação automatizada é executada para todos os tipos e quais informações podem ser exibidas ao proponente.
