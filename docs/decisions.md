# Architecture & Product Decisions

---

## Form Navigation Strategy

### Context

The system has two distinct use cases:

- Creating a new student
- Viewing or editing an existing student

### Decision

Use different navigation patterns depending on context:

- Stepper (guided flow) for student creation
- Tab or side navigation for viewing/editing student data

### Rationale

- Stepper ensures required data is properly filled during creation
- Free navigation improves usability when accessing existing data

### Trade-offs

- Requires maintaining two UI patterns

### Justification

Improves both data integrity and user experience

---

## Curriculum: disciplines by grade (série)

### Context

The legacy system ties many screens together; we need a clear rule for which subjects a student takes when enrolled.

### Decision

- The **grade curriculum** (discipline list per **academic year + grade**) is the **single source** for subjects on an enrollment in MVP.
- **All regular classes** sharing the same grade and academic year use the **same** discipline list in MVP.

### Rationale

- Simplifies catalog, enturmação, and conflict checks
- Matches common Brazilian K–12 operations where série defines the matrix

### Trade-offs

- Elective variants (different matrices per turma) are out of scope unless modeled later as separate grades or optional modules

### Related

- **Dependency / recovery subjects and extra classes** are **explicitly out of MVP** (no failing subjects or year-end simulation); may be reintroduced in a later phase with new specs

---

## MVP access: secretariat only

### Decision

Only **secretariat** users in MVP; no parent/teacher login surface required to ship the first vertical slice.

### Rationale

- Reduces auth matrix and permission bugs while the domain model stabilizes

---

## Enrollment status: minimal state machine (MVP)

### Decision

Implement only **Reservation**, **Active**, and **Cancelled** with the transitions documented in `student-flow.spec.md`.

- **Reservation**: editing matrícula; UI may **preview** curriculum only; **no** installment generation (persisted per-enrollment subject rows optional until Active—see spec)
- **Active**: materialize subjects from grade curriculum; generate installments once (if finance slice enabled)
- **Cancelled**: terminal; excluded from duplicate-enrollment rule

**Suspended**, **Transferred**, and **Completed** are not implemented in MVP (no UI, no API transitions).

### Rationale

- Matches the current simulation (no year-end, no trancamento flow) and shrinks implementation surface for the agent

---

## Enrollment cancellation vs student deletion

### Decision

- **Cancel enrollment:** enrollment becomes **Cancelled**; **all installments** for that enrollment are **cancelled** (logical void). The **student** master record remains for a possible return.
- **Delete student:** a **separate**, **optional** action; removes the student and student-scoped data. It is **not** automatic when cancelling an enrollment.
- **Guardians on student delete:** optional flag in confirmation—“delete guardian **person** rows only when they have **no** remaining student links.” If a guardian is linked to **other** students, that guardian **must** be kept.

### Rationale

- Separates “undo this year’s academic/financial link” from “remove this person from the system”
- Matches real families (same parent on multiple students) and avoids accidental data loss

---

## Guardians: shared records + lookup

### Decision

- Model **Guardian** as a **shared** person with the same **identity tracks** as students: **CPF** (Track A) **or** **document type + number** when there is no CPF (Track B—foreigners).
- Student form MUST support **search and attach** an existing guardian, not only “create new.”
- Creating a new guardian whose **strong key** (CPF or foreign-doc composite) already exists MUST route to **link existing**, not duplicate.

### Rationale

- Reduces duplicate responsáveis and speeds secretariat work for siblings and returning families
- Aligns Brazilian CPF holders and foreigners without CPF under one clear uniqueness model

---

## Destructive actions: mandatory confirmation

### Decision

Any **delete** or **terminal cancel** that removes or voids persisted user-visible data MUST require an explicit **confirmation** step (modal/dialog with consequences) before the server commits.

### Rationale

- Prevents costly mistakes in secretariat workflows; basic but must be in spec so implementation and QA have a single source of truth

---

## Finance MVP: installments only

### Context

Full treasury is a non-goal; generating charges at enrollment is still valuable for learning and realistic demos.

### Decision

Include a **minimal** finance slice:

- Configurable **payment plan** (amount, discount, installment count, due-date strategy)
- **Discount typing**: `%` in the value → percentage; no `%` → fixed BRL (backed by clear UI preview—see spec)
- **Generate installment rows** when enrolling (or at a defined enrollment step)
- Currency **BRL**
- **Snapshot** plan fields on generation so templates remain editable without rewriting history
- **No** payment gateway, boleto PDF, reconciliation, or bank integration

### Rationale

- Practices transactional modeling and business rules without external systems

### Trade-offs

- Requires idempotency and clear rules if enrollment is edited after generation—see spec

---

## Backend and tooling (portfolio)

### Decision

**NestJS** (API), **Prisma** (ORM/migrations), **PostgreSQL** (database), **Docker** for local DB reproducibility. **Next.js** for the secretariat UI — see `docs/especificacao-stack.md` for the full locked list and ordering.

### Rationale

Aligns with common job postings, a single TypeScript story across API and UI, and keeps interview narrative coherent.

### Related

- **`docs/especificacao-stack.md`** — authoritative technology list (sync this repo across machines; chat history is not the source of truth)

### Status

**Locked** for MVP implementation; changes require updating `docs/especificacao-stack.md` and this ADR section.

---

## Secretariat help chat (RAG over manuals)

### Context

The SK Aprendizagem role expects practical **RAG** experience. The MVP surface is small enough to maintain short, accurate **how-to manuals**.

### Decision

Ship a **help chat** in the secretariat UI. Answers are generated with **RAG** over **versioned** manual content in the repo (planned: `docs/manuals/`), not over gitignored personal notes.

### Rationale

- Clear interview story: corpus → embeddings → retrieval → grounded answers with citations
- Manuals stay small and aligned with specs; fast to author
- Distinct from (optional) future RAG over uploaded student/enrollment documents

### Related

- `docs/specs/ia/chat-ajuda-rag.spec.md`
- `docs/vaga-sk-aprendizagem.md`

---

## Post-active enrollment edits (grade vs class)

### Context

The MVP originally implied installments are generated once on **Reservation → Active** and did not spell out edits while **Active**.

### Decision

- **Active → Reservation** remains **forbidden**.
- While **Active**, secretariat may:
  - **Change only the regular class** (same academic year, same education level, same grade, same enrollment type): **keep** all existing installments unchanged; update class assignment only.
  - **Change grade and/or education level** (same academic year only): **rematerialize** subjects from the new grade curriculum; **cancel all** installments for that enrollment and **regenerate** from the new series’ default payment model **or** from manually entered amounts on the same confirmation flow (with preview).
- **Changing academic year** on an already **Active** enrollment is **out of scope**: use **cancel** enrollment + **new** enrollment for the new year.

### Rationale

Matches real secretariat corrections (wrong class vs wrong grade) and keeps finance consistent: different grade ⇒ new amounts; same grade ⇒ same charges.

### Related

- `docs/specs/matricula/matricula-campos-edicoes-pos-ativa.spec.md` (Portuguese — detailed rules)
- `docs/student-flow.spec.md` §8, §19

---

## Student address: “lives with guardian” source

### Context

Families often share one address; secretariat should not retype the same CEP twice.

### Decision

- On the student address step, offer **“Mora com responsável — usar endereço do responsável”** (final label for UX).
- When enabled: student address fields are **locked** until the user selects **exactly one** **Student–Guardian** link as the address source, and that guardian’s person record has a **complete** address.
- If no father/mother links exist, allow any linked guardian as source (see detailed spec).

### Rationale

Requires explicit **which** guardian supplies the address, avoiding ambiguity when parents differ.

### Related

- `docs/specs/matricula/matricula-campos-edicoes-pos-ativa.spec.md` §4
- `docs/student-flow.spec.md` §6 Step 3

---

## UI styling: Tailwind CSS

### Decision

Use **Tailwind CSS** (utility-first) for the Next.js secretariat UI. Avoid ad-hoc `.css` files except a documented rare global entry if needed.

### Rationale

Faster iteration, consistent spacing, aligns with common job stacks and keeps styling co-located with components.

### Related

- `docs/especificacao-stack.md` — UI section

---

## Age thresholds (majority and student marital status)

### Context

Legal age of majority and when marital status is relevant differ by country (and by U.S. state for some acts). The product must not hard-code one jurisdiction silently.

### Decision

Expose **institution-configurable** integers (env or settings table in a later phase), with documented defaults:

- `majorityAge` (default **18**) for “student is adult” UX and validations.
- `minAgeStudentMaritalStatus` (default **18**) for showing **student** marital status; institutions may set **16** only with their own policy/legal review.

### Related

- `docs/specs/alunos-e-responsaveis/campos-aluno-e-responsavel.spec.md` §1

---

## Spec filenames vs document language

### Decision

- Spec body **in Portuguese** → filename **in Portuguese** (ASCII kebab-case, no accents in the filename).
- Spec body **in English** → filename **in English**.

### Rationale

Easier navigation and consistent expectations for contributors and reviewers.

### Related

- `docs/specs/README.md`
- `docs/politica-de-idiomas.md`
