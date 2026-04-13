# UI da secretaria — mapa mínimo de fluxos (MVP)

Estende `docs/decisions.md` (stepper na criação do aluno) e `docs/student-flow.spec.md` (entrada §1, formulário §6). **Não** define design visual (cores, fontes); define **navegação**, responsabilidades de tela e alinhamento com a stack (`docs/especificacao-stack.md`).

**Idioma:** português (Brasil).

---

## 1. Princípios

- **Layout responsivo** obrigatório (largura mínima ~320px).
- **i18n:** toda string visível ao usuário via chaves (`docs/politica-de-idiomas.md`).
- **Auto-save** e recuperação de rascunho conforme §16 do monólito.
- **Ações destrutivas:** modal com resumo de impacto (§16).
- **Userbar (contexto global da sessão):** foto do utilizador autenticado; **seletor do ano letivo principal** que define a base operacional (matrículas e fluxos só para o ano selecionado — não misturar outro ano na mesma sessão). **Saudação no layout compacto:** texto **«Bem-vindo, {primeiro nome} {último nome}»**, usando apenas o **primeiro** e o **último** token do nome completo cadastrado (sem nomes intermédios / “apelidos” entre eles). No layout expandido, pode exibir-se o **nome completo** como cadastrado.

---

## 2. Mapa de rotas sugerido (App Router)

Prefixo de locale opcional (`/pt/...`, `/en/...`) conforme política de idiomas; abaixo rotas lógicas:

| Rota lógica | Finalidade |
|-------------|------------|
| `/login` | Autenticação: e-mail/senha ou fluxo definido no ADR; redireciona para o hub após sucesso. **Todas** as rotas da secretaria abaixo exigem sessão válida (`student-flow.spec.md` §18). |
| `/` ou `/inicio` | Hub: atalhos para busca de aluno, catálogo, lista de matrículas do dia (MVP pode ser só busca). |
| `/alunos` | Busca §2 + resultado; entrada para novo rascunho. |
| `/alunos/novo` | Fluxo **stepper** de criação (§6): dados pessoais → responsáveis → endereço → (saúde opcional) → (documentos opcional). |
| `/alunos/[id]` | Ficha do aluno: resumo, edição, lista de matrículas, ação “Nova matrícula”; **foto do aluno** editável pela secretaria quando existir fluxo de upload (opcional, não bloqueia cadastro). |
| `/alunos/[id]/matriculas/nova` | Wizard ou página única com seções: ano, nível, série, tipo, turma, plano, pré-visualização de disciplinas e parcelas → botões Reserva / Efetivar conforme estado. |
| `/alunos/[id]/matriculas/[enrollmentId]` | Detalhe/edição da matrícula respeitando status e regras pós-Ativa (`matricula-campos-edicoes-pos-ativa.spec.md`). |
| `/catalogo` | Submenu ou tabs: Anos → Níveis → Séries (por ano) → Disciplinas → Currículos → Turmas (conforme `catalog.spec.md`). |
| `/ajuda` ou painel lateral | Chat de ajuda RAG (`docs/specs/ia/chat-ajuda-rag.spec.md`). |

Rotas exatas (`app/(secretaria)/...`) ficam a cargo do implementador; este mapa é a **referência de produto** para não perder jornadas.

---

## 3. Busca de aluno (§1–§2)

- **Um** campo de busca; resultados paginados; estado vazio e erro de rede com feedback (toast ou inline) alinhado às regras globais do projeto.

---

## 4. Matrícula — UI obrigatória

- Indicador claro de **status** (Reserva / Ativa / Cancelada).
- **Pré-visualização** de disciplinas em Reserva (read-only a partir do currículo).
- **Pré-visualização** de parcelas antes de **Efetivar** (conforme `finance.spec.md` §6).
- Confirmação destrutiva para: cancelar matrícula, mudança de série com regeração, exclusões de catálogo quando aplicável.

---

## 5. Catálogo — UI

- Fluxo guiado: criar ano antes de série; criar série antes de turma; currículo com ordenação por arrastar-soltar ou campo ordem.
- Mensagens de **bloqueio** de exclusão alinhadas aos tipos definidos em `catalog.spec.md`.

---

## 6. Fora do escopo deste documento

Design system detalhado, componentes de biblioteca, testes E2E (podem referenciar este mapa em `docs/specs/README.md` fase 4).
