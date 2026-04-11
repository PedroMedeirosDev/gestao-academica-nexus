# Objetivos técnicos do portfolio (Nexus)

Este documento liga **temas comuns** em vagas de desenvolvimento (full-stack, dados, IA, deploy) às **entregas** do Nexus — **sem** referir empresa ou recrutador específicos. Serve para manter o escopo de demonstração coerente com o produto (gestão acadêmica / secretaria).

**Fonte de verdade de stack:** `docs/especificacao-stack.md` + `decisions.md`. O que ainda não estiver “travado” na especificação da stack entra com **ADR** quando for para implementação.

---

## Glossário: o que é RAG?

**RAG** significa *Retrieval-Augmented Generation* (geração **aumentada** por **recuperação**).

Em linguagem direta:

1. Um **modelo de linguagem** (LLM) sozinho responde com o que “lembra” do treinamento — não enxerga os PDFs da escola e pode **alucinar** detalhes.
2. Com **RAG**, antes de gerar a resposta o sistema **recupera** trechos dos **teus** dados (ex.: documentos anexados ao aluno ou à matrícula), usando **busca por similaridade** (muitas vezes com **vetores** — ver abaixo).
3. Esses trechos entram no **contexto** do modelo; a resposta é **ancorada** nesse material. Na prática: a secretaria pergunta “este contrato menciona desconto?” e o sistema responde **com base nos documentos daquele processo**, idealmente **citando** de onde veio a informação.

**Vetores / embeddings:** o texto é transformado numa lista de números (um **vetor**) que representa o “sentido” do trecho. Perguntas parecidas ficam **geometricamente perto** no espaço vetorial — por isso dá para achar os parágrafos certos sem buscar só por palavra exata. **pgvector** (no Postgres) ou **Qdrant** guardam esses vetores e permitem essa busca.

**O que RAG não é:** um chat **aberto** sem corpus (ex.: “fala sobre história do Brasil”). No Nexus o RAG fica **ancorado** em texto teu: **manuais da secretaria** (chat de ajuda) e, numa fase opcional, **documentos do processo** (aluno/matricula).

---

## Temas técnicos × cobertura no Nexus

| Tema (comum no mercado) | Como o Nexus demonstra | Estado |
|-------------------------|-------------------------|--------|
| **React** | Next.js usa React como base da UI | ✅ Já na stack (`docs/especificacao-stack.md`) |
| **Next.js** | App Router, interface da secretaria | ✅ Já na stack |
| **TypeScript** | API (Nest) + UI (Next) | ✅ Já na stack |
| **NestJS ou FastAPI** | NestJS (escolha fechada para narrativa TS única) | ✅ Já na stack |
| **PostgreSQL** | Banco relacional único MVP | ✅ Já na stack |
| **Prisma** | Schema + migrations | ✅ Já na stack |
| **RAG / vetores (pgvector ou Qdrant)** | **Chat de ajuda** com manuais versionados (`docs/specs/ia/chat-ajuda-rag.spec.md`); opcionalmente documentos do aluno/matricula num spec à parte | 📋 Manuais + ADR antes de codar |
| **Agentes (N8N ou LangGraph)** | Orquestração de fluxo (ex.: pós-upload de documento, extração assistida, webhook); N8N cobre **low-code** | 📋 Mesmo critério: feature + spec |
| **Docker** | Compose com Postgres (e, na fase deploy, serviços necessários) | ✅ Já previsto; estender quando houver mais serviços |
| **Cloud / deploy (Vercel, Railway, AWS)** | README de deploy: ex. Next → Vercel; API + DB → Railway/Fly/AWS RDS; variáveis e migrações documentadas | 📋 Documentar na fase “Ship” (`docs/specs/README.md` fase 5) |
| **Segurança e testes** | Validação (DTOs/class-validator), erros consistentes, testes de **regras de domínio** críticas; evitar segredos no repo | ✅ Parcialmente na stack; 📋 detalhar em `api.spec.md` + cenários de teste |
| **No-code / low-code (N8N)** | Mesmo N8N usado para agentes/automação | 📋 Opcional, quando houver fluxo real |
| **Redis** | Cache de leitura (catálogo), rate limit em rota de IA, ou fila leve — só com **motivo** no ADR | 📋 Opcional |
| **Open source** | Narrativa pessoal (contribuições, issues, PRs) | ⚪ Fora do código do projeto |

---

## Demonstração IA (RAG + automação) sem estourar o MVP

Muitas posições pedem **experiência prática** com IA aplicada — não slide.

### Fatia 1 — **Chat de ajuda com RAG** (prioridade)

O MVP tem **poucas funções**: dá para manter **manuais curtos** (catálogo, aluno, matrícula, parcelas). Um **chat na UI** responde perguntas tipo *“Como faço uma matrícula?”* com **RAG** sobre esses manuais (trechos recuperados + resposta citando a fonte). Corpus **pequeno e versionável**.

- Spec: **`docs/specs/ia/chat-ajuda-rag.spec.md`**
- Corpus: **`docs/manuals/pt/`** e **`docs/manuals/en/`** — não usar a pasta `learning/` (gitignored) como fonte de verdade.

### Fatia 2 — Documentos do processo (opcional, depois)

1. **Upload** de documento ligado a **estudante** ou **matrícula** (`docs/specs/ia/ingestao-documentos.spec.md` quando existir).
2. **Embeddings** em **pgvector** (Postgres) **ou** Qdrant se um ADR justificar segundo serviço.
3. **RAG** sobre o **conteúdo desse processo** com citação de trecho.
4. **Automação:** **N8N** ou **LangGraph** para pós-upload (extração/embed, notificação, rascunho para revisão humana — §16).

---

## Ordem sugerida (núcleo + diferenciação)

1. **Núcleo:** domínio + Prisma + Nest + Next + Docker (Postgres) + testes de regras + deploy documentado.
2. **Specs finos:** catálogo, financeiro, API/erros (matriz em `docs/specs/README.md`).
3. **Camada IA / infra:** manuais + chat (RAG); ADR pgvector vs Qdrant; depois ingestão opcional, N8N/LangGraph; Redis só se um fluxo justificar.

---

## O que ainda **não** está na `docs/especificacao-stack.md`

Para implementar: atualizar `docs/especificacao-stack.md` e `decisions.md` com ADRs quando adotar, entre outros:

- **pgvector** ou **Qdrant**
- **N8N** e/ou **LangGraph** (onde rodam: Docker local vs cloud)
- **Redis** (se adotado)
- **Provedor de deploy** (um caminho documentado costuma bastar)

---

## Próximos passos de spec (ordem suave)

| Ordem | O quê | Onde escrever |
|-------|--------|----------------|
| 1 | Catálogo: série, currículo, turma | `docs/specs/catalogo/catalog.spec.md` |
| 2 | Financeiro: parcelas, arredondamento, datas | `docs/specs/financeiro/finance.spec.md` |
| 3 | API: erros, listagens, idempotência | `docs/specs/...` ou `docs/api.spec.md` |
| 4 | IA: chat + RAG sobre manuais | `docs/specs/ia/chat-ajuda-rag.spec.md` + `docs/manuals/pt/` + `en/` |
| 4b | IA opcional: upload → embeddings → RAG | `docs/specs/ia/ingestao-documentos.spec.md` |
| 5 | Redis etc. | Parágrafo no spec ou ADR em `decisions.md` |

Se uma tecnologia **ainda não tiver** história no produto, um **cenário mínimo** escrito no spec é válido — evita parecer “tecnologia de vitrine” sem uso.

---

## Checklist antes de apresentar o portfolio

- [ ] Cada tecnologia relevante aparece no projeto **ou** em spec/ADR justificando adiamento.
- [ ] Consigo explicar **por que** RAG, automação ou cache estão (ou não) no Nexus.
- [ ] Deploy reproduzível (Docker + guia de ambiente).
- [ ] Testes cobrem pelo menos **uma** regra crítica de negócio (matrícula, identidade, parcelas ou cancelamento).
