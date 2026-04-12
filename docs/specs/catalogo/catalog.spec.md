# Catálogo acadêmico — spec de área

Estende `docs/student-flow.spec.md` §17 e `docs/domain.md`. **Não** revoga o monólito; em conflito, alinhar ambos por commit. Ações destrutivas seguem §16 do `student-flow.spec.md`.

**Idioma:** português (Brasil).

---

## Visão geral do modelo (MVP)

Ordem lógica de dependência para a secretaria montar o ano:

1. **Ano letivo** (inteiro calendário, ex.: 2026).
2. **Nível de ensino** (ex.: Ensino Fundamental I) — cadastro **institucional**, reutilizável em vários anos.
3. **Série** (código da matrícula: ano + nível + identificação da série, ex.: “7º ano” no Fundamental II) — pertence a **um** ano letivo e **um** nível.
4. **Disciplinas** (catálogo mestre de matérias da escola).
5. **Currículo da série** — quais disciplinas entram naquela série **naquele** ano, com **ordem** de exibição.
6. **Turma (regular)** — subdivisão da série no ano (ex.: 7º A, 7º B).

**Regra transversal:** matrícula **Ativa** já materializou disciplinas a partir do currículo **na ativação**; alterar o currículo **depois** **não** reescreve automaticamente a lista materializada de matrículas Ativas (ver §7 do monólito e `matricula-campos-edicoes-pos-ativa.spec.md`). Alterações passam a valer para **novas** Reservas e para **pré-visualização** em Reserva existente.

---

## 1. Ano letivo

### Propósito

Identifica o ano operacional da escola (ex.: 2026). **Escopoa** séries, currículos e turmas: nada fica “solto” sem ano.

### Dados

- **Ano** — inteiro calendário (ex.: `2026`). Identificador de negócio e o que aparece em listas e filtros (sem rótulo livre separado no MVP).

### Regras

1. **Faixa:** o ano deve estar entre **1990** e **2100** (inclusivo). Fora da faixa → erro de validação antes de persistir.
2. **Unicidade:** não podem existir dois anos letivos com o mesmo valor de **ano**.
3. **Criar:** permitido se valor na faixa e único; retornar o registro criado e exibir na lista do catálogo.
4. **Editar o valor do ano:** permitido **somente** se o novo valor estiver na faixa, for único e **não** existir **nenhuma** dependência: série, linha de currículo da série, turma, matrícula ou plano de pagamento (se o modelo amarrar plano ao ano). Se já existir dependência, **bloquear** edição (mensagem clara). Se **não** houver dependentes, correção de digitação é permitida **sem** mudar o `id` interno (FKs permanecem válidas).
5. **Excluir:** permitido **somente** se **não** houver série, currículo, turma, matrícula nem plano referenciando esse ano. Caso contrário, **bloquear** e informar o **tipo** de bloqueio (ex.: “Existem matrículas neste ano”, “Existem séries cadastradas”).
6. **Confirmação de exclusão:** quando permitida, o diálogo deixa claro que o ano está vazio de dependentes; ao confirmar, remoção permanente (hard delete desta entidade no MVP).

### UI / API (MVP)

- Listar anos ordenados por **ano** decrescente (mais recente primeiro).
- Estado vazio: mensagem orientando criar o primeiro ano antes de definir séries.

### Fora do escopo (MVP)

Intervalos de datas legais de aulas, múltiplas unidades, clonagem completa de um ano para outro.

---

## 2. Nível de ensino

### Propósito

Agrupa políticas pedagógicas comuns (ex.: Ensino Fundamental I, Ensino Fundamental II, Ensino Médio). A **matrícula** usa o par **nível + série** na regra de duplicidade (`student-flow.spec.md` §10).

### Dados (mínimo)

- **Código estável** — slug curto para API e i18n de chaves derivadas (ex.: `FUND_2`, `MEDIO`), único na instituição.
- **Nome** — texto exibido à secretaria (ex.: “Ensino Fundamental II”).
- **Ordem** — inteiro para ordenar dropdowns (menor = aparece primeiro).

### Regras

1. **Unicidade** do `codigo` na instituição (MVP escola única = global no banco).
2. **Criar / editar:** permitido livremente enquanto não violar unicidade do código.
3. **Excluir:** **bloqueado** se existir **série** (em qualquer ano) referenciando esse nível. Mensagem: indicar quantas séries ou listar anos afetados (implementação escolhe granularidade).
4. **Sem vínculo com ano letivo:** o nível é reutilizado em vários anos; a combinação **ano + nível + rótulo da série** é que é anual.

### Fora do escopo (MVP)

Níveis diferentes por rede de franquias, campos BNCC obrigatórios.

---

## 3. Série (Grade / cohort)

### Propósito

Representa o “ano” da progressão dentro do nível (ex.: 6º ano, 7º ano) **em um ano letivo específico**. É o alvo da matrícula para currículo e turmas.

### Dados (mínimo)

- Referência ao **ano letivo**.
- Referência ao **nível de ensino**.
- **Rótulo** — texto exibido (ex.: “7º ano”, “1ª série”).
- **Ordem** opcional — para ordenação dentro do nível no mesmo ano.

### Regras

1. **Unicidade:** não podem existir duas séries com o mesmo **ano letivo + nível + rótulo** (normalização: trim, colapsar espaços internos antes de comparar).
2. **Criar:** exige ano e nível existentes; validar unicidade.
3. **Editar rótulo:** permitido se mantiver unicidade (ano + nível + rótulo).
4. **Mover série para outro nível ou ano:** tratado como **operação rara** no MVP — se a implementação permitir, deve **bloquear** quando existir matrícula **Reserva** ou **Ativa** para essa série; caso contrário, risco de violar duplicidade e confusão financeira. Se não houver matrícula, permitir ajuste de FKs com validações.
5. **Excluir:** **bloqueado** se existir **turma**, **linha de currículo da série** (disciplina vinculada), ou **matrícula** (qualquer status) referenciando a série. Mensagem por tipo de bloqueio.
6. **Confirmação:** exclusão, quando permitida, segue §16 (resumo do que será removido — normalmente só metadados se o catálogo estava vazio de turmas/matrículas).

### Relação com matrícula

A matrícula aponta para esta entidade (série) e herda o currículo da combinação **ano + série** conforme §7 do monólito.

---

## 4. Disciplina (catálogo mestre)

### Propósito

Matéria ofertada pela escola (ex.: “Matemática”, “Ciências”), reutilizável em vários currículos.

### Dados (mínimo)

- **Nome** (obrigatório).
- **Sigla ou código** opcional para relatórios.

### Regras

1. **Unicidade fraca no MVP:** duas disciplinas com o mesmo nome são **desencorajadas**; a UI deve alertar. Se a implementação permitir homônimos, diferenciar por `id` nas linhas de currículo.
2. **Excluir disciplina:** **bloqueado** se a disciplina constar de **qualquer currículo da série** em **qualquer** ano. Remover primeiro do currículo de todas as séries onde aparece (ou inativar disciplina numa fase futura — fora do MVP).

---

## 5. Currículo da série (disciplinas por ano + série)

### Propósito

Define a lista ordenada de disciplinas daquela série naquele ano letivo. É a **fonte** da pré-visualização em Reserva e da materialização em Ativa (`student-flow.spec.md` §7).

### Dados

- Referência à **série** (portanto, ano + nível implícitos).
- Referência à **disciplina**.
- **Ordem** — inteiro ≥ 1, único **por série** (sem duplicar ordem na mesma série).

### Regras

1. **Adicionar disciplina ao currículo:** permitido a qualquer momento. Matrículas **Ativas** **não** são reescritas automaticamente (lista já materializada).
2. **Remover disciplina do currículo:** permitido se **não** existir matrícula **Ativa** para essa série cujo snapshot inclua essa disciplina **ou** se a política de produto for “remover só disciplinas não usadas em Ativas” — **MVP simples:** permitir remoção **se não houver matrícula Ativa** para essa série; se houver Ativa, **bloquear** remoção dessa linha de currículo e orientar: concluir/cancelar matrículas ou aceitar fase futura de “descontinuar disciplina”. **Alternativa aceite no MVP:** permitir remoção sempre, mantendo disciplinas já materializadas em Ativas como **histórico órfão** referenciando `disciplinaId` — exige lista de “disciplinas descontinuadas” na UI da matrícula; para reduzir escopo, **preferir bloqueio** quando existir Ativa.
3. **Reordenar:** permitido; não altera snapshots de Ativa; atualiza pré-visualização de Reserva.
4. **Currículo vazio:** série **não** deve ser usada para **Ativar** matrícula até ter pelo menos **uma** disciplina (validação na transição Reserva → Ativa ou ao salvar matrícula em Reserva com “completo” — produto escolhe o momento exato da validação, mas a regra de negócio é: **Ativa exige currículo não vazio**).

### Confirmação

Remoção em massa ou troca que afete muitas Reservas pode usar confirmação §16 se o produto classificar como destrutivo para rascunhos em lote.

---

## 6. Turma (regular)

### Propósito

Subdivisão da série para enturmação (ex.: 7º A). **Uma** turma por matrícula no MVP (`student-flow.spec.md` §13).

### Dados (mínimo)

- Referência à **série** (logo: ano + nível + rótulo da série).
- **Nome ou código** legível (ex.: “A”, “B”, “7º A”) — único **dentro da mesma série** (mesmo ano + nível + rótulo de série).

### Regras

1. **Unicidade:** `(sérieId, nomeNormalizado)` único.
2. **Criar / editar nome:** permitido se respeitar unicidade.
3. **Excluir:** **bloqueado** se existir matrícula **Reserva** ou **Ativa** apontando para essa turma. Se só Canceladas referenciarem historicamente, definir na implementação: **bloquear** (recomendado, auditoria) **ou** permitir exclusão com confirmação §16 e **nulificar** FK nas matrículas canceladas — **MVP recomendado:** **bloquear** exclusão se existir **qualquer** matrícula (incl. cancelada) para não perder rótulo histórico; alternativa documentada em ADR se a escola exigir hard delete de turma errada sem matrícula.

### Fora do escopo (MVP)

Turmas de dependência, optativas, segunda turma por matrícula.

---

## 7. Plano de pagamento e série (opcional no modelo de dados)

Quando existir “**modelo de pagamento padrão por série**” (`matricula-campos-edicoes-pos-ativa.spec.md` §2.2), o catálogo ou o módulo financeiro pode manter uma **associação opcional** entre **série** (ano + nível + rótulo) e **plano de pagamento** modelo. Detalhes de cálculo em `docs/specs/financeiro/finance.spec.md` e §19 do monólito.

---

## 8. API / UI transversal (MVP)

- Operações de escrita retornam erro de **conflito** (código estável tipo `CATALOG_DEPENDENCY`) quando regras de bloqueio acima falharem.
- Listagens de séries filtráveis por **ano** e **nível**.
- Turmas agrupadas por série na UI de catálogo.

---

## Relacionamentos com outros docs

- Matrícula e pós-Ativa: `docs/specs/matricula/matricula-campos-edicoes-pos-ativa.spec.md`
- Parcelas e gatilhos: `docs/student-flow.spec.md` §19 + `docs/specs/financeiro/finance.spec.md`
- Contrato HTTP: `docs/specs/platform/api.spec.md`
- Uso de matriz oficial SEE/MG 2026 como base de dados iniciais: `docs/specs/catalogo/referencia-matriz-seemg-2026.md`
