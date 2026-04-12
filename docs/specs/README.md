# Spec program & learning alignment

This folder is the **working home** for area specs. Today, most **behavioral** rules still live in one place: `docs/student-flow.spec.md` (plus `docs/domain.md` for entities and `docs/especificacao-stack.md` for technology). The subfolders (`catalogo/`, `alunos-e-responsaveis/`, `matricula/`, `financeiro/`, `platform/`, `ia/`) hold **additional or extracted** specs as we deepen them—without contradicting the canonical sections below. **Help chat (RAG)** corpus lives in `docs/manuals/` (versioned), not in gitignored `learning/`.

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
| Enrollment fields, post-Active edits, address “mora com”, código legível | `docs/specs/matricula/matricula-campos-edicoes-pos-ativa.spec.md` | PT-BR; links from §6–§8, §19 |
| Academic results / progression | | §9–§11 (deferred where marked) |
| System-wide UX (auto-save, destructive confirm) | | §16 |
| Catalog (ano, nível, série, disciplinas, currículo, turma) | `docs/specs/catalogo/catalog.spec.md` | PT-BR; §17 do monólito aponta para cá |
| Seeds / norma externa MG 2026 | `docs/specs/catalogo/referencia-matriz-seemg-2026.md` | Como mapear Resolução SEE para `Disciplina` + currículo |
| Access (MVP secretariat only) | | §18 |
| Payment plans & installments (detalhe) | `docs/specs/financeiro/finance.spec.md` | PT-BR; §19 monólito + regeração |
| HTTP / erros / paginação / idempotência | `docs/specs/platform/api.spec.md` | PT-BR |
| UI secretaria (rotas mínimas, fluxos) | `docs/specs/platform/ui-secretaria.spec.md` | PT-BR |
| Help chat (RAG on secretariat manuals) | `docs/specs/ia/chat-ajuda-rag.spec.md` | Corpus: `docs/manuals/pt` + `en` |

---

## Coverage matrix — are we “done”?

Specs are **done enough to start coding** when every **MVP user journey** has: Preconditions, Happy path, Validation errors, Side effects, and **Destructive** flows with confirmation (§16). Gaps below are the usual next writing work—not a judgment that the monolith is useless.

| Area | Folder | Status | What’s strong today | What to add next (spec debt) |
|------|--------|--------|---------------------|------------------------------|
| **Catalog** | `catalogo/` | **Strong (MVP slice)** | `catalog.spec.md` — ano, nível, série, disciplina, currículo, turma, bloqueios de exclusão | Clonagem de ano; campus múltiplo; política fina se remoção de disciplina do currículo com **só** matrículas Canceladas deve ser permitida (hoje: bloqueio se existir **Ativa** — ver spec) |
| **Students & guardians** | `alunos-e-responsaveis/` | **Strong** | §2–§6, guardian link rules; `campos-aluno-e-responsavel.spec.md` (PT — field matrix, age config) | Optional: import/bulk (if ever in scope); document upload retention; occurrence logging tied to `domain.md` Occurrence |
| **Enrollment** | `matricula/` | **Strong** | §7–§15, §8; `matricula-campos-edicoes-pos-ativa.spec.md` inclui §5 código legível | Matriz de testes Given/When/Then; edge cases raros de duplicidade (concorrência duas abas) |
| **Finance** | `financeiro/` | **Strong (MVP)** | `finance.spec.md` — estados OPEN/CANCELLED, arredondamento, DATE, pré-visualização, idempotência | Estado **PAID** quando houver conciliação; ajuste fino de “total fechado” vs arredondamento por parcela |
| **API & errors** | `platform/` | **Good (base)** | `api.spec.md` — envelope, HTTP, paginação, Idempotency-Key, lista inicial de `code`s | OpenAPI gerado a partir do Nest; auth detalhada; webhooks (fora do MVP) |
| **UI / Next** | `platform/` | **Good (thin)** | `ui-secretaria.spec.md` — rotas lógicas, stepper, confirmações | Design system; componentes; testes E2E |

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

1. **OpenAPI / lista de endpoints** — Gerar a partir do scaffold Nest e manter alinhado a `platform/api.spec.md`.
2. **Cenários de teste** — Extrair Given/When/Then de matrícula + financeiro para pasta `docs/specs/quality/` ou arquivo único (quando existir runner de testes).
3. **Manuais RAG** — Expandir `docs/manuals/pt|en` (catálogo, financeiro) conforme `chat-ajuda-rag.spec.md`; manter paridade PT/EN.

---

## Related documents

- `docs/README.md` — product scope and goals  
- `docs/student-flow.spec.md` — main behavioral spec  
- `docs/especificacao-stack.md` — technology lock  
- `docs/decisions.md` — ADRs  
