# Lista de implementação (por blocos)

**Fonte de verdade:** `docs/student-flow.spec.md`, `docs/domain.md`, `docs/specs/**`, `docs/decisions.md`.

**Como acompanhar:** os **blocos numerados** repetem-se também nos **To-dos do Cursor** (painel de tarefas). **Os To-dos do Cursor não vão no Git** — ao mudar de máquina, use este ficheiro + `git pull` como referência e reabra/atualize os to-dos no Cursor à mão se precisar.

---

## Onde estamos agora

| Bloco | Nome resumido | Situação |
|-------|----------------|----------|
| **0** | Fundação (repo, DB, API mínima, auth, `User` + `UserRole`) | **Concluído** |
| **1** | Plataforma HTTP (erro, listas, idempotência) | **Concluído** (paginação, idempotência base, catálogo de erros) |
| **2** | Catálogo acadêmico (API + seed) | **Concluído** |
| **3** | Alunos, responsáveis, vínculos, retrato (API + Supabase Storage) | **Concluído** |
| **4**–**8** | Matrícula → … → RAG | Pendente |

👉 **Próximo passo sugerido:** **Bloco 4** — API matrícula (estados, disciplinas, `publicCode`, etc.).

---

```
================================================================================
 BLOCO 0 — FUNDAÇÃO (concluído)
================================================================================
```

- [x] Monorepo, workspaces, Prisma alinhado ao domínio, migrations (incl. foto aluno)
- [x] API Nest: `api/v1`, health, anos letivos, validação global
- [x] Auth: JWT (`POST /auth/login`, `GET /auth/me`), guard global, `@Public()` em login + health
- [x] Tabela **`User`** com **`UserRole`** (MVP: `SECRETARIA`); legado `SecretariatUser` renomeado na migration
- [x] Docs SQL bucket fotos; specs de plataforma base

---

```
================================================================================
 BLOCO 1 — PLATAFORMA E CONTRATO HTTP  (concluído)
================================================================================
```

| Status | Item | Spec |
|--------|------|------|
| [x] | Envelope de erro (`error.code`, `message`, `details`); filtro global + validação (400) + demais HTTP do Nest | `docs/specs/platform/api.spec.md` §3 |
| [x] | Listas grandes: `data` + `meta` (paginação) | `api.spec.md` §5 |
| [x] | `Idempotency-Key`: modelo + serviço + `POST /academic-years` (exemplo); matrícula/financeiro quando existirem | `api.spec.md` §6 |
| [x] | OpenAPI (Swagger UI em `/api/v1/swagger` + Bearer JWT) | `docs/specs/README.md` |
| [x] | Códigos de erro ↔ UI / i18n: catálogo `business-error.ts` + `errors.<code>` no `api.spec.md` §3 | `api.spec.md` + `student-flow` §16 |

---

```
================================================================================
 BLOCO 2 — CATÁLOGO ACADÊMICO (API) — concluído
================================================================================
```

| Status | Item | Spec |
|--------|------|------|
| [x] | **API:** `GET`/`POST` níveis de ensino (`/education-levels`) e disciplinas (`/disciplines`) — ver Swagger | `docs/specs/catalogo/catalog.spec.md` §2 e §4 |
| [x] | **API:** séries `GET|POST|DELETE /grades`, currículo `.../grades/:id/curriculum`, turmas `.../grades/:id/classes` + bloqueios principais do spec | idem §3, §5, §6 |
| [x] | Série (Grade) + currículo + ordenação (PATCH série, PATCH ano, exclusões com bloqueios, currículo `sortOrder` ≥ 1) | idem |
| [x] | Turma + bloqueios de exclusão (GET/PATCH turma, exclusão com contagem por status) | idem §6 |
| [x] | Seeds / referência matriz 2026 (`npm run db:seed`, `prisma/seed.js`) | `docs/specs/catalogo/referencia-matriz-seemg-2026.md` |

---

```
================================================================================
 BLOCO 3 — ALUNOS E RESPONSÁVEIS (API) — concluído
================================================================================
```

| Status | Item | Spec |
|--------|------|------|
| [x] | Aluno: rascunho → completo, identidade, unicidade | `student-flow` §1–§6; `campos-aluno-e-responsavel.spec.md` |
| [x] | Vínculos responsável–aluno; “mora com”; reutilizar responsável | `student-flow`; `decisions.md` |
| [x] | Foto: upload/replace/clear via Nest + storage (bucket `student-portraits`, env Supabase na API) | `student-flow`; `api.spec.md` §2.1 |

---

```
================================================================================
 BLOCO 4 — MATRÍCULA (API)
================================================================================
```

| Status | Item | Spec |
|--------|------|------|
| [ ] | Estados e transições RESERVATION / ACTIVE / CANCELLED | `student-flow` §7–§8, §12–§15 |
| [ ] | Disciplinas da matrícula + enturmação | idem + `catalog.spec.md` |
| [ ] | `publicCode`, pós-Ativa, duplicidade (índice parcial SQL) | `matricula-campos-edicoes-pos-ativa.spec.md` |

---

```
================================================================================
 BLOCO 5 — FINANCEIRO (API, se no corte do MVP)
================================================================================
```

| Status | Item | Spec |
|--------|------|------|
| [ ] | Planos, parcelas, arredondamento, cancelamento em cascata | `docs/specs/financeiro/finance.spec.md` |
| [ ] | Pré-visualização na reserva; geração na ativa; idempotência | idem + `student-flow` |

---

```
================================================================================
 BLOCO 6 — UI SECRETARIA (NEXT)
================================================================================
```

| Status | Item | Spec |
|--------|------|------|
| [ ] | Scaffold `apps/web`, `NEXT_PUBLIC_API_URL` | `especificacao-stack.md`; `monorepo-estrutura.md` |
| [ ] | `/login`, token, redirect | `ui-secretaria.spec.md`; `student-flow` §18 |
| [ ] | Shell, rotas por área, stepper vs abas, confirmações destrutivas | specs + `decisions.md` |

---

```
================================================================================
 BLOCO 7 — QUALIDADE E ENTREGA
================================================================================
```

| Status | Item | Spec / notas |
|--------|------|----------------|
| [ ] | Testes de integração (regras críticas) com DB de teste | `docs/specs/README.md` |
| [ ] | E2E API estáveis (JWT + CI) | `apps/api/test/` |
| [ ] | Docker Compose, checklist deploy | `decisions.md`; `README` |

---

```
================================================================================
 BLOCO 8 — IA / RAG (OPCIONAL)
================================================================================
```

| Status | Item | Spec |
|--------|------|------|
| [ ] | Manuais em `docs/manuals/`; feature conforme spec | `docs/specs/ia/chat-ajuda-rag.spec.md` |

---

## Meta (documentação)

| Status | Item |
|--------|------|
| [ ] | `domain.md` ↔ `schema.prisma` |
| [ ] | `decisions.md` ↔ código |
| [ ] | `monorepo-estrutura.md` quando `apps/web` existir |
| [ ] | Novas ADRs quando mudar comportamento visível ao **usuário** |

---

*Checklist alinhada à matriz em `docs/specs/README.md`.*
