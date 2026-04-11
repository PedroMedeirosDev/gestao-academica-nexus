# Academic catalog — area spec

Extends `docs/student-flow.spec.md` §17; supersedes nothing unless explicitly stated. Destructive actions follow §16 (explicit confirmation before commit).

---

## Academic Year (MVP) — first slice

### Purpose

An **Academic Year** is the operational school year (e.g. 2026). It **scopes** grades, grade curricula, and regular classes: nothing in the catalog “hangs” in the void without a year.

### Data the secretariat maintains

- **Year** — single **integer** calendar year (e.g. `2026`). It is both the business identifier and what appears in lists, filters, and dropdowns (no separate free-text label in MVP).

### Rules

1. **Range:** `year` must be within **1990–2100** (inclusive). Out of range → validation error before persist.
2. **Uniqueness:** two academic years cannot share the same **year** value.
3. **Create:** secretariat can create a year when the value is in range and unique; success returns the created record and shows it in the catalog list.
4. **Edit year value:** allowed only if the new value is in range, unique, and **no** dependent rows exist yet for this academic year (same dependency set as delete). Rationale: changing `2025` → `2026` after grades or enrollments exist would confuse reports and support; MVP avoids that. If there are **no** dependents, correction of a mistaken year is allowed and does **not** change the internal `id` (foreign keys stay valid).
5. **Delete:** allowed only if **no** grade, grade curriculum row, class, enrollment, or payment-plan row (if modeled per year) references this academic year. If any reference exists, the system **blocks** delete and returns a clear message listing the **type** of blocking dependency (e.g. “There are enrollments for this year” / “There are grades defined for this year”) without requiring the user to guess.
6. **Delete confirmation:** when delete is allowed, the confirmation dialog states that the year is empty of dependents; on confirm, the year is removed permanently (hard delete for this entity in MVP).

### API / UI notes (MVP)

- List years ordered by **year** descending (most recent first).
- Empty state: message guiding creation of the first year before defining grades.

### Out of scope (this slice)

- Overlapping date ranges, legal start/end of lessons, multiple campuses, cloning a full year from another.
