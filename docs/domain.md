# Domain Overview

## Access (MVP)

- **Secretariat**: single role for MVP; creates and maintains students, catalog, enrollments, class assignments, and (if enabled) installment generation

---

## Academic Year

Represents an operational school year as a **single integer** (e.g. `2026`), unique in MVP scope.

- Contains grades, curriculum templates, and classes in scope for that year

---

## Grade (Série)

Represents a cohort level within an education track (e.g. “7º ano”).

- In MVP, **all regular classes** of the same grade in the same academic year share the **same discipline list** (curriculum template)

---

## Discipline (catalog)

A subject offered by the institution (name, optional metadata such as workload).

- Not tied to a student until it appears on a **grade curriculum** or an enrollment’s resolved subject list

---

## Grade Curriculum (disciplines by série)

The set of disciplines that apply to a **grade** in a given **academic year** (the “period” template: e.g. “7º ano 2026 has these disciplines”).

- **Enrollment** resolves its **full** subject set from this template in MVP (no extra subjects per student)
- **All regular classes** for that grade/year use the same template in MVP

---

## Class (Turma)

A **regular** group of students for a grade and academic year, used for scheduling and **primary** enrollment assignment (enturmação).

- **Dependency** or **extra-subject** classes are **out of MVP**

---

## Student

Central entity of the system.

### Required Fields

- Name
- Birth Date
- **Legal identity (one track):** **CPF** (Track A) **or** **official document type + number** for foreigners without CPF (Track B)—see `student-flow.spec.md` §5
- Image Usage Authorization
- **RG** or other national IDs may be stored in addition when required by policy; they do **not** replace the strong key in §5

### Notes

- A student can exist without an active enrollment
- A student may have multiple enrollments over time

---

## Guardian (Responsável)

A **person** in the institution’s directory (not owned by a single student).

- **Email** and **phone** are required in MVP (contact). **Address** is required on the person record; if the guardian is **financially responsible** for any student link, **address** and **profession** must be complete before enrollment flows that depend on finance (see `docs/specs/alunos-e-responsaveis/campos-aluno-e-responsavel.spec.md`).
- Optional **education level** (grau de instrução) on the guardian person—not collected for students in MVP.
- May store a **postal address** on the person record (used when a student’s address is derived from “lives with guardian” — see enrollment spec)
- **Strong key:** **CPF** when the person has one (Track A); **identity document type + number** when there is **no** CPF—foreigner / exception path (Track B), same idea as students (see `student-flow.spec.md` §5)
- May be linked to **many students** (e.g. siblings, former students still on file)
- **Search and link** when registering a student avoids duplicate rows and speeds up matrícula (see `student-flow.spec.md`)

---

## Student–Guardian link

Associates one **Student** with one **Guardian** for a given role/context.

- Holds **relationship type** (father, mother, etc.) and **financial responsible** flag **for that student**
- Optionally, for **student address “lives with guardian”** mode, **at most one** link per student may be flagged as the **address source** for the student’s registered address (see `docs/specs/matricula/matricula-campos-edicoes-pos-ativa.spec.md` §4)
- Deleting a **student** removes **links** to that student; **Guardian** rows remain unless a separate delete path runs under strict rules (see spec—never delete if still linked to another student)

---

## Enrollment

Represents a student’s registration in a specific **academic year** and **grade** (and enrollment type).

### Characteristics

- Linked to a student
- Associated with a specific academic year and grade
- **Subjects** are exactly those from the **grade curriculum** for that year (not defined by the class)
- **One** regular class assignment in MVP

### Status (MVP)

- Only **Reservation**, **Active**, and **Cancelled** are implemented; see `student-flow.spec.md` for transitions and side-effects (materialização de disciplinas e parcelas ao ativar).

---

## Enrollment Subject (resolved)

The list of subjects the student takes for that enrollment.

- In MVP: **identical** to the **Grade Curriculum** for that academic year + grade (snapshot or reference strategy in implementation)

---

## Discipline (in enrollment context)

Represents one subject on the enrollment’s list.

### Notes

- MVP: no per-student additions; same matrix for all students in that year + grade

---

## Occurrence

Represents events related to a student.

### Characteristics

- Linked to a student
- May reference an enrollment and/or discipline as context

---

## Financial Responsibility

Not necessarily a separate entity: in MVP it is the **financial responsible** flag on a **Student–Guardian link** (at least one such link must be set for minors).

### Notes

- Responsible for debts and installments at the domain level for that student
- Must be validated during enrollment
- MVP does **not** include payment collection—only installment **records** if finance slice is in scope

---

## Payment Plan (modelo de pagamento)

Template configured by secretariat (or admin) used when generating installments for an enrollment.

### Typical attributes

- Default **monthly amount** (BRL)
- Optional **discount**: product rule may use **`%` in input** to mean percentage vs fixed; persisted model should use explicit **`discountType`** + **`discountValue`** (see spec)
- **Installment count** (including single installment / “boleto único” as one row)
- **Due date strategy**: first due date, fixed day-of-month for all installments, and/or **manual override** per generated installment

### Notes

- On generation, the enrollment stores a **snapshot** of plan fields so later template edits do not change past installments (see spec)

---

## Installment (Mensalidade / parcela)

A dated amount owed for an enrollment.

- Currency: **BRL**
- Generated at enrollment per payment plan rules; **no** gateway or bank integration in MVP
- Lifecycle in MVP includes **cancelled** when the parent enrollment is **Cancelled** (no “boleto” file—only records in the system; see `student-flow.spec.md`)
