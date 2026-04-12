# Monorepo — pastas e ordem de trabalho

## Árvore (objetivo)

```text
Gestão Academica Nexus/
├── apps/
│   ├── api/          ← NestJS (já scaffold: health + anos letivos)
│   └── web/          ← Next.js (a gerar)
├── prisma/           ← schema + migrations (fonte única do banco)
├── docs/             ← specs e SQL auxiliar
├── package.json    ← workspaces npm (raiz)
└── .env              ← não versionado; DATABASE_URL etc.
```

- **`prisma/` na raiz:** um só modelo de dados; a API importa o `@prisma/client` gerado a partir daqui.
- **`apps/api`:** onde roda `nest new` / código Nest. O `package.json` da API aponta o Prisma para `../../prisma/schema.prisma`. Com a API no ar (`npm run dev:api`), o **Swagger (OpenAPI)** fica em **`http://localhost:3001/api/v1/swagger`** (JWT: botão *Authorize* → `Bearer <token>`).
- **`apps/web`:** onde roda `create-next-app` ou equivalente.

---

## O que eu quis dizer com “primeiro recurso de domínio” (em português claro)

**GET** e **POST** são só **verbos HTTP** (“buscar” e “criar/atualizar”).

**“Recurso de domínio”** aqui significa: **uma coisa do sistema real**, a primeira que você implementa **de ponta a ponta** só para “provar” que API + banco + regras funcionam juntos — **não** é um termo técnico obrigatório.

Exemplos bem literais:

| Exemplo | O que seria na prática |
|---------|-------------------------|
| **Ano letivo** | Tela ou Postman chama a API → **GET** lista os anos → **POST** cria “2027”. Os dados vêm do Postgres (tabela que o Prisma já modelou). |
| **Lista de alunos** | **GET** com nome na URL → devolve página de resultados. |

Você escolhe **uma** dessas coisas pequenas como “primeira vitória” depois do `GET /health`. Não precisa ser “ano letivo”; pode ser outra coisa mínima do `docs/` — o importante é **não** começar já com matrícula + parcelas + tudo junto.

---

## Organização por domínio (padrão do repo)

- **API:** cada domínio = pasta em `apps/api/src/<nome>/` com `*.module.ts`, `*.controller.ts`, `*.service.ts` e `dto/` quando precisar (ex.: `academic-years/`).
- **Web (quando existir):** rotas/UI agrupadas por área de produto, alinhado aos specs.
- Regra para o Cursor (e para copiar a outros projetos): [`.cursor/rules/organizacao-por-dominio.mdc`](../.cursor/rules/organizacao-por-dominio.mdc).

## `backend/` / `frontend/` vs `apps/api` / `apps/web`

Os nomes **`backend`** e **`frontend`** continuam válidos — são só pastas.

O padrão **`apps/api`** e **`apps/web`** veio de **monorepos** (um `package.json` na raiz, vários pacotes dentro de `apps/`). Ferramentas como Turborepo e exemplos oficiais usam essa convenção; não é “obrigatório”, é **organização comum** quando API e site moram no mesmo Git.

Se preferir renomear para `apps/backend` e `apps/frontend`, funciona — ajuste o campo `workspaces` na raiz e os paths do Prisma (`../../prisma`).

---

## Próximo passo depois desta estrutura

1. ~~Gerar o projeto **Nest** dentro de `apps/api`~~ (feito).
2. Gerar o **Next** dentro de `apps/web`.
3. ~~Ligar a API ao Prisma e ao `.env`~~ (feito para a API).
4. Evoluir módulos (auth JWT, mais catálogo, alunos, …).
