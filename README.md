# Gestão Acadêmica Nexus

Academic management system for school secretariat workflows (catalog, students, guardians, enrollment, installments). **Specs and domain rules** are developed in this repository before implementation.

## For international readers (English)

- **English documentation index** and glossary: [`docs/en/README.md`](docs/en/README.md)
- **Full docs hub** (scope, stack, language policy): [`docs/README.md`](docs/README.md)

Behavioral specifications are **canonical in Brazilian Portuguese** where noted; English summaries and UI copy follow the [language policy](docs/politica-de-idiomas.md).

## Stack (high level)

TypeScript, Next.js, NestJS, PostgreSQL, Prisma, Docker — see [`docs/especificacao-stack.md`](docs/especificacao-stack.md).

## Monorepo (pastas)

- **`apps/api`** — Nest (API + JWT). Ver [`apps/api/README.md`](apps/api/README.md).
- **`apps/web`** — Next (UI secretaria). Ver [`apps/web/README.md`](apps/web/README.md).
- **`prisma/`** — schema e migrations na raiz (uma fonte de verdade para o banco).

Guia em português (inclui explicação do “primeiro recurso”): [`docs/monorepo-estrutura.md`](docs/monorepo-estrutura.md).


## IA (Cursor): regras globais vs. regras deste repositório

**Regras globais** não ficam no Git: você cola o modelo abaixo em **Cursor → Settings → Rules for AI** (ou “Project Rules” globais do usuário, conforme sua versão do Cursor), e elas valem em **qualquer** workspace.

**Regras só deste projeto** ficam versionadas em [`.cursor/rules/`](.cursor/rules/) (arquivos `.mdc`) e o Cursor aplica quando este repositório está aberto. Lá já está definido, entre outras coisas, que o assistente **deve responder em português do Brasil** neste workspace.

### Bloco sugerido para colar em “Rules for AI” (portfólio / global)

Copie, adapte e remova itens que não forem verdade para um repo específico (ex.: i18n só onde o produto exige).

```markdown
## Manifesto de engenharia (global)

### Idioma do assistente (opcional aqui)
- Se quiser **todas** as conversas do Cursor em pt-BR em qualquer pasta, inclua: "Responda sempre em português do Brasil (pt-BR), salvo pedido explícito em outro idioma."
- Se **não** quiser isso globalmente, omita o item acima e use apenas as regras em `.cursor/rules/` por repositório (como neste Nexus).

### Confirmação e segurança
- Não implementar exclusões (DELETE) nem alterações críticas/irreversíveis na UI sem fluxo de confirmação (modal, double-check ou equivalente).
- Não logar nem ecoar dados sensíveis (CPF, senhas, tokens); segredos só em variáveis de ambiente, nunca commitados.

### TypeScript e qualidade
- Preferir TypeScript com tipagem estrita; evitar `any` em código novo; justificar exceções pontuais.

### Erros e resiliência
- Tratar falhas de rede e 5xx nas fronteiras (cliente HTTP, handlers); expor estado de erro na UI (toast, alerta inline ou boundary), especialmente em envios e fluxos longos.

### Internacionalização (quando o projeto tiver i18n)
- Não fixar strings de interface diretamente nos componentes para o usuário final; usar chaves e manter catálogos (ex.: pt-BR + en) alinhados.

### Acessibilidade
- Elementos interativos com nome acessível; navegação por teclado com foco visível.

### Especificidade
- Em caso de dúvida, seguir as regras versionadas no repositório aberto (README, `docs/`, `.cursor/rules/`) em vez de inventar convenções só no chat.

### Organização do código (portfólio)
- Preferir **pastas por domínio/feature** (ex.: `academic-years/`, `students/`), não pastas gigantes só por camada (`controllers/`, `services/` na raiz). No Nest, dentro de cada domínio: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`. No Next, rotas agrupadas por área de produto.
```

## License

*(Add a license when you are ready — e.g. MIT or proprietary.)*
