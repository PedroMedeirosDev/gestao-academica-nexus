# Referência: matrizes curriculares SEE/MG 2026 (base para seeds)

Este ficheiro **não** substitui a norma legal; define **como** o Nexus deve consumir matrizes oficiais para montar `Disciplina` + **currículo da série** (`catalog.spec.md`).

---

## Fonte normativa

- **Resolução SEE nº 5.212, de 19 de novembro de 2025** — organização e implementação das matrizes curriculares da Educação Infantil, Ensino Fundamental, Ensino Médio e modalidades da **Rede Estadual de Minas Gerais**, **ano letivo de 2026**.
- Identificação no documento de trabalho: SEI **1260.01.0214641/2025-25** (referência interna SEE).
- Cópia de trabalho usada no projeto: ficheiro local `Resolucao-e-Matriz-SEEMG-2026-.pdf` (não versionar o PDF no Git sem checagem jurídica de redistribuição; manter cópia institucional e citar sempre a publicação oficial).

---

## Escopo da demo Nexus (fechado)

Para seeds e catálogo inicial, o produto considera **apenas** estas ofertas da rede estadual (tempo integral):

| Oferta | Na resolução (Título III) | Anexos da matriz (tabelas no PDF) |
|--------|---------------------------|-----------------------------------|
| **Ensino Fundamental — Anos iniciais — integral (EFTI AI)** | Art. 26 — EFTI Anos iniciais | **Anexo XV** |
| **Ensino Fundamental — Anos finais — integral (EFTI AF)** | Art. 27 — EFTI Anos finais (6º ao 9º ano; 9 ou 7 módulos-aula/dia) | **Anexo XVI** (organização com **9** módulos-aula diários) e **Anexo XVII** (organização com **7** módulos-aula diários) |
| **Ensino Médio — integral (EMTI), propedêutico** | Art. 32, **inciso I** (9 módulos/dia) ou **inciso III** (7 módulos/dia) | **Anexo XVIII** (EMTI propedêutico, **9** módulos) **ou** **Anexo XL** (EMTI propedêutico, **7** módulos) |

**Fora do escopo** dos seeds iniciais (não importar para a primeira escola modelo, salvo decisão futura):

- EMTI **profissional** (Anexos XIX–XXXIX e XLI–LII), EM noturno, parcial, EJA, correção de fluxo, Educação Infantil, demais anexos da resolução.

**Recomendação prática:** na primeira base de dados, escolher **uma** variante de carga para EF anos finais (**XVI** *ou* **XVII**) e **uma** para EM propedêutico (**XVIII** *ou* **XL**), conforme a “escola modelo” (9 vs 7 módulos-aula/dia). O catálogo Nexus pode, mais tarde, manter **duas** séries paralelas por ano (ex.: “9º ano — 9 módulos” vs “9º ano — 7 módulos”) se for necessário conviver com as duas ofertas; no MVP basta **uma** linha por série nominal (6º…9º, 1º…3º EM).

---

## Mapeamento para o modelo Nexus

| Norma (SEE) | Nexus (`catalog.spec.md` + `domain.md`) |
|-------------|------------------------------------------|
| Componente curricular (nome na matriz) | Entidade **Disciplina** (`nome` exibido; opcional `sigla`). |
| Ordem de exibição / agrupamento por área | **Currículo da série**: campo **ordem**; área do conhecimento pode ser **fase 2** (campo opcional ou tag). |
| Aulas semanais (A/S), aulas anuais (A/A), horas anuais (H/A) | **Fora do MVP** de matrícula; podem entrar depois em metadados curriculares. |
| Anos/séries (1º ao 5º AI; 6º ao 9º AF; 1º ao 3º EM) | Uma entidade **Série** (ou equivalente) por **ano letivo** + **nível de ensino** + rótulo (“3º ano”, “1º ano EM”, …), cada uma com o seu **currículo**. |

### Níveis de ensino sugeridos no seed (rótulos)

- `Ensino Fundamental — Anos iniciais (integral SEE/MG 2026)`
- `Ensino Fundamental — Anos finais (integral SEE/MG 2026)`
- `Ensino Médio — Integral propedêutico (SEE/MG 2026)`

(Códigos estáveis `codigo` em `catalog.spec.md` podem ser `EFAI_EFTI_2026`, `EFAF_EFTI_2026`, `EM_EMTI_PROP_2026`, ajustando se já existir convenção no Prisma.)

---

## Passos operacionais para o seed

1. Para cada anexo do **escopo fechado**, extrair do PDF a lista de **componentes curriculares** por ano/série (e a **ordem** desejada na UI, em geral a mesma da tabela normativa).
2. **Normalizar** nomes para deduplicar `Disciplina` (ex.: uma única “Língua Portuguesa” partilhada entre séries quando o nome for idêntico).
3. Gerar seed (Prisma/SQL/JSON) com **ano letivo 2026**, os três níveis acima, todas as séries do escopo e respetivos currículos.
4. **Turmas** (`catalog.spec.md` §6): o PDF não fixa “7º A”; criar turmas placeholder (7º A, 7º B, …) só para testes de enturmação.

---

## O restante do PDF (contexto)

A resolução traz dezenas de anexos (EJA, EM profissional por curso técnico, etc.). Esses trechos permanecem **referência legal** para o futuro, mas **não** entram no escopo de importação do Nexus até haver spec e `tipo de matrícula` / itinerários que os justifiquem.

---

## Relacionamentos

- `docs/specs/catalogo/catalog.spec.md` — regras de catálogo e currículo.
- `docs/student-flow.spec.md` §7 — disciplinas da matrícula vindas do currículo da série.
