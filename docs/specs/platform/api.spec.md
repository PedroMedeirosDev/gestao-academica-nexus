# API HTTP (Nexus) — convenções e contratos base

**Status:** spec de plataforma para a camada **NestJS** (ou equivalente). Estende decisões gerais do produto; **não** substitui regras de domínio em `docs/student-flow.spec.md` nem nos specs de área.

**Idioma:** português (Brasil).

---

## 1. Formato e versão

- **Base:** prefixo `/api/v1` para todos os recursos versionados.
- **Corpo:** JSON (`Content-Type: application/json; charset=utf-8`).
- **Charset:** UTF-8; normalizar entradas de texto conforme regras de cada domínio (ex.: CPF sem máscara na API).

---

## 2. Autenticação (MVP)

- **Papel único:** secretaria (`student-flow.spec.md` §18).
- **NestJS + JWT** (`docs/decisions.md`): após login válido, a API emite **access token** JWT; rotas protegidas exigem `Authorization: Bearer <token>` (ou cookie httpOnly equivalente, se o monorepo fixar assim).
- **Rotas públicas (MVP):** `POST /api/v1/auth/login` (corpo JSON: `email`, `password`); `GET /api/v1/health` (liveness). **Demais rotas** exigem Bearer salvo exceção futura explícita no código (`@Public()`).
- **Sessão / perfil:** `GET /api/v1/auth/me` com Bearer → `{ id, email, role }` (`role` = valor do enum **`UserRole`** no Postgres; no MVP só existe **`SECRETARIA`** — ver modelo **`User`** em `schema.prisma` / `docs/decisions.md`).
- **401** sem token ou token inválido/expirado; **403** se no futuro existir autenticação sem o papel exigido pelo endpoint.
- Upload de **foto do aluno:** endpoint dedicado (ex. `POST /api/v1/students/:id/portrait`) que grava no **object storage** e persiste só a **chave/path** no Postgres (`portraitPhotoObjectKey`) — ver §2.1.

### 2.1 Fotos, bucket Supabase e CORS

- **`prisma migrate`** altera tabelas no **Postgres** (ex.: coluna com a chave do arquivo). **Não** cria bucket nem políticas do **Supabase Storage** — isso é feito no **Dashboard** (Storage → bucket + policies), no **Supabase CLI**, ou com SQL nas tabelas `storage.*`.
- **CORS** em upload/download direto do browser para a URL do Storage: ajuste nas **configurações de Storage/CORS** do projeto Supabase (ou use **URL assinada** gerada pelo Nest e consumida pelo Next na mesma origem que a API, reduzindo atrito de CORS).
- Fluxo comum: Next envia o **arquivo** para o **Nest** (mesma política CORS da API) → Nest usa **service role** / chave server-side no Supabase Storage SDK → grava no bucket → salva `portraitPhotoObjectKey` no aluno.

---

## 3. Envelope de erro

Resposta única de falha (campos podem ser estendidos com `traceId` depois):

```json
{
  "error": {
    "code": "ENROLLMENT_DUPLICATE",
    "message": "Texto legível para logs e fallback (pt-BR por padrão do servidor ou conforme Accept-Language).",
    "details": [
      { "field": "gradeId", "reason": "REQUIRED" }
    ]
  }
}
```

- **`code`:** string estável **UPPER_SNAKE_CASE**, usada pela UI para i18n (`errors.ENROLLMENT_DUPLICATE`).
- **`message`:** human-readable mínimo (não substitui catálogo de tradução na UI final).
- **`details`:** opcional; lista de violações de validação por campo.

### HTTP — mapeamento mínimo

| Situação | HTTP | `code` exemplo |
|----------|------|----------------|
| Validação de entrada (DTO) | 400 | `VALIDATION_ERROR` |
| Regra de negócio / conflito (duplicidade de matrícula) | 409 | `ENROLLMENT_DUPLICATE` |
| Recurso não encontrado | 404 | `NOT_FOUND` |
| Dependência de catálogo / bloqueio de exclusão | 409 | `CATALOG_DEPENDENCY` |
| Erro interno não tratado | 500 | `INTERNAL_ERROR` (sem vazar stack na resposta) |

---

## 4. Validação (400)

- Corpo com `error.code: "VALIDATION_ERROR"` e `details` preenchidos quando possível.
- Campos desconhecidos no JSON: **ignorar** ou **400** — escolher uma política por projeto e documentar; **recomendado:** ignorar chaves não mapeadas no DTO para compatibilidade.

---

## 5. Paginação e busca

- **Busca de alunos** (e listas semelhantes): `limit` (padrão 20, máximo **50**) e `offset` **ou** `cursor` — **MVP recomendado:** `limit` + `offset` por simplicidade.
- Resposta de lista:

```json
{
  "data": [],
  "meta": { "total": 123, "limit": 20, "offset": 0 }
}
```

- `total` pode ser opcional se custar caro; se omitido, documentar na rota.

---

## 6. Idempotência

- Para operações que **commitam** transições críticas (**Reserva → Ativa**, regeração de parcelas), aceitar header **`Idempotency-Key`** (UUID ou string única por usuário).
- Se o mesmo key for reenviado dentro de janela configurável (ex.: 24 h) com **mesmo** corpo, retornar **200** com o **mesmo** resultado da primeira vez (sem duplicar efeitos).
- Conflito de mesmo key com corpo diferente → **409** `IDEMPOTENCY_KEY_CONFLICT`.

---

## 7. Idioma da resposta (`message`)

- Respeitar **`Accept-Language`** quando a implementação tiver catálogo servidor; até lá, **pt-BR** padrão para `error.message` está aceitável no MVP.

---

## 8. Recursos (lista viva — expandir com o scaffold)

Marcadores para não esquecer endpoints; nomes finais podem seguir REST plural:

| Domínio | Exemplos | Notas |
|---------|----------|--------|
| Catálogo | `GET/POST /academic-years`, `.../grades`, `.../classes` | Alinhar a `docs/specs/catalogo/catalog.spec.md` |
| Alunos | `GET /students`, `POST /students`, `GET /students/:id` | Busca com paginação §5 |
| Matrículas | `POST /enrollments`, `PATCH` transições de status | Códigos de duplicidade §10 monólito |
| Financeiro | `POST .../preview-installments` | Ver `docs/specs/financeiro/finance.spec.md` §6 |

OpenAPI/Swagger: gerar quando o projeto Nest existir; este ficheiro permanece a **fonte normativa** de códigos e envelopes.

---

## 9. Códigos de erro de domínio (lista inicial)

Além dos genéricos acima, reservar (implementação pode acrescentar):

- `ENROLLMENT_DUPLICATE`, `ENROLLMENT_INVALID_TRANSITION`, `ENROLLMENT_CURRICULUM_EMPTY`
- `STUDENT_DRAFT_CONFLICT`, `GUARDIAN_LINK_REQUIRED`
- `CATALOG_DEPENDENCY`, `CATALOG_DUPLICATE`
- `FINANCE_*` (ver `finance.spec.md` §9)

---

## Relacionamentos

- Fluxo de matrícula: `docs/student-flow.spec.md`
- Catálogo: `docs/specs/catalogo/catalog.spec.md`
- Financeiro: `docs/specs/financeiro/finance.spec.md`
