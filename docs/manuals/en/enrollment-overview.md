# Enrollment in Nexus — secretariat overview

> **Manual version:** 0.1 (aligned with `docs/specs/matricula/matricula-campos-edicoes-pos-ativa.spec.md` and `docs/student-flow.spec.md` §7–§8, §19). Update when the real UI ships.

---

## What an enrollment is

The link between a **student** and an **academic year**, **level**, **grade**, **enrollment type**, **class**, and **status** (Reservation → Active or Cancelled). Subjects come from the **grade curriculum**; class does not change the subject list in MVP.

---

## Status flow (short)

```
[new]        →  Reservation
Reservation  →  Active     (confirm: materialize subjects; generate installments if a plan exists)
Reservation  →  Cancelled (discard draft)
Active       →  Cancelled (void installments)
```

**Example copy:**  
*“The enrollment is still in **Reservation** — I can change grade and plan with no charges yet. When I click **Confirm**, it becomes **Active** and installments are generated once.”*

---

## Duplicate rule

A student cannot have two **Reservation** or **Active** enrollments for the same **year + level + grade + type**.

---

## After Active: class-only vs grade change

| Case | Installments |
|------|----------------|
| Same year, grade, type — **class** change only | **Keep** installments. |
| **Grade** or **level** changes (same year) | **Cancel all** installments for that enrollment and **regenerate** (with preview + strong confirmation). Subjects are **re-materialized**. |

**Example (class only):**  
*“Student should be in 7B, not 7A.”* → Update class; fees unchanged.

---

## Changing academic year on an Active enrollment

**Not supported** on the same row. **Cancel** the old-year enrollment and **create** a new one for the new year.

---

## “Lives with guardian” address

If enabled, pick **exactly one** student–guardian link as the address source; that guardian must have a **complete** address.

---

## Full rules

See repository specs (`matricula-campos-edicoes-pos-ativa.spec.md`, `student-flow.spec.md`). This file feeds the **help chat RAG** corpus in English.
