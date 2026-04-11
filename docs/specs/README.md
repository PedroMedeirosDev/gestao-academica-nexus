# Spec program & learning alignment

This folder is the **working home** for area specs. Today, most **behavioral** rules still live in one place: `docs/student-flow.spec.md` (plus `docs/domain.md` for entities and `docs/especificacao-stack.md` for technology). The subfolders (`catalogo/`, `alunos-e-responsaveis/`, `matricula/`, `financeiro/`, `ia/`) hold **additional or extracted** specs as we deepen them—without contradicting the canonical sections below. **Help chat (RAG)** corpus lives in `docs/manuals/` (versioned), not in gitignored `learning/`.

---

## How we generate specs (lightweight process)

1. **Name the gap** — e.g. “catalog edit while enrollments exist,” “installment rounding,” “API error shape.”
2. **Check the monolith** — if `student-flow.spec.md` already states the rule, **link it**; if the rule is vague, **extend** the right section *or* add an area file under `docs/specs/<area>/` and cross-link both ways.
3. **Write testable statements** — who/what/when, allowed transitions, validation, and what the user sees on failure.
4. **Commit before implementation** — the repo is the cross-device source of truth (not chat).
5. **Implement in stack order** (see below): data model → API → UI → tests.

**Rule of thumb:** one **decision** that changes product behavior → `docs/decisions.md` (ADR). One **behavior users/API must follow** → spec (`student-flow` or `docs/specs/...`).

**Nome do arquivo vs idioma do texto:** se o conteúdo do spec estiver **em português**, o **nome do arquivo** também deve estar **em português** (ex.: `campos-aluno-e-responsavel.spec.md`). Se o spec estiver **em inglês**, use nome **em inglês** (ex.: `catalog.spec.md`).

---

## Canonical map (where truth lives today)

| Concern | Canonical document | Sections / notes |
|--------|---------------------|------------------|
| Entities & names | `docs/domain.md` | Full domain overview |
| Stack | `docs/especificacao-stack.md` | Nest, Prisma, Postgres, Next, Docker |
| Student search, draft, identity, form, guardians | `docs/student-flow.spec.md` | §1–§6; field catalog `alunos-e-responsaveis/campos-aluno-e-responsavel.spec.md` |
| Enrollment structure, status, class, cancellation | | §7–§8, §12–§15 |
| Enrollment fields, post-Active edits, address “mora com” | `docs/specs/matricula/matricula-campos-edicoes-pos-ativa.spec.md` | PT-BR; links from §6–§8, §19 |
| Academic results / progression | | §9–§11 (deferred where marked) |
| System-wide UX (auto-save, destructive confirm) | | §16 |
| Catalog (year, grade, curriculum, turma) | | §17 |
| Access (MVP secretariat only) | | §18 |
| Payment plans & installments | | §19 |
| Help chat (RAG on secretariat manuals) | `docs/specs/ia/chat-ajuda-rag.spec.md` | Corpus: `docs/manuals/pt` + `en` |

---

## Coverage matrix — are we “done”?

Specs are **done enough to start coding** when every **MVP user journey** has: Preconditions, Happy path, Validation errors, Side effects, and **Destructive** flows with confirmation (§16). Gaps below are the usual next writing work—not a judgment that the monolith is useless.

| Area | Folder | Status | What’s strong today | What to add next (spec debt) |
|------|--------|--------|---------------------|------------------------------|
| **Catalog** | `catalogo/` | **Thin in monolith** | §17 + `domain.md` | CRUD flows per entity; constraints (delete year with data, rename grade); **editing grade curriculum** when reservations/actives exist; ordering of disciplines; education level vs grade if modeled separately |
| **Students & guardians** | `alunos-e-responsaveis/` | **Strong** | §2–§6, guardian link rules; `campos-aluno-e-responsavel.spec.md` (PT — field matrix, age config) | Optional: import/bulk (if ever in scope); document upload retention; occurrence logging tied to §`domain` Occurrence |
| **Enrollment** | `matricula/` | **Strong** | §7–§15, §8 | Explicit **enrollment code** generation/uniqueness; duplicate-enrollment rule edge cases; read-only views; optional API-oriented acceptance criteria |
| **Finance** | `financeiro/` | **Good** | §19 | Installment **states** (open / cancelled / paid-if-ever); **rounding** per installment; timezone/date-only rules; preview totals before Active |
| **API & errors** | *(no folder yet)* | **Missing** | — | New doc when ready: REST shape, validation errors, idempotency keys, pagination for search—**after** domain specs stabilize |
| **UI / Next** | *(no folder yet)* | **Missing** | Implied in monolith | Routes, layouts, stepper vs tabs (`decisions.md`); can stay thin until API spec exists |

When an area file is added (e.g. `catalogo/catalog.spec.md`), put at the top: **“Extends `student-flow.spec.md` §17; supersedes nothing unless explicitly stated.”**

---

## Learning phases ↔ spec phases

Use the same **order** for learning and for closing spec debt: each phase has a **spec outcome** and a **build outcome**.

| Phase | Spec focus (what to write or tighten) | You learn (stack) | Build outcome |
|-------|--------------------------------------|-------------------|---------------|
| **0 — Ground** | Read `domain.md`, `docs/especificacao-stack.md`, `decisions.md`; list gaps in the matrix above | TypeScript, Git workflow | Issue list or checklist in this README |
| **1 — Data** | Finalize catalog + finance **field-level** rules needed for Prisma (`catalogo/`, `financeiro/` deepens) | PostgreSQL basics, Prisma schema & migrations | `schema.prisma` + migrations matching specs |
| **2 — API** | Add API/error conventions; enrollment + student endpoints acceptance criteria | Nest modules, DTOs, pipes, config modules | Nest app + OpenAPI or README endpoint list |
| **3 — UI** | Optional UI spec: routes map to §1 entry and flows | Next App Router, forms, calling API | Secretariat shell + 1 vertical slice |
| **4 — Quality** | Extract **test scenarios** from specs (Given/When/Then) | Jest/Vitest, integration tests with test DB | Tests for critical domain rules |
| **5 — Ship** | Deploy & env spec (non-secret): services, ports, health | Docker Compose, one cloud target | Runnable demo |

**Portfolio / market-aligned layers:** Phases 1–4 cover React/Next/TS/Nest/Postgres/Prisma/Docker/tests. For optional RAG, agents, Redis, and deploy mapping, see `docs/objetivos-tecnicos-portfolio.md` — those layers enter only with an explicit feature spec + ADR, not as a disconnected demo.

---

## Suggested next spec sessions (concrete)

1. **`catalogo/catalog.spec.md`** — First new area file: lifecycle of academic year → grade → curriculum → class; destructive confirmations for catalog deletes (§16 already requires this generically).
2. **`financeiro/finance.spec.md`** — Enumerate installment states, rounding, and “edit after Active” if any.
3. **`api.spec.md`** (under `docs/` or `docs/specs/platform/`) — When Nest scaffold exists: resource list + error envelope.

---

## Related documents

- `docs/README.md` — product scope and goals  
- `docs/student-flow.spec.md` — main behavioral spec  
- `docs/especificacao-stack.md` — technology lock  
- `docs/decisions.md` — ADRs  
