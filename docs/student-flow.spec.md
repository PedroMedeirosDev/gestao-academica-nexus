# Student & Enrollment Management Spec

---

## 1. Entry Point

User navigates to:

Academic > Student Records

---

## 2. Search

### Single search input

Must support:

* Student Name
* CPF
* Foreign identity document number (and type if needed to disambiguate)
* RG
* Enrollment Code
* Guardian Name

### Behavior

* Searching by guardian name must return all associated students
* Results must display relationship context (e.g. guardian name)
* Searching by enrollment code must return a unique result

---

## 3. Student Lifecycle

A student can exist in two states:

### Draft

* Created after meaningful interaction
* May contain incomplete or invalid data
* Can be resumed later

### Completed

* All required data is valid
* Student is officially registered

---

## 4. Draft Creation

### Rules

* Must NOT be created on "New Student"
* Must be created after meaningful input (e.g. Name, CPF, document upload)
* Must ignore trivial interactions
* Should use debounce before persisting

---

## 5. Legal identity: CPF and foreign documents (MVP)

### Identity tracks (student and guardian)

Every **Student** and every **Guardian** MUST resolve to exactly **one** identity track:

| Track | When | Strong key (uniqueness in the institution) |
|--------|------|---------------------------------------------|
| **A — CPF** | Person has a **Brazilian CPF** | **CPF** (normalized digits only) |
| **B — Foreign document** | Person **does not** have CPF (typical: foreign national) | **Composite:** `identityDocumentType` + `identityDocumentNumber` (normalized), optional `issuingCountry` if useful for disambiguation |

* **Track B** is the **exception** to “CPF is the strong key”: the **official identity document** (passport, RNE, protocol with photo per school policy, etc.) becomes the strong key. Type + number together MUST be unique per person category (**students** vs **guardians**—same number on a passport could theoretically appear in both systems only if different people; still enforce uniqueness **within** each entity table).
* UI MUST make secretaria choose **explicitly** between “Informar CPF” and “Estrangeiro / sem CPF — documento oficial” so the system never guesses.

### CPF rules (Track A — students)

* CPF must be **unique** across all **students** using Track A.

#### Case 1: CPF does not exist

* Allow normal flow

#### Case 2: CPF exists (Completed)

* Block creation
* Inform user
* Allow viewing existing record

#### Case 3: CPF exists (Draft)

* Inform user
* Allow:

  * Resume draft
  * Discard draft and start new

### Constraint (students, Track A)

* Multiple drafts with the same CPF are NOT allowed

### Foreign document rules (Track B — students)

* Required fields: **document type** (controlled list, e.g. Passport, RNE, Other—label + code), **document number** (as on the document, stored normalized for comparison).
* **Uniqueness:** the pair **(type + normalized number)** MUST be unique among students on Track B (same duplicate behavior as CPF: block Completed, offer resume/discard for Draft—mirror §5 CPF cases for consistency).
* **Search** (§2) MUST allow finding a student by that document number (and ideally type) where applicable.

### Guardian identity (MVP)

* **Track A:** same uniqueness and **link existing** behavior as today: one row per CPF; duplicate CPF → link existing (see §6 Step 2).
* **Track B:** one row per **(identityDocumentType + normalized identityDocumentNumber)** among guardians; duplicate → **link existing**, never duplicate person.
* **Search** for linking MUST support **CPF** and **foreign document number** (and name).

---

## 6. Student Form

**Field catalog (student vs guardian, demographics, age thresholds, Tailwind-related copy keys):** `docs/specs/students-and-guardians/campos-aluno-e-responsavel.spec.md` (Portuguese).

### Step 1: Personal Data

* Name
* Birth Date
* **Either** Track A: **CPF** **or** Track B: **identity document** (type + number, per §5)
* **RG** remains allowed for Brazilian students when the product still collects it alongside CPF, or as national secondary ID—exact combination with Track A/B is implementation-defined, but **uniqueness** always follows §5 (CPF **or** foreign-doc composite, not both as dual primary keys).
* Image Authorization
* **Sex, nationality** (and other principal fields per linked spec); **marital status** for the **student** only if age ≥ configured `minAgeStudentMaritalStatus` (default **18**, institution-configurable—see linked spec); **no** student “education level” (grau de instrução) in MVP

#### Rules

* If Track A: CPF must be valid; invalid CPF blocks progression
* If Track B: document type and number required; invalid or duplicate composite blocks progression (same spirit as CPF)

---

### Step 2: Guardians

Guardians are **shared persons**: the same **Guardian** record may be linked to **multiple students** (e.g. siblings). Per student, the system stores a **link** with relationship and flags for **that** student.

#### Add guardian — two paths (both required in MVP)

1. **Link existing guardian**
   * UI MUST offer **search** (minimum: **name**, **CPF**, **foreign document number**; partial match acceptable for name).
   * Results show enough context to disambiguate (name, CPF or masked/hinted document id, maybe count of students already linked).
   * On select, secretaria defines for **this student only**: **relationship type** (father, mother, etc.), **financial responsible** flag, and any fields that are **per-link** if modeled that way.
   * Purpose: avoid duplicate guardian rows and speed up enrollment for families already in the system.

2. **Create new guardian**
   * Full capture: **Name**, **Track A or B identity** (CPF **or** document type + number per §5), **Relationship type**, **Financial responsible** flag, **Deceased** flag (on the person, when applicable).
   * **Contact:** **email** and **phone** required on the guardian person record (MVP).
   * **Address:** required on the guardian person; **stricter** when this person is **financial responsible** for the student (complete address + **profession** required—see linked spec).
   * **Education level (grau de instrução):** optional on guardian only; not collected for students in MVP.
   * If **CPF** or **foreign-doc composite** matches an existing guardian, MUST **block** a duplicate person row and steer the user to **link existing** (see §5).

#### Data on the guardian vs on the link

* **Guardian (person):** identity fields (name, CPF **and/or** foreign document fields per track, deceased, **email**, **phone**, **address**, **profession** when financially responsible, optional education level—see linked spec).
* **Student–guardian link:** relationship type, financial-responsible-for-**this**-student, ordering/display if needed.

#### Rules

* For minors:

  * At least one guardian **link** is required
  * At least one linked guardian MUST be marked **financial responsible** for that student
* Parents must be registered whenever possible
* Parents may be marked as deceased on the **guardian** record

---

### Step 3: Address

* Standard address fields
* Optional **“lives with guardian — use guardian’s address”** mode: when enabled, student address inputs are **locked** until the user selects **exactly one** **Student–Guardian** link as the address source and that guardian’s record has a **complete** address. Full rules: `docs/specs/enrollment/matricula-campos-edicoes-pos-ativa.spec.md` §4.

#### Behavior

* Must auto-fill via CEP (when not in guardian-address mode, or when policy applies to copied address)

---

### Step 4: Health Data

* Optional information

---

### Step 5: Documents

* Multiple uploads allowed
* AI extraction supported
* Extracted data must be editable

---

## 7. Enrollment Structure

A student may have multiple enrollments.

Each enrollment contains:

* Academic Year
* Education Level
* Grade
* Enrollment Type
* Status
* Academic Result

**Field-level detail, post-Active edits (class vs grade), and finance regeneration:** `docs/specs/enrollment/matricula-campos-edicoes-pos-ativa.spec.md` (Portuguese — BR).

### Base disciplines (MVP)

* The **only** subjects for the enrollment come from the **Grade Curriculum** for that **Academic Year** and **Grade** (not from the assigned class).
* **All regular classes** for the same academic year and grade share the same Grade Curriculum.
* **Dependency subjects, recovery classes, and elective add-ons** are **out of MVP** (no failing subjects or year-end simulation).

### When subjects are persisted

* While status is **Reservation**, the UI may show a **read-only preview** of subjects from the Grade Curriculum (no requirement to persist per-enrollment subject rows yet).
* When status becomes **Active**, the system MUST **materialize** the enrollment’s subject list (copy or stable reference per implementation) from that curriculum.

---

## 8. Enrollment Status (MVP — implement only this)

The MVP implements **three** statuses end-to-end (UI, API, persistence, and rules). Other statuses are **not** available in MVP: no transitions, no filters, and no seeds unless the codebase already defines an enum (then they must be unreachable dead values until a future phase).

### Statuses in use

| Status | Meaning (MVP) |
|--------|----------------|
| **Reservation** | Matrícula em elaboração: secretaria ainda pode alterar ano/série/turma/plano de pagamento/etc. **Não** gera parcelas nem materializa disciplinas da matrícula no banco (apenas **pré-visualização** a partir da Grade Curriculum). |
| **Active** | Matrícula efetivada: disciplinas da matrícula **materializadas**; parcelas geradas **uma vez** ao entrar neste status (regras na §19). |
| **Cancelled** | Enrollment voided: excluded from duplicate-enrollment rule vs Reservation/Active; **no** reactivation in MVP (open a **new** enrollment if needed). See **cancellation side-effects** below. |

### Allowed transitions (MVP)

```text
[create]  →  Reservation
Reservation  →  Active      (confirmar / efetivar matrícula)
Reservation  →  Cancelled   (descartar rascunho de matrícula)
Active       →  Cancelled   (cancelar matrícula já efetivada)
```

* **Forbidden in MVP**: any transition into **Suspended**, **Transferred**, or **Completed**; any transition **out of** **Cancelled**; **Active** → **Reservation** (não “desefetivar” no MVP).
* **While Active**, editing **data fields** of the same enrollment is allowed only under the rules in `docs/specs/enrollment/matricula-campos-edicoes-pos-ativa.spec.md` (e.g. class-only change keeps installments; grade change cancels and regenerates installments — same academic year only; changing academic year on an Active enrollment is **not** supported: cancel + new enrollment).

### Deferred (documented for later, not implemented)

* **Suspended** (trancamento)
* **Transferred** (transferência externa/interna)
* **Completed** (encerramento de ano letivo)

When those phases exist, expand this section with new transitions and side-effects (parcelas, vagas, histórico).

### Cancellation side-effects (MVP)

* **Product language:** “cancelling boletos” in MVP means **cancelling every installment** (charge row) for that enrollment. There is no boleto file or payment gateway—only **records** that must stop representing an active charge.
* **Reservation → Cancelled:** usually **no** installments exist yet; the enrollment becomes **Cancelled**. If an implementation ever created rows early (not recommended), those rows MUST be **cancelled** or removed consistently.
* **Active → Cancelled:** **all** installments linked to the enrollment MUST be **cancelled** (**Cancelled** state / logical void). No installment may remain **open** or **due** for that enrollment. Prefer **logical cancel** (keep rows for audit) over **hard delete** unless law or policy explicitly requires deletion.
* **Student master data:** after cancelling an enrollment, the **student** record (person, guardians, history including cancelled enrollments, etc.) **remains** for a possible return or a **new** enrollment later.
* **Delete student:** a **separate**, **optional** action; full rules in **§16 — Student deletion (MVP)**. MUST use **explicit confirmation** (see §16).
* **Confirmation:** cancelling an enrollment (especially **Active → Cancelled**) MUST use the **destructive-action confirmation** flow (§16), summarizing impact (e.g. how many installments will be cancelled).

---

## 9. Academic Result

### MVP

* Only **In Progress** is used in the MVP simulation (no assessments, no year-end closing).
* Values such as Approved, Failed, or partial progression are **reserved for future** phases and MUST NOT drive behavior in MVP.

---

## 10. Enrollment Constraints

A student MUST NOT have more than one enrollment with:

* Same Academic Year
* Same Education Level
* Same Grade
* Same Enrollment Type

AND with status:

* Reservation
* Active

(**Cancelled** is ignored for this rule. **Suspended** is not used in MVP.)

---

## 11. Enrollment Progression (deferred)

**MVP:** The simulation does **not** model year-end, promotions, or closing an academic year. Rules for moving a student to the next grade are **out of scope** until assessments and enrollment closing exist.

---

## 12. Class Structure (MVP)

A **regular class** (turma) is a group of students for a given **Academic Year** and **Grade**.

### Out of MVP

* **Dependency** classes (recovery by subject)
* **Extra** subject classes
* Any workflow tied to **failed subjects** or **multiple class assignments** per enrollment

---

## 13. Class Assignment (MVP)

* Each enrollment MUST have exactly **one** assignment to a **regular** class (PRIMARY enturmação)
* No secondary class assignments in MVP

---

## 14. Class Model (MVP)

Each regular class must contain at minimum:

* Academic Year
* Grade
* Optional human-readable identifier (e.g. class name or code: “7º A”)

### Curriculum note

* Regular classes sharing the same Academic Year + Grade use the **same** Grade Curriculum; the turma does not define a different subject list.

---

## 15. Enrollment Behavior (MVP)

* The student attends **one** regular class for that enrollment
* The enrollment’s subjects are **only** those from the Grade Curriculum for that year + grade

---

## 16. System Rules

* Data must **not be lost unintentionally** (no silent drops during editing; predictable persistence). **Intentional** removal or voiding after explicit user confirmation is allowed (see below).
* Auto-save is required
* Draft must always be recoverable until explicitly discarded or superseded
* Extracted data must be editable
* Domain rules must not depend on UI filters

### Destructive actions — confirmation required (MVP)

* Any operation that **deletes** persisted data or **terminally cancels** financial/academic links in a way **not undoable by the user without re-creating records** MUST require **explicit confirmation** before the server commits (e.g. modal/dialog with clear consequences—not a single accidental click).
* **MVP examples** (minimum list; product may add, not remove):
  * Cancel enrollment (**Reservation → Cancelled** or **Active → Cancelled**), highlighting when **installments** will be cancelled
  * Delete **student** record (see **Student deletion** below—including guardian options)
  * Discard **student Draft** when that deletes persisted data
  * Delete **catalog** entities when removal is destructive (e.g. class with links—define block vs cascade; either way, confirm)
* **Outside this pattern:** normal edits, saves, transitions that do not remove history (e.g. Reservation → Active), search and read-only flows.
* Confirmation copy MUST summarize **what** will be removed or voided (e.g. “12 installments will be cancelled”; “this student and all enrollments will be deleted”).

**Process note:** “obvious” rules like this **belong in the spec from MVP onward**; there is no need to defer a separate “general rules phase.” When new destructive actions appear, extend this section or reference a UX standards doc.

### Student deletion (MVP)

* **Scope:** deleting a student removes **all data scoped to that student** (e.g. enrollments, installments tied to those enrollments, student–guardian **links**, student documents, student address records—exact cascade follows the schema, but the **intent** is: no orphan student row and no active academic/financial ties left for that student).
* **Guardians (responsáveis):** a guardian is a **shared** person; deleting one student MUST **not** automatically delete guardian persons unless the user explicitly opts in and rules below allow it.
* **Confirmation (required):** the dialog MUST:
  * Summarize counts (enrollments, installments to void/delete, documents, etc.)
  * Include an explicit option, e.g. **“Also delete guardian records when they are not linked to any other student”** (wording for secretaria). Default recommendation: **off** (only remove **links**; keep guardian directory entries).
  * If the option is **on**: for each linked guardian, after removing this student’s links, delete the **Guardian** person row **only if** that guardian has **zero** remaining student links. If the guardian is still linked to **another** student, the guardian MUST **remain**—never delete.
  * If the option is **off**: remove only **student–guardian links** for this student; **all** guardian person records stay (even if they become unused—optional future cleanup is out of MVP).
* **Preview list:** before confirm, show per guardian: **“Will be kept (linked to other students: …)”** vs **“Eligible for deletion after this student is removed (no other students)”** when the opt-in is enabled—so secretaria sees the multi-student case clearly.
* **Same guardian, multiple students:** this is the **normal** case the confirmation must protect; the spec rule is absolute: **never** remove a guardian who still has another student link.

---

## 17. Academic Catalog (MVP)

### Academic Year

* Identifies the operational school year (e.g. 2026)
* Scopes grades, grade curricula, and regular classes
* Detailed CRUD rules: `docs/specs/catalog/catalog.spec.md` (Academic Year slice)

### Grade (Série)

* Represents the cohort level within the education track (aligned with enrollment’s Education Level + Grade)
* **Grade Curriculum** is always defined per **Academic Year + Grade**

### Grade Curriculum

* The list of **disciplines** for that year + grade (e.g. “7º ano / 2026”)
* Secretaria maintains this list before using it in enrollments
* New enrollments **resolve** their base subject list from this template

### Class (Turma, regular)

* Belongs to an Academic Year and a Grade
* Used for **primary** class assignment (enturmação)
* In MVP, does **not** redefine the base discipline list (same curriculum as any other regular class for that year + grade)

---

## 18. Access Control (MVP)

* Only the **Secretariat** role exists in MVP
* Secretariat may perform all catalog, student, enrollment, class assignment, and (if enabled) installment operations
* Additional roles are out of scope until specified

---

## 19. Payment Plans & Installments (MVP finance)

### Currency

* All monetary values use **BRL (Real)**

### Payment Plan (modelo de pagamento)

Configurable template managed by secretaria, including at minimum:

* **Base amount** used to derive installments (interpreted with installment count; aligns with “valor da mensalidade” in the product language)
* Optional **discount** (MVP):
  * **Product rule (what secretaria types):** if the input contains **`%`** → **percentage**; if not → **fixed BRL** (e.g. `10%` vs `50` / `50,00`).
  * **Persistence rule (what the system stores — recommended):** do **not** rely only on “string contains `%`” in the database. Persist explicitly:
    * `discountType`: `PERCENT` **or** `FIXED_BRL`
    * `discountValue`: number (e.g. `10` for 10%, or `50` for fifty reais)
  * The UI may **infer** `discountType` from the presence of `%` while typing, but **submission** must send (or the API must derive once and store) the **typed** fields so exports, relatórios e integrações futuras não quebrem por locale ou espaços (`10 %`, copy-paste, etc.).
  * **Application:** percentage → discount off each installment’s **gross** before rounding; fixed BRL → same nominal discount **per** installment, clamped so no installment goes below zero.
* **UX (required):** segmented control (“R$ fixo” / “%”), helper text, **live preview** (“Será aplicado: 10% sobre cada parcela” / “Será aplicado: R$ 50,00 em cada parcela”), and decimal/comma hints. The control should **sync** with `discountType` so the user is never guessing what will be saved.
* **Installment count** (use `1` for a single charge / “boleto único” modeled as one installment row in MVP)
* **Due date strategy**, supporting:
  * A **single due date** when there is only one installment
  * **Parcelado**: a general rule such as first due date + **fixed day-of-month** for all generated installments (e.g. “vence todo dia 08”)
  * **Manual**: secretaria can set or adjust the due date **per installment** after generation (bulk “same day for all” remains a UX shortcut on top of the same model)

### Enrollment linkage

* On installment generation, the enrollment stores a **snapshot** of the relevant plan fields (amounts, discount interpretation, count, due-date strategy). Later edits to the **Payment Plan** template do **not** change installments already generated.

### Generation trigger

* Installments are generated **only** on the transition **Reservation → Active** (first time the enrollment becomes Active). No other status change generates installments in MVP.
* **Regeneration:** when an **Active** enrollment’s **grade and/or education level** changes (same academic year) per `docs/specs/enrollment/matricula-campos-edicoes-pos-ativa.spec.md`, the system MUST **cancel** all existing installments for that enrollment and then **generate** a new set (new snapshot). **Class-only** changes do **not** trigger regeneration.

### Idempotency

* Generating installments for an enrollment MUST be **idempotent**: if installments already exist for that enrollment, the system MUST NOT create duplicates **except** within the defined **cancel-then-regenerate** transaction for grade changes (see linked spec). Prefer **“generate only when count is zero”** on first activation; regeneration must leave exactly one active generation batch per business operation.

### Enrollment cancellation (installments)

* When an enrollment transitions to **Cancelled** from **Active**, **every** installment belonging to that enrollment MUST be **cancelled** (void) per §8. Open/collectible installment states MUST NOT remain for that matrícula.

### Explicit non-goals

* Payment gateway, boleto file generation, bank reconciliation, dunning automation, and full treasury

### Financial responsibility

* Logical debtor remains the **Financial Responsibility** guardian tied to the student/enrollment; MVP does not require new guardian fields beyond existing rules
