# Internacionalização do pi*VMA

## Escopo

Os dicionários traduzem textos controlados pelo frontend: navegação, títulos,
rótulos, botões, ajuda, validações, mensagens, estados vazios e nomes
acessíveis. O locale inicial segue esta precedência:

1. cookie `pivma_locale` válido;
2. `preferred_locale` válido no objeto de sessão;
3. fallback `pt-BR`.

O seletor grava apenas o locale no cookie e não chama serviços externos de
tradução.

## Allowlist de textos não traduzidos

- nomes próprios e marcas: `pi*VMA`, `BraCVAM`, `Fiocruz` e nomes de pessoas;
- e-mails, URLs, nomes de arquivos e datas/identificadores presentes em payloads;
- chaves de processo, formulário, campo, permissão, perfil e códigos de status;
- JSON, logs, cabeçalhos HTTP, métricas e outros payloads técnicos inspecionados;
- título, descrição, instruções, pareceres e conteúdo científico cadastrados ou
  escritos por usuários e devolvidos pela API;
- mensagens textuais legadas do backend quando não houver código de erro estável.

Rótulos conhecidos para enums podem ser localizados, mas o valor técnico
original continua sendo usado nos filtros e payloads. Valores desconhecidos são
mostrados sem alteração.

## Glossário institucional e técnico

| Português | English |
| --- | --- |
| Plataforma Integrada de Validação de Métodos Alternativos | Integrated Platform for Alternative Methods Validation |
| método alternativo | alternative method |
| submissão | submission |
| triagem | screening |
| avaliação | evaluation |
| parecer | review |
| formulário | form |
| processo | process |
| rascunho | draft |
| Grupo Gestor | Management Group |
| responsável | person responsible |
| observabilidade | observability |

As marcas e o nome de perfis cadastrados não são reescritos nos dados. A forma
inglesa do glossário só deve aparecer em textos controlados pela interface.

## Auditoria de cobertura

Na auditoria de 29/09/2026, não restaram textos próprios de interface em
`app/` ou `components/` fora dos dicionários. As exceções encontradas são
intencionais: marcas (`pi*VMA`, `BraCVAM`, `Fiocruz`), identificadores técnicos
de versão (`v`), separadores visuais (`·`), o exemplo configurável de extensões
de arquivo (`pdf, docx`) e valores retornados pela API. Os validadores e as
Route Handlers mantêm mensagens em português somente como fallback de
compatibilidade; as respostas internas agora incluem códigos estáveis e os
clientes resolvem esses códigos pelos dicionários.
