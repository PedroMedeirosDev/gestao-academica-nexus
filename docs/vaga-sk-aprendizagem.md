# Alinhamento: vaga SK Aprendizagem ↔ Nexus

Este documento traduz os **requisitos técnicos** da vaga em **entregas e specs** do projeto, para o portfolio demonstrar as competências procuradas sem perder um núcleo coerente (gestão acadêmica / secretaria).

**Fonte de verdade de stack:** `docs/especificacao-stack.md` + `decisions.md`. Itens abaixo que ainda não estão “travados” no `docs/especificacao-stack.md` entram com **ADR** quando forem decididos para implementação.

---

## Glossário: o que é RAG?

**RAG** significa *Retrieval-Augmented Generation* (geração **aumentada** por **recuperação**).

Em linguagem direta:

1. Um **modelo de linguagem** (LLM) sozinho responde com o que “lembra” do treinamento — não enxerga os PDFs da tua escola e pode **alucinar** detalhes.
2. Com **RAG**, antes de gerar a resposta o sistema **recupera** trechos dos **teus** dados (ex.: documentos anexados ao aluno ou à matrícula), usando **busca por similaridade** (muitas vezes com **vetores** — ver abaixo).
3. Esses trechos entram no **contexto** do modelo; a resposta é **ancorada** nesse material. Na prática: a secretaria pergunta “este contrato menciona desconto?” e o sistema responde **com base nos documentos daquele processo**, idealmente **citando** de onde veio a informação.

**Vetores / embeddings (ligação com a vaga):** o texto é transformado numa lista de números (um **vetor**) que representa o “sentido” do trecho. Perguntas parecidas ficam **geometricamente perto** no espaço vetorial — por isso dá para achar os parágrafos certos sem buscar só por palavra exata. **pgvector** (no Postgres) ou **Qdrant** guardam esses vetores e permitem essa busca.

**O que RAG não é:** um chat **aberto** sem corpus (ex.: “fala sobre história do Brasil”). No Nexus o RAG fica **ancorado** em texto teu: **manuais da secretaria** (chat de ajuda) e, numa fase opcional, **documentos do processo** (aluno/matricula).

---

## Requisitos × cobertura no Nexus

| Requisito (vaga) | Como o Nexus demonstra | Estado |
|------------------|-------------------------|--------|
| **React** | Next.js usa React como base da UI | ✅ Já na stack (`docs/especificacao-stack.md`) |
| **Next.js** | App Router, interface da secretaria | ✅ Já na stack |
| **TypeScript** | API (Nest) + UI (Next) | ✅ Já na stack |
| **NestJS ou FastAPI** | NestJS (escolha fechada para narrativa TS única) | ✅ Já na stack |
| **PostgreSQL** | Banco relacional único MVP | ✅ Já na stack |
| **Prisma** | Schema + migrations | ✅ Já na stack |
| **RAG / vetores (pgvector ou Qdrant)** | **Chat de ajuda** com manuais versionados (`docs/specs/ia/chat-ajuda-rag.spec.md`); opcionalmente documentos do aluno/matricula num spec à parte | 📋 Manuais + ADR antes de codar |
| **Agentes (N8N ou LangGraph)** | Orquestração de fluxo (ex.: pós-upload de documento, extração assistida, webhook); N8N cobre também **low-code** da vaga | 📋 Mesmo critério: feature + spec |
| **Docker** | Compose com Postgres (e, na fase deploy, serviços necessários) | ✅ Já previsto; estender quando houver mais serviços |
| **Cloud / deploy (Vercel, Railway, AWS)** | README de deploy: ex. Next → Vercel; API + DB → Railway/Fly/AWS RDS; variáveis e migrações documentadas | 📋 Documentar na fase “Ship” (`docs/specs/README.md` fase 5) |
| **Segurança e testes** | Validação (DTOs/class-validator), erros consistentes, testes de **regras de domínio** críticas; evitar segredos no repo | ✅ Parcialmente na stack; 📋 detalhar em `api.spec.md` + cenários de teste |
| **Diferencial: no-code/low-code (N8N)** | Mesmo N8N usado para agentes/automação | 📋 Opcional, valorizado se aparecer no fluxo real |
| **Diferencial: Redis** | Cache de leitura (catálogo), rate limit em rota de IA, ou fila leve — só com **motivo** no ADR | 📋 Opcional |
| **Diferencial: open source** | Não depende do repo Nexus; narrativa de entrevista (contribuições, issues, PRs) | ⚪ Fora do código do projeto |

---

## Demonstração IA (RAG + agentes) sem estourar o MVP

A vaga pede **experiência prática**, não um slide.

### Fatia 1 — **Chat de ajuda com RAG** (prioridade acordada)

O MVP tem **poucas funções**: dá para manter **manuais curtos** (como usar catálogo, aluno, matrícula, parcelas). Um **chat na UI** responde perguntas tipo *“Como faço uma matrícula?”* com **RAG** sobre esses manuais (trechos recuperados + resposta citando a fonte). Justifica bem a vaga e o corpus é **pequeno e versionável**.

- Spec: **`docs/specs/ia/chat-ajuda-rag.spec.md`**
- Corpus: arquivos em **`docs/manuals/pt/`** e **`docs/manuals/en/`** (a criar quando for escrever os textos), **não** na pasta `learning/` (gitignored).

### Fatia 2 — Documentos do processo (opcional, depois)

1. **Upload** de documento (PDF/imagem) ligado a **estudante** ou **matrícula** (escopo mínimo em `docs/specs/ia/ingestao-documentos.spec.md` quando existir).
2. **Embeddings** em **pgvector** (Postgres) **ou** Qdrant se um ADR justificar segundo serviço.
3. **RAG** sobre o **conteúdo desse processo** (ex.: “há menção a desconto?”) com citação de trecho.
4. **Agente / automação:** **N8N** ou **LangGraph** para pós-upload (extração/embed, notificação, rascunho para revisão humana — §16).

Até manuais + ADR da fatia 1 estarem prontos, a implementação de RAG em produção fica **planeada**, não implícita.

---

## Ordem sugerida (núcleo + vitrine SK)

1. **Núcleo portfolio (já alinhado à vaga):** domínio + Prisma + Nest + Next + Docker (Postgres) + testes de regras + deploy documentado.
2. **Fechar specs finos:** catálogo, finance, API/errors (matriz em `docs/specs/README.md`).
3. **Camada SK (IA/infra):** manuais + chat de ajuda (RAG); ADR pgvector vs Qdrant; depois opcional ingestão de documentos, N8N/LangGraph; Redis só se um fluxo justificar.

Assim os specs **terminam** cobrindo o produto; as decisões SK ficam **explícitas** e auditáveis no repositório.

---

## O que ainda **não** está no `docs/especificacao-stack.md`

Para implementar de fato: atualizar `docs/especificacao-stack.md` e `decisions.md` com ADRs curtos para, no mínimo:

- Extensão Postgres (**pgvector**) ou **Qdrant**
- **N8N** e/ou **LangGraph** (e onde rodam: local Docker vs cloud)
- **Redis** (se adotado)
- **Provedor de deploy** (um caminho documentado basta para “conhecimento”; dois é bônus)

---

## Próximos passos de spec (primeira vez — ordem suave)

Não precisa fechar tudo de uma vez. Uma **sessão** = um **tema pequeno** + regras testáveis (quem faz o quê, o que é erro, o que é bloqueio).

| Ordem | O quê | Onde escrever |
|-------|--------|----------------|
| 1 | **Catálogo:** série (grade), currículo por série/ano, turma — um bloco de cada vez | `docs/specs/catalogo/catalog.spec.md` (já começaste com ano letivo) |
| 2 | **Finance:** estados das parcelas, arredondamento, datas | `docs/specs/financeiro/finance.spec.md` |
| 3 | **API:** formato de erros, listagens, idempotência onde fizer falta | `docs/specs/...` ou `docs/api.spec.md` (quando existir scaffold) |
| 4 | **IA (SK):** chat de ajuda + RAG sobre manuais | `docs/specs/ia/chat-ajuda-rag.spec.md` + `docs/manuals/pt/` + `docs/manuals/en/` |
| 4b | **IA (opcional):** upload → embeddings → RAG em documentos; N8N ou LangGraph | `docs/specs/ia/ingestao-documentos.spec.md` (quando for aí) |
| 5 | **Cenários que justificam Redis, etc.** | Um parágrafo no spec ou um ADR em `decisions.md` (“cache do catálogo porque X”; “rate limit na rota de IA porque Y”) |

Se uma tecnologia da vaga **ainda não tiver** história no produto, inventar um **cenário mínimo** (mesmo simples) é válido — desde que fique **escrito** no spec para não parecer decoração no código.

---

## Checklist rápido antes da entrevista

- [ ] Cada tecnologia da vaga aparece no projeto **ou** em spec/ADR justificando adiamento.
- [ ] Consigo explicar **por que** RAG/agente/Redis estão (ou não) no Nexus.
- [ ] Deploy reproduzível (Docker + um guia de ambiente).
- [ ] Testes cobrem pelo menos **uma** regra crítica de negócio (matrícula, identidade, parcelas ou cancelamento).
