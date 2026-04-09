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

### Decision (provisional)

Pick **one** API stack (e.g. NestJS **or** FastAPI) and **Prisma + PostgreSQL** for persistence; containerize with Docker for reproducibility.

### Rationale

Aligns with common job postings and keeps the story coherent in README and interviews.

### Status

Final choice recorded when the repository scaffold exists.
