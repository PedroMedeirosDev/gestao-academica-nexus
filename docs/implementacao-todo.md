# Lista de implementação (por blocos)

**Fonte de verdade:** `docs/student-flow.spec.md`, `docs/domain.md`, `docs/specs/**`, `docs/decisions.md`.

**Como acompanhar:** os **blocos numerados** repetem-se também nos **To-dos do Cursor** (painel de tarefas). Atualize os dois quando fechar um bloco.

---

## Onde estamos agora

| Bloco | Nome resumido | Situação |
|-------|----------------|----------|
| **0** | Fundação (repo, DB, API mínima, auth, `User` + `UserRole`) | **Concluído** |
| **1** | Plataforma HTTP (erro, listas, idempotência) | **Em andamento** (envelope + validação + Swagger feitos) |
| **2**–**8** | Catálogo → … → RAG | Pendente |

👉 **Próximo passo sugerido (ainda Bloco 1):** paginação `data`/`meta` nas listas quando existirem; depois `Idempotency-Key` nos POST críticos.

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
 BLOCO 1 — PLATAFORMA E CONTRATO HTTP  ← próximo
================================================================================
```

| Status | Item | Spec |
|--------|------|------|
| [x] | Envelope de erro (`error.code`, `message`, `details`); filtro global + validação (400) + demais HTTP do Nest | `docs/specs/platform/api.spec.md` §3 |
| [ ] | Listas grandes: `data` + `meta` (paginação) | `api.spec.md` §5 |
| [ ] | `Idempotency-Key` em POST críticos (quando existirem matrícula/financeiro) | `api.spec.md` |
| [x] | OpenAPI (Swagger UI em `/api/v1/swagger` + Bearer JWT) | `docs/specs/README.md` |
| [ ] | Revisar códigos de erro ↔ UI / i18n | `api.spec.md` + `student-flow` §16 |

---

```
================================================================================
 BLOCO 2 — CATÁLOGO ACADÊMICO (API)
================================================================================
```

| Status | Item | Spec |
|--------|------|------|
| [x] | **API:** `GET`/`POST` níveis de ensino (`/education-levels`) e disciplinas (`/disciplines`) — ver Swagger | `docs/specs/catalogo/catalog.spec.md` §2 e §4 |
| [x] | **API:** séries `GET|POST|DELETE /grades`, currículo `.../grades/:id/curriculum`, turmas `.../grades/:id/classes` + bloqueios principais do spec | idem §3, §5, §6 |
| [ ] | Série (Grade) + currículo + ordenação | idem |
| [ ] | Turma + bloqueios de exclusão | idem |
| [ ] | Seeds / referência MG (se aplicável) | `docs/specs/catalogo/referencia-matriz-seemg-2026.md` |

---

```
================================================================================
 BLOCO 3 — ALUNOS E RESPONSÁVEIS (API)
================================================================================
```

| Status | Item | Spec |
|--------|------|------|
| [ ] | Aluno: rascunho → completo, identidade, unicidade | `student-flow` §1–§6; `campos-aluno-e-responsavel.spec.md` |
| [ ] | Vínculos responsável–aluno; “mora com”; reutilizar responsável | `student-flow`; `decisions.md` |
| [ ] | Foto: upload/replace/clear via Nest + storage | `student-flow`; `api.spec.md` §2.1 |

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
