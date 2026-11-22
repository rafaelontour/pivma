## Why

As pessoas autenticadas ainda não possuem um ponto central para descobrir tarefas, mudanças de estado e decisões que exigem sua atenção, embora o backend esteja introduzindo o contrato de alerts na Spec 047. Integrar esses avisos ao shell agora permite orientar cada destinatário ao contexto correto sem expor a API externa nem duplicar as regras de autorização do backend.

## What Changes

- Adicionar ao header autenticado um sininho acessível com contador global de alerts não lidos e atualização periódica sem tempo real.
- Oferecer uma central paginada com filtros para alerts não lidos e todos, ação individual de leitura e ação destacada para marcar todos como lidos.
- Traduzir `kind`, códigos estáveis e estados conhecidos em mensagens simultâneas em português do Brasil e inglês, mantendo nomes e conteúdo institucional recebidos da API sem tradução automática e oferecendo fallback para tipos futuros.
- Resolver destinos de processo, tarefa e recebimento de amostras por rotas internas, usando `activity_key` para encaminhar tarefas e preservando o alert quando o destino deixar de estar disponível.
- Normalizar e formatar datas no locale e fuso da pessoa, tratando explicitamente a ausência de offset no contrato temporário até o backend publicar datas UTC inequívocas.
- Encapsular listagem e mutações em serviços server-only e Route Handlers internos, preservando sessão, `Origin`, códigos de erro e validação do contrato externo.

## Capabilities

### New Capabilities

- `user-alert-center`: Listagem, contagem, leitura, internacionalização e navegação dos alerts destinados à pessoa autenticada.

### Modified Capabilities

- `authenticated-navigation`: Incluir no header persistente o acesso acessível à central de alerts e seu indicador de não lidos.

## Impact

- Header e shell compartilhado da área autenticada, incluindo comportamento responsivo, foco, anúncios acessíveis e ciclo de polling.
- Novos tipos de domínio em `types/`, serviço server-only em `services/`, Route Handlers sob `/api/alerts` e componentes da central de alerts.
- Dicionários `i18n/locales/pt-BR.json` e `i18n/locales/en.json`, além da formatação localizada de datas.
- Integração com os endpoints autenticados `/alerts`, `/alerts/{alert_id}/read`, `/alerts/read-all` e `/tasks/{id}` da API externa.
- Navegação para as telas existentes de processos, triagem, submissões, amostras e recebimento, com possíveis parâmetros para localizar o objeto alvo.
- Dependência do contrato do backend acompanhado pelo PR `pivma-bracvam/pivma-back#82` e sua Spec 047.
