## Why

A gestão de usuários apresenta somente dados resumidos, o que impede a consulta da trajetória de acesso e das participações de uma pessoa. A área de submissões também precisa separar com clareza as submissões ativas das devolvidas pela BraCVAM para orientar a próxima ação do proponente.

## What Changes

- Adiciona uma página de perfil acessível a partir da listagem administrativa de usuários, com dados da conta, data de criação, cargos globais, participações e cargos locais por processo, além das respectivas datas de atribuição quando disponíveis.
- Expande o contrato interno de consulta de usuário para reunir os dados de perfil e histórico de cargos sem expor credenciais ou a URL da API externa.
- Separa a aba Submissões em Enviados e Retornados pelo BraCVAM, com descrições localizadas sobre o significado de cada lista e contagens em badges circulares.
- Move uma submissão retornada para Rascunhos assim que o proponente inicia a correção, removendo-a da lista de retornados.
- Padroniza a nomenclatura em português como “Retornados pelo BraCVAM”.

## Capabilities

### New Capabilities

- `user-profile-details`: consulta administrativa do perfil completo de uma pessoa, incluindo informações de conta, cargos globais e cargos locais em processos.
- `submission-return-sections`: organização e transição das submissões do proponente entre enviados, retornados pelo BraCVAM e rascunhos.

### Modified Capabilities

- `user-access-management`: a listagem administrativa passa a oferecer acesso ao perfil detalhado de cada pessoa.

## Impact

- Afeta a área Configurações > Gerenciamento de usuários, tipos de usuário e participação, serviços e rotas internas de usuários.
- Afeta o catálogo de submissões, a transição iniciada ao responder uma devolução e os dicionários pt-BR e en.
- Pode requerer que a API externa publique dados de criação de conta e atribuição de cargos que ainda não estejam presentes nos contratos atuais.
