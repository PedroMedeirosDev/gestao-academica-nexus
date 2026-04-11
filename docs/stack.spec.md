# Stack & tooling (authoritative)

Este documento fixa as **tecnologias acordadas** para implementação. Conversas no editor **não** substituem o repositório: em caso de divergência, **este arquivo e `decisions.md` vencem** até serem atualizados por commit.

---

## Linguagem e runtime

- **TypeScript** em todo o código de aplicação (API e UI).
- **Node.js** LTS como runtime do backend e das ferramentas de build do frontend.

---

## Persistência

- **PostgreSQL** como banco relacional único no MVP.
- **Prisma** como ORM e fonte do schema migrável (`schema.prisma` + migrations).

**Regra:** o modelo de dados deve refletir `docs/domain.md` e as regras em `docs/student-flow.spec.md`; divergências são bug de modelo ou de spec, não “detalhe de implementação” silencioso.

---

## API (backend)

- **NestJS** para a camada HTTP/API (módulos, injeção de dependência, validação, testes alinhados ao ecossistema Node).

**Fora do escopo imediato da stack (podem entrar depois com ADR):** mensageria, cache obrigatório, filas — só quando um fluxo real exigir.

---

## UI (frontend)

- **Next.js** (App Router) para a interface da secretaria, em TypeScript.
- **Tailwind CSS** para estilo: **utility-first**; evitar arquivos `.css` próprios ao máximo (exceção pontual: reset mínimo ou variáveis globais num único arquivo se a equipe decidir — documentar no README do pacote `web`).
- **Layout responsivo obrigatório:** a secretaria deve conseguir usar o sistema em **telefone** (largura mínima alvo **320px**), além de tablet e desktop — grids fluidos, navegação acessível com toque, modais e tabelas com rolagem/empilhamento em `sm`/`md` (breakpoints Tailwind). Não assumir apenas monitor largo.
- **i18n obrigatório:** `pt-BR` (padrão) e `en` no produto; todas as strings visíveis via catálogo de tradução (sem texto solto no JSX para o usuário final). Detalhes e layout com textos de tamanhos diferentes: `docs/language-policy.md` (seção “Layout e tamanho dos textos”).

**Ordem sugerida de entrega:** domínio + Prisma estável → API Nest → telas Next consumindo a API.

---

## Infra local e reprodutibilidade

- **Docker Compose** (ou equivalente) para subir **PostgreSQL** em desenvolvimento com o mesmo major/minor preferencialmente alinhado ao ambiente de deploy futuro.

Variáveis sensíveis via `.env` (nunca commitadas); exemplo documentado em `.env.example` quando o scaffold existir.

---

## Testes e qualidade

- Testes automatizados para **regras de domínio** críticas (matrícula, identidade, parcelas, cancelamentos) — framework exato (Jest/Vitest no Nest, etc.) definido no repositório quando o scaffold for criado.
- **ESLint** + **Prettier** no monorepo ou nos pacotes `api` / `web`, conforme estrutura escolhida.

---

## Opcional / fases posteriores

- **Redis**, **pgvector**, pipelines de documento/RAG: apenas se atrelados a feature explícita (ver `docs/README.md` — non-goals até lá).

---

## Histórico de decisão

A escolha **NestJS + Prisma + PostgreSQL** substitui a formulação provisória “Nest **ou** FastAPI” em `decisions.md` (seção *Backend and tooling*). Qualquer mudança de stack exige **atualizar este arquivo** e um trecho curto em `decisions.md` (ADR).
