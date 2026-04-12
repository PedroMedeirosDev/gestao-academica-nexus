# Matrícula no Nexus — visão geral para a secretaria

> **Versão do manual:** 0.2 (alinhado a `matricula-campos-edicoes-pos-ativa.spec.md`, `student-flow.spec.md` §7–§8, §19, `docs/specs/financeiro/finance.spec.md`). Ajustar quando a tela real existir.

---

## O que é uma matrícula aqui

É o vínculo do **aluno** com um **ano letivo**, **nível**, **série**, **tipo de matrícula**, **turma** e **status** (Reserva → Ativa ou Cancelada). As disciplinas vêm do **currículo da série**; a turma não muda a lista de disciplinas no MVP.

---

## Estados (resumo)

```
[nova]  →  Reserva
Reserva  →  Ativa     (efetivar: materializa disciplinas e gera parcelas, se houver plano)
Reserva  →  Cancelada (descartar rascunho)
Ativa    →  Cancelada (cancelar matrícula já efetivada; cancela parcelas)
```

**Exemplo (linguagem da secretaria):**  
*“A matrícula da Ana está em **Reserva** — ainda posso mudar série e plano sem gerar cobrança. Quando clicar em **Efetivar**, passa a **Ativa** e aí o sistema gera as parcelas uma vez.”*

---

## Parcelas e efetivação

As **parcelas** (valores e vencimentos) só são **gravadas** quando a matrícula passa de **Reserva** para **Ativa** — não no simples rascunho. Antes de confirmar, a tela deve mostrar uma **pré-visualização** (tabela) das parcelas; depois de Ativa, alterar **só a turma** não mexe nas parcelas; mudar **série** ou **nível** cancela as parcelas antigas e gera outras, de novo com pré-visualização e confirmação forte. Detalhes: `docs/specs/financeiro/finance.spec.md`.

---

## Regra de duplicidade (o que não pode)

O mesmo aluno **não** pode ter duas matrículas **Reserva** ou **Ativas** ao mesmo tempo para o **mesmo** ano + nível + série + tipo.

**Exemplo:**  
*Se já existe Reserva para “2026 / Fundamental / 7º / Regular”, não abre outra igual — ou continua a existente ou cancela antes.*

---

## Depois de Ativa: mudar só turma vs mudar série

| Situação | O que acontece com as parcelas |
|----------|--------------------------------|
| Mesmo ano, mesma série, mesmo tipo — só **troca a turma** | **Mantém** as parcelas. |
| Muda **série** ou **nível** (no mesmo ano) | **Cancela todas** as parcelas dessa matrícula e **gera de novo** (com pré-visualização e confirmação forte). Disciplinas são **rematerializadas** para a nova série. |

**Exemplo (só turma):**  
*“O aluno estava na 7º A e deveria estar na 7º B.”* → Corrige turma; mensalidades continuam iguais.

**Exemplo (série):**  
*“Efetivamos 7º por engano; o correto é 8º.”* → Operação destrutiva: o sistema avisa quantas parcelas serão canceladas e mostra o novo plano antes de confirmar.

---

## Ano letivo diferente (matrícula já Ativa)

**Não** se altera o ano na mesma matrícula Ativa. O caminho é: **cancelar** a matrícula do ano antigo e **criar** outra no ano novo.

---

## Endereço do aluno — “mora com o responsável”

Se marcar que o aluno **usa o endereço de um responsável**, é obrigatório **escolher qual** vínculo (ex.: mãe ou pai) e esse responsável precisa ter **endereço completo** no cadastro.

**Exemplo de mensagem que a tela pode mostrar:**  
*“Complete o endereço da **Mãe — Maria Silva** para continuar.”*

---

## Onde está o detalhe técnico

- Regras completas: specs no repositório (`matricula-campos-edicoes-pos-ativa.spec.md`, `student-flow.spec.md`).

Este manual é **para humanos e para o RAG** — frases curtas e exemplos ajudam o modelo a achar o trecho certo quando alguém pergunta *“o que acontece se eu mudar de turma?”*.
