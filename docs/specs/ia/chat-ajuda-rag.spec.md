# Chat de ajuda da secretaria (RAG sobre manuais)

**Status:** decisão de produto — chat de ajuda com RAG (uso concreto). Complementa `docs/objetivos-tecnicos-portfolio.md`. Destrutivo não aplica aqui; respostas não substituem confirmações da §16 do `student-flow.spec.md`.

---

## Objetivo

Oferecer um **chat de ajuda** na UI da secretaria em que a usuária faz perguntas em linguagem natural sobre **como usar o Nexus** (ex.: “Como faço uma matrícula?”, “O que é reserva?”). As respostas são geradas com **RAG** sobre um **conjunto pequeno de manuais** (Markdown ou texto) derivados do próprio escopo do MVP — fáceis de manter porque o produto tem poucas funções.

## Corpus (fonte do RAG)

- Conteúdo **estável e versionado** no repositório: `docs/manuals/pt/` e `docs/manuals/en/` (um **arquivo** por tema em cada idioma: catálogo, alunos, matrícula, financeiro — ver `docs/manuals/leiame.md`).
- **Proibido** depender apenas de arquivos dentro de `learning/` (essa pasta é **gitignored** e não faz parte do clone para terceiros).

## Comportamento (MVP)

1. A usuária abre o painel de ajuda (ex.: ícone “?” ou “Ajuda”).
2. Pergunta livre num campo de chat.
3. O backend **recupera** trechos relevantes dos manuais (embeddings + pgvector ou alternativa definida no ADR), **monta o contexto** e chama o LLM.
4. A resposta deve:
   - ser **coerente** com os trechos recuperados;
   - quando possível, **indicar** de qual manual/título veio a orientação (citação resumida ou “Ver: Manual de matrícula, secção …”).
5. Se **não** houver trechos com confiança mínima: resposta fixa do tipo “Não encontrei isto nos manuais; consulta o manual X ou fala com o suporte” — **sem inventar** passos de produto.

## Limites explícitos

- O chat **não** executa ações nem altera dados; só **orienta**.
- Perguntas fora do domínio do Nexus (geralidades, outras apps): recusar educadamente ou mesma mensagem de “não encontrei nos manuais”.
- **Rate limiting** e custos de API: definir no ADR ou no spec de API quando existir (opcional Redis — ver `docs/objetivos-tecnicos-portfolio.md`).

## Relação com outra fatia IA (documentos do aluno)

- **Este spec:** ajuda ao **uso do sistema** (manuais).
- **Futuro `ingestion.spec.md` (se existir):** RAG ou extração sobre **documentos anexados** a aluno/matricula. Podem coexistir com **índices/collections** distintos.

## Entregáveis antes de implementar

- [x] Manuais mínimos **iniciados** em `docs/manuals/pt/` e `docs/manuals/en/` (`matricula-visao-geral.md`, `enrollment-overview.md`). Expandir com catálogo, aluno, financeiro quando os specs estiverem prontos.  
- [ ] Smoke de layout **mobile** (320px) nas telas que expõem o chat (ver `docs/especificacao-stack.md`).
- [ ] ADR: provedor de embeddings/LLM, pgvector vs Qdrant, retenção de logs.
- [ ] Testes manuais ou automáticos com perguntas canón (“como matricular”, “cancelar matrícula”) com respostas esperadas aproximadas.
