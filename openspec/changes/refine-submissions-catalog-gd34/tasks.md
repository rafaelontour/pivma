## 1. Contratos e material institucional

- [ ] 1.1 Obter a versão aprovada do formulário BraCVAM, registrar sua origem/versão e mapear campos, regras, anexos e o campo que recebe o título do método.
- [ ] 1.2 Conferir com a API a regra de geração do código do processo, as etapas e permissões de pré-avaliação, os dados expostos ao proponente e os destinatários autorizados.
- [ ] 1.3 Definir códigos estáveis para os quatro tipos, mapear templates legados e confirmar qual chave existente representa cada tipo.
- [ ] 1.4 Alinhar o contrato da API para ordenar os tipos e associar cada código à versão publicada do formulário e ao campo de título.

## 2. Configuração BraCVAM de formulários

- [ ] 2.1 Registrar a definição aprovada do formulário no configurador, mantendo campos, seções, validações e conteúdo na ordem institucional.
- [ ] 2.2 Permitir associar cada tipo ativo a uma versão publicada do formulário e ao campo de título do método.
- [ ] 2.3 Fixar no processo criado a versão de formulário usada, sem alterar processos e rascunhos existentes quando uma nova versão for publicada.
- [ ] 2.4 Desativar Prova de Conceito para novas submissões sem excluir sua definição nem seus processos existentes.

## 3. Catálogo e identificação da submissão

- [ ] 3.1 Apresentar Método Novo, Método Novo – Dossiê Completo, Extensão do Domínio de Aplicação e Método Similar na ordem aprovada.
- [ ] 3.2 Substituir nomes e descrições pelas versões institucionais em pt-BR e en, incluindo orientação sobre Fitness for Purpose sem classificá-lo como abordagem independente.
- [ ] 3.3 Remover Prova de Conceito das novas opções e verificar que rascunhos e submissões anteriores continuam acessíveis.
- [x] 3.4 Abrir o formulário completo diretamente ao selecionar um tipo, sem modal intermediário exclusivo para título; apresentar o campo de título dentro do formulário.
- [x] 3.5 Abrir o formulário associado na aba Rascunhos após criar a instância; permitir retentar sua carga sem duplicar processo.
- [x] 3.6 Na primeira abertura do formulário, apresentar somente Salvar rascunho e disponibilizar Enviar para análise apenas ao retomar o rascunho salvo.

## 4. Envio e acompanhamento

- [ ] 4.1 Apresentar orientação localizada sobre dados enviados, função da pré-avaliação, acesso à submissão, responsabilidade da equipe BraCVAM e etapas após o envio.
- [x] 4.2 Atualizar o estado sem relatório para explicar o que está indisponível e como isso afeta a continuidade, sem confundir com falha de envio.
- [ ] 4.3 Explicar a atribuição do código conforme regra confirmada e documentada pelo backend, sem presumir sequência ou aleatoriedade.
- [ ] 4.4 Confirmar que o proponente acompanha sua própria submissão na aba Submissões e que outros proponentes não recebem seus dados.

## 5. Verificação

- [ ] 5.1 Validar ordem, nomes e descrições dos tipos nos dois idiomas, catálogo vazio/erro e retirada não destrutiva da Prova de Conceito.
- [ ] 5.2 Validar título único, sua persistência no processo/formulário, retomada após erro e vínculo da versão de formulário.
- [ ] 5.3 Validar envio válido/inválido, relatório disponível/indisponível, código do processo, escopos de visibilidade e atualização da aba Submissões.
- [ ] 5.4 Executar `pnpm i18n:check`, `pnpm lint` e `pnpm exec tsc --noEmit`; validar o fluxo integrado com a API.
