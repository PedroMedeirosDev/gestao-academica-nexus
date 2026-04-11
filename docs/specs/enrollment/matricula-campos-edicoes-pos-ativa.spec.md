# Matrícula — campos, edição após Ativa e endereço “mora com os pais”

Estende `docs/student-flow.spec.md` §6 (passo Endereço), §7, §8, §10, §15 e §19. Onde este arquivo for **mais específico** em regra de produto, prevalece até o monólito ser atualizado para espelhar a mesma regra.

**Idioma:** português (Brasil), alinhado à linguagem da secretaria.

---

## 1. Campos da matrícula (visão única para UI e API)

Cada **matrícula** (enrollment), além do vínculo com o **aluno**, deve expor no mínimo:

| Campo / conceito | Obrigatório | Notas |
|-------------------|-------------|--------|
| **Ano letivo** | Sim | Inteiro, regras em `catalog.spec.md` |
| **Nível de ensino** | Sim | Alinhado ao catálogo e à matrícula |
| **Série** | Sim | Define currículo base (Grade Curriculum) |
| **Tipo de matrícula** | Sim | Enum já usado nas regras de duplicidade (§10) |
| **Status** | Sim | Reserva, Ativa ou Cancelada (§8) |
| **Turma (regular)** | Sim antes de Ativar | Exatamente uma turma da mesma série/ano (§13) |
| **Resultado acadêmico** | Sim no modelo | MVP: só “Em andamento” (§9) |
| **Referência ao plano de pagamento** | Conforme financeiro | Em **Reserva:** pode apontar para modelo editável; ao **Ativar:** **snapshot** nas parcelas (§19) |
| **Disciplinas materializadas** | Após Ativa | Lista = Grade Curriculum da série/ano na ativação; alteração de série exige rematerialização (§2.2) |

Campos **fora** do MVP neste documento: mudança de **ano letivo** em matrícula já Ativa (ver §2.3).

---

## 2. Editar matrícula depois de **Ativa**

Permanece **proibido** no MVP: **Ativa → Reserva** ou qualquer saída de **Cancelada** (§8). O status **Ativa** não “volta” para rascunho.

Porém, com matrícula **Ativa**, a secretaria pode **corrigir dados** da mesma matrícula quando as regras abaixo forem respeitadas.

### 2.1 Só mudança de **turma** (mesmo ano, mesma série, mesmo tipo)

- **Turma** é atualizada.
- **Disciplinas** permanecem as da mesma série (currículo igual).
- **Parcelas:** **mantidas** — não cancelar nem regerar; valores e datas já gerados continuam válidos.
- Confirmação: **não** precisa ser fluxo destrutivo pesado; confirmação simples de “alterar turma” basta (§16 aplica-se se a política interna considerar destrutivo; no mínimo, uma confirmação explícita recomendada).

### 2.2 Mudança de **série** e/ou **nível de ensino** (ainda no **mesmo** ano letivo)

- **Currículo** passa a ser o da **nova** série: o sistema **rematerializa** as disciplinas da matrícula conforme a Grade Curriculum da nova combinação ano + série (+ nível, se o modelo separar).
- **Parcelas:** **cancelar todas** as parcelas existentes dessa matrícula (estado lógico cancelado / void, como em cancelamento de matrícula — §8) e **gerar de novo** o conjunto de parcelas:
  - **Preço padrão:** a partir do **modelo de pagamento** associado à **nova série** (quando o produto tiver plano “padrão por série”), **ou**
  - **Valor manual:** a secretaria define na mesma operação valores / plano efetivo usados no **novo snapshot** (pré-visualização obrigatória antes de confirmar).
- **Confirmação destrutiva (§16):** obrigatória — resumo do impacto: quantidade de parcelas canceladas, valor total antigo vs novo (se aplicável), nova série.
- **Idempotência:** a operação “trocar série + regerar parcelas” é **uma** transação de negócio; não duplicar parcelas se o usuário repetir o pedido (mesmo padrão §19).

### 2.3 Mudança de **ano letivo** com matrícula já Ativa

- **Fora do escopo** deste complemento: não alterar o ano letivo na mesma linha de matrícula Ativa. Fluxo esperado: **cancelar** a matrícula do ano A (com efeitos §8) e **criar** nova matrícula no ano B, se a secretaria precisar “mover” o aluno de ano — evita ambiguidade de histórico financeiro e de turma.

### 2.4 Duplicidade (§10)

- Depois de qualquer edição, a matrícula **não** pode ficar em conflito com outra **Reserva** ou **Ativa** do mesmo aluno para o mesmo **ano + nível + série + tipo**.

---

## 3. Cadastro do aluno — “só o básico” e endereço

Os **dados pessoais** e a **identidade** (§5–§6 passo 1) e os **responsáveis** com regras atuais (mínimo um vínculo, um financeiro para menor — §6 passo 2) **permanecem** obrigatórios onde o monólito já exige.

**Saúde** e **documentos** (passos 4 e 5) continuam **opcionais** no MVP, salvo decisão futura de escopo — este documento **não** remove esses passos; apenas reforça que o **mínimo** para concluir cadastro utilizável na matrícula é: identificação + responsáveis + **endereço** com as regras da §4.

---

## 4. Endereço do aluno — opção **“Mora com os pais”** (ou equivalente)

### 4.1 Comportamento da UI

- No passo de **endereço do aluno** (§6 passo 3), existe uma opção explícita, ex.: **“Mora com os pais / responsável — usar endereço do responsável”** (rótulo final afinável com UX).
- Com a opção **ligada:** os campos de endereço do aluno ficam **travados** (somente leitura ou desativados) e **não** podem ser preenchidos manualmente até existir endereço utilizável na fonte (§4.2).
- Com a opção **desligada:** comportamento atual: preenchimento normal (incl. CEP quando existir integração).

### 4.2 **Qual** responsável fornece o endereço

- É **obrigatório** escolher **exatamente um** vínculo **Aluno–Responsável** (entre os já associados ao aluno) que será a **fonte do endereço**.
- Recomendação de produto: mostrar só vínculos com tipo de parentesco **Pai** ou **Mãe** quando existirem; se não houver nenhum, permitir **qualquer** responsável já vinculado (evita beco sem saída).
- O **Guardian** (pessoa) escolhido deve ter **endereço completo** válido (regras mínimas: logradouro, número, cidade, UF, CEP conforme política do sistema). Enquanto faltar: o passo de endereço do aluno **não conclui** e a UI indica **qual** responsável completar.

### 4.3 Persistência (duas estratégias aceites no MVP — escolher uma na implementação)

- **A — Cópia:** ao gravar, copia-se o endereço do responsável para os campos do aluno (e desliga-se edição enquanto a opção estiver ativa), **ou**
- **B — Referência:** guarda-se o id do vínculo `Student–Guardian` escolhido como fonte; a UI mostra o endereço do responsável em tempo real.

Em **ambos** os casos, se a opção “mora com…” for **desligada** depois, os campos do aluno voltam a editáveis e podem ficar vazios ou com o último valor copiado — documentar na implementação com confirmação se houver risco de perda de dados.

### 4.4 “Mora com os dois” no mesmo endereço

- Basta **um** vínculo fonte se pai e mãe partilharem morada; se moradas forem diferentes, a secretaria escolhe **com qual** o aluno fica para efeito de cadastro escolar (caso real típico).

---

## 5. Complementos recomendados (não bloqueantes)

- **Histórico:** registar evento de “série alterada em matrícula Ativa” e “turma alterada” para auditoria (Occurrence ou log equivalente — `domain.md`).
- **Pré-visualização** de parcelas **antes** de confirmar mudança de série (já citado em §2.2).
- **API:** códigos de erro distintos para violação de duplicidade, série sem plano padrão, responsável sem endereço.

---

## Relacionamento com decisões

Ver `docs/decisions.md` — ADR **Post-active enrollment edits** e **Student address from guardian**.
