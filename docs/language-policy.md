# Política de idiomas (documentação + produto)

**Summary (EN):** Specs stay **canonical in Brazilian Portuguese**; **English** is provided for repo overview, an `docs/en/` entry point, and the **running app** via real **i18n** (`pt-BR` default + `en`). RAG manuals exist in **both** languages. Code identifiers stay English.

---

## O que é “i18n de verdade”?

**i18n** = *internationalization* (dezoito letras entre **i** e **n** — abreviação feia, mas é o termo).

**De verdade** significa: o sistema **não** grava texto fixo em português dentro da tela (“Salvar”, “Matrícula cancelada”) de um jeito que só quem fala PT consegue mudar. Em vez disso:

1. **Toda** string que o **usuário** vê vem de um **catálogo de tradução** (ex.: `pt.json`, `en.json`) ou de um serviço equivalente.
2. O código usa uma **chave** estável, tipo `enrollment.saveButton` ou `errors.ENROLLMENT_DUPLICATE`, e em runtime escolhe o texto certo pelo **idioma ativo** (`pt-BR`, `en`, …).
3. Coisas que mudam com a região também entram nisso: **data**, **número**, **moeda** (ex.: Real com formato BR vs texto em inglês “BRL 1,200.00”) — usando APIs de locale (`Intl`, biblioteca de datas), não string montada na mão em um idioma só.

Isso é diferente de “fiz a tela em português e depois copiei um README em inglês”: o app em si precisa **trocar de idioma sem rebuild** e sem caçar string espalhada no JSX.

**c18n / l10n:** muita gente chama o que o usuário percebe de **tradução** ou **localização (l10n)**; **i18n** é mais a **estrutura** que permite isso.

---

## Objetivo do projeto (vagas BR + contexto internacional)

- **Português (Brasil):** idioma **nativo** e **principal** para escrever e manter **specs** e regras finas — menos atrito, menos erro de interpretação.
- **Inglês:** **não** abandonar — é porta de entrada para recrutador estrangeiro, GitHub global e entrevista em inglês. O projeto oferece **acesso em inglês** (UI com locale `en`) e **documentação de entrada em inglês** (`docs/en/`, README raiz pode ser EN ou bilíngue — ver abaixo).

---

## Documentação: como encaixar PT canônico + EN

| Camada | Idioma | Onde |
|--------|--------|------|
| Specs de comportamento (fonte da verdade) | **PT-BR** | `docs/specs/`, extensões PT, partes do monólito que forem migradas para PT |
| Monólito / ADRs ainda em EN | **EN** (até migrar se quiser) | `student-flow.spec.md`, `decisions.md`, etc. — migrar com calma ou manter com link para PT |
| Leitor internacional | **EN** | `docs/en/README.md` (índice), resumos e links para os specs em PT; ao longo do tempo, pode ir **traduzindo** ou **espelhando** (`docs/en/...`) os arquivos críticos (Opção B parcial) |

**Regra prática:** mudou uma regra no spec **canônico (PT)**, atualiza na mesma semana o que existir de **resumo ou tradução em EN** que essa regra afeta — senão o inglês vira marketing mentiroso.

---

## Sistema (Next + API voltada ao usuário)

- **i18n** como acima: `pt-BR` **padrão** (escola no Brasil), `en` **sempre disponível** (seletor de idioma ou rota `/en` / `/pt`).
- Erros para a UI: **código** estável (`ENROLLMENT_DUPLICATE`) + mensagem traduzida no cliente (ou mensagem traduzida vinda da API, mas com contrato claro).

---

## Manuais do RAG

- Pastas **`docs/manuals/pt/`** e **`docs/manuals/en/`** (ou convenção equivalente).
- Chat usa o **locale** da sessão para buscar no corpus certo.

---

## Código

- Identificadores, nomes de rotas de API, nomes de tabelas: **inglês**.
- Texto visível: só via **i18n** / tradução.

---

## Decisão fechada (Nexus — conforme alinhamento)

**Canônico (specs / regras):** **PT-BR** (principal; nativo).  
**Inglês:** **acesso** (UI + `en`) + **documentação de entrada e resumos** em `docs/en/`, evoluindo para mais tradução se o tempo permitir.  
**i18n no app:** **obrigatório** quando existir UI Next — não é opcional se você quer “acesso em inglês” de forma séria.

*Última atualização: alinhamento explícito com o mantenedor (conversa).*
