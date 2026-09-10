## Context

A autenticação atual possui uma única tela de login e rotas internas que protegem o cookie de sessão ao conversar com a API externa. A API do pi*VMA já expõe `POST /users/`, que recebe `username`, `email` e `password`; a criação da conta não equivale à atribuição de perfis RBAC. A pasta `services/` será a única camada a conhecer a API externa. Veja `proposal.md` para a motivação e `specs/user-registration/spec.md` para o comportamento contratado.

## Goals / Non-Goals

**Goals:**

- Incorporar o cadastro à experiência de autenticação existente sem duplicar a identidade visual.
- Validar os mesmos limites fundamentais definidos pela API tanto antes do envio quanto no servidor intermediário.
- Tornar visível, durante a digitação, o progresso individual dos quatro critérios de senha.
- Manter as credenciais fora de mensagens de erro, estado persistido e cookies.
- Oferecer uma transição explícita de volta ao login depois de criar a conta.
- Garantir que componentes do navegador não chamem a API externa diretamente.

**Non-Goals:**

- Conceder perfil, permissão, vínculo institucional ou acesso a processos durante o cadastro.
- Implementar recuperação de senha, confirmação de e-mail ou aprovação automática de conta.
- Alterar o contrato, a semântica ou o armazenamento da API externa.

## Decisions

### Cadastro como modo da tela de autenticação

A tela `/login` alternará entre os modos de entrar e criar conta. Isso mantém a entrada pública em um único ponto e torna o retorno ao login imediato. Uma rota pública independente foi considerada, mas adicionaria navegação e estrutura duplicadas sem benefício para este fluxo curto.

### Route Group para organização

As páginas e os Route Handlers ficarão sob `app/(paginas)/`. Como parênteses identificam um Route Group no App Router, a organização não muda as URLs: os arquivos continuarão expostos em `/`, `/login` e `/api/auth/*`. O layout raiz e os arquivos globais permanecem em `app/`, pois o Next exige o layout raiz nesse nível.

### Camada de serviços e ponte interna

Axios será o cliente HTTP da camada de serviços e será configurado somente no servidor com `PIVMA_API_URL`. `services/Usuario.ts` concentrará a criação de usuários e futuras consultas de usuários com filtros; `services/Autenticacao.ts` concentrará login, leitura da sessão e logout. Radash será usado na camada de serviços para normalizar dados opcionais e encapsular o tratamento assíncrono de chamadas. Componentes do navegador chamarão somente as rotas internas do Next; essas rotas validarão entradas, invocarão os services e normalizarão as respostas públicas.

Uma rota `POST /api/auth/register` receberá o formulário, repetirá a validação essencial e invocará o service de usuários. A rota exige comprimento mínimo, letras maiúscula e minúscula e número, mesmo que o cliente já tenha verificado essas condições.

### Indicadores derivados da senha

O formulário manterá a senha somente no estado efêmero necessário à interação e calculará quatro estados booleanos: oito ou mais caracteres, letra maiúscula, letra minúscula e número. Esses estados alimentarão caixas de seleção não editáveis e acessíveis. Caixas editáveis foram descartadas porque poderiam sugerir que marcar manualmente um requisito altera a validade da senha.

### Layout compacto e confirmação imediata

O modo de cadastro usará uma grade de duas colunas para pares de campos relacionados e uma grade de duas colunas para os objetivos da senha. A página de autenticação usará a altura dinâmica do viewport e impedirá rolagem vertical no nível da página. Um estado derivado comparará os dois valores de senha e exibirá uma mensagem positiva ou de correção assim que a confirmação tiver conteúdo.

### Sucesso sem sessão automática

Depois de receber a criação bem-sucedida, a interface exibirá confirmação e limpará os campos, mas não chamará login nem armazenará cookies. Essa decisão separa identidade de autorização: uma nova conta pode não ter perfil RBAC e a inclusão de uma sessão automática poderia comunicar uma disponibilidade de acesso que ainda não existe.

### Mensagens seguras e acionáveis

O cliente apresentará erros de validação específicos para seus próprios campos por meio de popups do Sonner. Falhas retornadas pelo serviço de usuários serão convertidas em mensagens genéricas de criação não concluída, preservando a possibilidade de corrigir os dados sem revelar se um e-mail ou nome de usuário já pertence a outra pessoa. O `Toaster` será montado uma única vez no layout raiz. Foi considerada a exposição direta das mensagens da API, mas ela não atende ao requisito de evitar enumeração de contas.

## Risks / Trade-offs

- [A API pode rejeitar uma conta por regra não refletida localmente] → manter uma mensagem genérica e deixar o formulário disponível para correção.
- [A API externa pode ficar indisponível] → a rota interna retornará erro de serviço, sem criar estado parcial no navegador.
- [Uma pessoa pode interpretar conta criada como acesso liberado] → a confirmação explicará que o perfil institucional pode exigir vinculação da equipe gestora.
- [A política futura exigir verificação de e-mail] → adicionar essa etapa como change posterior, sem reutilizar ou expor a senha do cadastro atual.
- [A interface indicar critérios atendidos sem validação de servidor] → repetir integralmente a política de senha na rota interna.
- [O cliente acessar a API externa ou uma rota contornar o service] → manter a URL da API apenas no cliente Axios do servidor e refatorar as rotas de autenticação existentes para usar os services.

## Migration Plan

1. Publicar a rota interna e o modo de cadastro junto com a tela atual de login.
2. Validar criação bem-sucedida, dados inválidos e indisponibilidade da API em ambiente integrado.
3. Se for necessário reverter, remover a opção e a rota de cadastro; nenhuma migração de dados ou sessão precisa ser desfeita porque as contas pertencem à API externa.
