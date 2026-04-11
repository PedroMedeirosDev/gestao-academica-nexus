# Academic Management System

## Overview

This project aims to modernize the academic management workflow, focusing on improving the student registration and enrollment process.

The current system suffers from:

- Manual data entry
- High risk of human error
- Data loss due to session expiration
- Inefficient search and filtering

---

## Goals

- Deliver an end-to-end **secretariat** flow: academic catalog (years, grades, disciplines, classes), student and guardian data, **enrollment**, **class placement** (enturmação), and discipline assignment driven by **grade (série)** curriculum
- Reduce manual input using AI-assisted document processing (where applicable)
- **Secretariat help chat (RAG):** answers “how do I…?” questions using a small set of versioned manuals (see `docs/specs/ai/help-chat-rag.spec.md`); optional later: RAG over per-student enrollment documents
- Prevent data loss with auto-save mechanisms
- Improve user experience with better search and form structure
- Optional MVP slice: **generate installments** at enrollment from a configurable **payment plan** (no payment gateway)

---

## Scope (Current Phase / MVP)

- **Role**: Secretariat only (users who register students and run enrollments)
- **Academic catalog**: Academic year, education level, grade (série), **discipline list per grade** (curriculum template), classes (turmas) for a grade/year
- **People**: Student profile; **guardians** as **shared** persons (strong key: **CPF** or **foreign official document** when no CPF) with **student–guardian links**; **search existing guardian** + create new; addresses, health (optional), documents
- **Enrollment**: Link student to academic year, grade, type; **status** limited to **Reservation → Active → Cancelled** (no trancamento/transferência/conclusão no MVP). Subjects **only** from the **grade curriculum**; exactly **one** regular class (enturmação). **No** dependency/recovery subjects or multi-class assignment in MVP
- **Finance (MVP subset)**: Payment plan template (monthly amount, optional discount, installment count, due-date strategy); generating **installment rows** on enrollment; currency **BRL**; manual per-installment due dates or fixed calendar day (e.g. “due on the 8th”); **no** boleto generation, gateway, reconciliation, or full treasury; **cancelling an Active enrollment cancels all its installments**; student record may remain until explicitly deleted
- **UX invariant**: any **destructive** action (e.g. cancel enrollment, delete student, discard draft) requires **explicit confirmation** before commit — see `student-flow.spec.md` §16

---

## Non-Goals (For Now)

- Parent/teacher portals and multi-role access control beyond secretariat
- Full treasury, billing integrations, bank files, chargebacks
- Rich reporting and analytics
- Complete “all edge cases” academic operations (only rules documented in specs)
- **Dependency / recovery** subjects, **failed grades**, and **year-end progression** (simulation does not close the school year)

---

## Learning & portfolio (technical growth)

The project is also a **structured learning path** toward a full-stack profile (e.g. Next.js + TypeScript, API layer, PostgreSQL + Prisma, Docker, tests). **RAG** is tied to concrete features: **help chat over secretariat manuals** (primary SK slice) and, later if needed, document ingestion for enrollment. See `docs/specs/ai/help-chat-rag.spec.md` and `docs/job-target-sk-aprendizagem.md`. Personal study files belong in repo-root `learning/` (gitignored) — see `docs/learning-notes.md`.

**How code and docs relate:** It is valid to use an agent for most implementation work. Your leverage is **clear specs and decisions** (this folder), **review** (does behavior match the spec?), and being able to **explain** *why* each technology exists (problem it solves, trade-off, what would break without it). That skill set is closer to **tech lead / product engineer** than to memorizing syntax.

Suggested order: solid **TypeScript** and **domain modeling** → **Prisma schema** matching this docs folder → **NestJS** API → **Next.js** UI for secretariat flows → **Docker** + local PostgreSQL → **automated tests** for domain rules → then optional **Redis**, **pgvector**, or automation tools if they support a real use case. Stack details: `stack.spec.md`.

**Job-target alignment (SK Aprendizagem):** requirement-to-project mapping and planned AI/deploy layers — `docs/job-target-sk-aprendizagem.md`. Use it while finishing specs so nothing valued by the role is left implicit.

**Languages:** behavioral specs are **canonical in PT-BR** where noted; **English** entry point for readers — `docs/en/README.md`. Full policy: `docs/language-policy.md` (i18n + **layout** when PT/EN strings differ in length).

---

## Related documents

- `docs/language-policy.md` — PT + EN: what “real i18n” means, canonical language, `docs/en/`
- `docs/en/README.md` — English documentation index and glossary
- `docs/learning-notes.md` — why `learning/` is gitignored (personal notes vs versioned docs)
- `docs/domain.md` — entities and relationships
- `docs/decisions.md` — architecture and product decisions (ADRs)
- `docs/job-target-sk-aprendizagem.md` — SK Aprendizagem technical requirements ↔ Nexus demonstration plan
- `docs/stack.spec.md` — locked technologies (NestJS, Prisma, PostgreSQL, Next.js, Docker, TS)
- `docs/specs/README.md` — **spec program**: process, coverage matrix, gaps, and **learning phases** aligned with implementation order
- `docs/student-flow.spec.md` — behavioral rules (student, enrollment, class, finance subset); dependency/recovery **deferred**
