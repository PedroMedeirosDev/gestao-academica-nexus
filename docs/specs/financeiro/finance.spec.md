# Financeiro (planos e parcelas) — spec de área

Estende `docs/student-flow.spec.md` §19, `docs/domain.md` (Payment Plan, Installment) e as operações destrutivas da §16. Complementa `docs/specs/matricula/matricula-campos-edicoes-pos-ativa.spec.md` §2.2 (regeração ao mudar série).

**Idioma:** português (Brasil).

---

## 1. Moeda e valores

- Moeda única: **BRL**.
- Valores monetários persistidos com **duas casas decimais** (centavos).
- **Arredondamento (MVP):** em cada parcela, após aplicar desconto percentual ou fixo sobre o bruto da parcela, arredondar o valor líquido para **2 casas** em **HALF_UP** (meio sempre para cima). **Não** acumular erro em “última parcela” no MVP salvo decisão futura documentada em ADR — se o total fechado for obrigatório, ajustar a última parcela por delta máximo de **R$ 0,02** e documentar na resposta da API (campo opcional `roundingAdjustment`).

---

## 2. Estados da parcela (MVP)

| Estado      | Significado |
|-------------|-------------|
| **OPEN**    | Cobrança válida; aguardando pagamento externo (fora do sistema). |
| **CANCELLED** | Parcela anulada logicamente: cancelamento de matrícula, regeração pós-mudança de série, ou void administrativo. **Não** entra em totais “a receber”. |

**Fora do escopo do MVP:** estado **PAID** com conciliação bancária; usar apenas **OPEN** até existir confirmação manual de pagamento ou integração (fase posterior).

**Transições permitidas no MVP:**

- `OPEN` → `CANCELLED` (cancelamento de matrícula Ativa, regeração, ou ação administrativa equivalente).
- **Proibido:** `CANCELLED` → `OPEN`; criar segunda linha “ativa” duplicada para a mesma competência/ordinal sem passar pela regeração definida no monólito.

---

## 3. Datas e fuso

- **Vencimento:** armazenar como **data civil** (`DATE`), sem hora, no **fuso da escola** (padrão recomendado: `America/Sao_Paulo`) para interpretação de “hoje” e comparações na UI.
- **Geração em lote:** quando a estratégia for “todo dia 08”, cada parcela recebe o **dia 08** do mês correspondente; meses sem dia 31 usam o último dia válido do mês (regra explícita para evitar ambiguidade).

---

## 4. Modelo de pagamento (template)

Requisitos mínimos alinhados ao monólito §19:

- Valor base, tipo e valor de desconto persistidos (`discountType`, `discountValue`), quantidade de parcelas, estratégia de vencimento (única data, parcelado com dia fixo, manual).
- Editar o template **não** altera parcelas já geradas (`student-flow.spec.md` §19 — snapshot na matrícula).

### Associação à série (opcional)

- Pode existir **plano padrão** vinculado a uma **série** (ver `docs/specs/catalogo/catalog.spec.md` §7) para pré-preencher a matrícula em **Reserva**; a secretaria pode trocar antes de **Ativar**.

---

## 5. Snapshot na matrícula

Na primeira geração (**Reserva → Ativa**) e em cada **regeração** após mudança de série/nível (`matricula-campos-edicoes-pos-ativa.spec.md` §2.2), a matrícula deve guardar cópia estável dos campos do plano usados no cálculo (valores, desconto, quantidade, estratégia de datas) para auditoria e relatórios, além das linhas de parcela.

---

## 6. Pré-visualização obrigatória (UI + API)

1. **Antes de Reserva → Ativa:** o sistema deve permitir obter uma **pré-visualização** das parcelas (datas e valores líquidos) sem persistir cobranças; a confirmação da transição exibe o mesmo resumo (§16).
2. **Antes da mudança de série/nível em matrícula Ativa** (regeração): pré-visualização + confirmação destrutiva com contagem de parcelas **OPEN** a cancelar e totais antigos vs novos.

A API pode expor `POST .../preview-installments` (idempotente, sem efeito colateral) ou query equivalente; o contrato detalhado fica em `docs/specs/platform/api.spec.md` quando os endpoints forem nomeados.

---

## 7. Idempotência e concorrência

- **Primeira ativação:** se já existir parcela **OPEN** para a matrícula, **não** duplicar geração (`student-flow.spec.md` §19 idempotency).
- **Regeração:** uma única transação de negócio “cancelar todas as OPEN existentes + gerar novo conjunto”; repetir o mesmo pedido com **Idempotency-Key** (ver spec de API) não deve duplicar lotes.

---

## 8. Cancelamento de matrícula

- **Ativa → Cancelada:** todas as parcelas **OPEN** da matrícula passam a **CANCELLED**; nenhuma permanece OPEN (`student-flow.spec.md` §8 e §19).

---

## 9. Códigos de erro sugeridos (alinhamento com API)

Definir na implementação, no mínimo:

- `FINANCE_PLAN_NOT_FOUND`, `FINANCE_INVALID_DISCOUNT`, `FINANCE_INSTALLMENTS_ALREADY_EXIST`, `FINANCE_REGENERATION_CONFLICT`.

Mapeamento HTTP e envelope em `docs/specs/platform/api.spec.md`.

---

## Fora do escopo (MVP)

Gateway, arquivo de boleto, conciliação bancária, multa/juros automáticos, nota fiscal.
