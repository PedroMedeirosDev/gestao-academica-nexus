# Campos de aluno e responsável (pessoa)

Estende `docs/student-flow.spec.md` §5 e §6. Inspiração: sistema legado (ficha acadêmica); campos **dispensáveis** no MVP estão listados em “Fora do escopo neste spec”.

---

## 1. Idades e jurisdição (maioridade)

**Lei varia por país e, nos EUA, por tipo de ato e estado.** O Nexus **não** embute regra fixa “Brasil = X, EUA = Y” no código sem configuração.

### 1.1 Parâmetros da instituição (MVP)

Configuração por **instância** da aplicação (ou variáveis de ambiente na primeira versão), com **padrão sugerido**:

| Parâmetro | Padrão sugerido | Uso |
|-----------|-----------------|-----|
| `majorityAge` | **18** | Considera o aluno **maior de idade** para efeitos de UI e validações que dependem de maioridade (ex.: certas confirmações sem responsável). |
| `minAgeStudentMaritalStatus` | **18** | **Estado civil** do **aluno** só aparece e só é obrigatório (se visível) quando `idade >= este valor`. |

- A instituição pode definir `minAgeStudentMaritalStatus` **16** se a política interna e a base legal permitirem coletar estado civil abaixo de 18; isso é **decisão da escola**, não suposição do software sobre casamento.
- Documentação de deploy: registrar quais valores foram adotados e **por quê** (auditoria).

### 1.2 Cálculo de idade

- Idade em **anos completos** (e opcionalmente meses na UI) a partir da **data de nascimento** e da **data de referência** do servidor (timezone da instituição — definir no ADR de datas se necessário).

---

## 2. Aluno — “Dados principais” (MVP)

### 2.1 Obrigatórios (cadastro completo / Completed)

- **Nome**
- **Data de nascimento**
- **Sexo** (lista controlada: Feminino, Masculino, Outro, Prefiro não informar — ajustável por i18n)
- **Nacionalidade** (lista + busca, padrão “Brasileira” quando aplicável)
- **Identidade legal** conforme §5 (Track A CPF ou Track B documento oficial)
- **Autorização de uso de imagem** (sim/não ou equivalente já previsto no monólito)

### 2.2 Opcionais (aluno)

- **RG** (ou ID secundário nacional), quando Track A e política da escola exigirem registro junto ao CPF
- **Naturalidade** (cidade/UF ou lista + busca, alinhado ao legado)
- **E-mail** e **telefone** do aluno — **recomendados**; podem ficar vazios para menor se a escola usar só contato dos responsáveis (validação: se aluno ≥ `majorityAge`, recomenda-se **pelo menos um** meio de contato próprio ou declarado)

### 2.3 Condicional (aluno)

- **Estado civil:** campos **só aparecem** se `idade do aluno >= minAgeStudentMaritalStatus`. Se aparecerem e o usuário preencher, valores em lista controlada (ex.: Solteiro(a), Casado(a), …). Se não atingir a idade, **não** exibir o bloco.

### 2.4 Fora do escopo do MVP (aluno — não implementar nas telas principais)

Inspirado no legado; **não** obrigatório no Nexus MVP:

- Tipo sanguíneo, fator RH  
- R.A. (registro acadêmico estadual) — pode entrar em fase futura com integração  
- **Grau de instrução** do **aluno**  
- Upload de **assinatura** (arquivo) para aluno ou responsável  
- “Entrada no país” — opcional futuro para contexto migratório Track B, não MVP obrigatório  
- **Cor/raça** (autodeclaração IBGE): **opcional** no MVP se a escola precisar de relatório oficial; se não precisar, omitir até fase de relatórios  

### 2.5 Observações e saúde

- **Observações do cadastro** (texto livre curto): **opcional**, recomendado limite de caracteres.  
- **Necessidades especiais** (texto ou lista): permanece no **passo Saúde / complementar** opcional (`student-flow` §6 passo 4), não no bloco “dados principais” minimalista.

---

## 3. Responsável (guardian — pessoa)

Mesma ideia de **pessoa** que o aluno: identidade §5, contactos, endereço na **pessoa responsável** (compartilhada entre alunos).

### 3.1 Obrigatórios (para gravar responsável utilizável em matrícula)

- **Nome**
- **Identidade** Track A ou B (§5)
- **E-mail** (formato válido)
- **Telefone** (formato válido — política de máscara/DID no país)
- **Endereço completo** (mesmos campos mínimos que o endereço do aluno: logradouro, número, complemento opcional, bairro, cidade, UF, CEP — integração CEP quando existir)

### 3.2 Obrigatoriedade reforçada do **responsável financeiro**

- Para cada vínculo **Student–Guardian** com **financial responsible = true**, a **pessoa** Guardião DEVE ter:
  - **Endereço completo** válido antes de concluir matrícula ou antes de Ativar matrícula (o que for mais restritivo na implementação)
  - **Profissão** (texto livre curto ou lista controlada — MVP: texto livre com mínimo de caracteres, ex. 2)

Se o mesmo guardião for financeiro de vários alunos, preenche-se **uma vez** na ficha da pessoa.

### 3.3 Opcionais (responsável)

- **Data de nascimento** (recomendada para consistência e validações futuras)
- **Estado civil** (lista) — sempre permitido no MVP para adultos; não depende da idade do **aluno**
- **Grau de instrução** (lista) — **só para responsáveis**, não para aluno
- **Naturalidade**, **nacionalidade** — alinhados ao legado se necessário
- **Falecido** (flag já prevista no monólito)

### 3.4 Fora do escopo (responsável)

- Arquivo de **assinatura**  
- Campos “campo criado pelo cliente” do legado — fora até haver motor de custom fields  

---

## 4. Vínculo aluno–responsável (link)

Mantém o monólito: tipo de parentesco, financeiro para **este** aluno, ordem, fonte de endereço “mora com…” quando aplicável (`docs/specs/enrollment/matricula-campos-edicoes-pos-ativa.spec.md` §4).

---

## 5. Resumo visual (legado → Nexus)

| Legado (exemplo) | Aluno MVP | Responsável MVP |
|------------------|-----------|------------------|
| Tipo sanguíneo / RH | Fora | Fora |
| RA | Fora | — |
| Estado civil (aluno) | Só se idade ≥ config | Sempre opcional |
| Grau instrução | Fora | Sim (opcional) |
| Assinatura arquivo | Fora | Fora |
| E-mail / telefone | Opcional / recomendado | Obrigatório |
| Endereço | Passo endereço; “mora com…” | Obrigatório na pessoa; reforçado se financeiro |
| Profissão | Fora | Obrigatório se financeiro |

---

## 6. i18n

Todos os **rótulos** destes campos entram nos catálogos **pt-BR** e **en**; listas (sexo, estado civil, grau instrução) com chaves estáveis.
