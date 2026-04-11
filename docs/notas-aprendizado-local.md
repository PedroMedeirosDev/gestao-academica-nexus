# Pasta `learning/` (local, fora do Git)

Na **raiz do repositório** existe a pasta **`learning/`**, listada no **`.gitignore`**.

## Para que serve

- Anotações pessoais, prints, PDFs de cursos, experimentos soltos, rascunhos que **não** precisam aparecer no portfolio nem para o time.
- Mantém o histórico do Git **focado** em código e em `docs/` (specs, decisões, manuais do produto).

## O que **não** substitui

- **Specs** (`docs/specs/`, `student-flow.spec.md`, etc.) e **ADRs** (`decisions.md`) continuam no Git: são a fonte de verdade do comportamento do Nexus.
- O **corpus** do chat de ajuda com RAG (manuais da secretaria) deve viver em arquivos **versionados** (por exemplo `docs/manuals/pt/` e `docs/manuals/en/`; ver `docs/manuals/leiame.md`) ou em outro processo de deploy documentado — assim o portfolio e a demo são reproduzíveis. A pasta `learning/` é só para o teu caminho de estudo.

## Como usar

1. Cria a pasta `learning/` na raiz do clone (se ainda não existir).
2. Coloca lá o que quiseres; o Git ignora tudo dentro dela.
