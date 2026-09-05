# Maru

Site full stack para grind de kana com visual arcade/pixel, escrita no canvas,
reconhecimento por quiz, foco em erros, XP, streak e progresso persistido pelo
backend. Frases, guias e revisão JLPT ficam como modos de apoio.

## Como rodar

```bash
npm run dev
```

Abra `http://localhost:5173`.

## Arquitetura

- `frontend/`: interface web, CSS modular, JavaScript do app e efeitos React Bits.
- `backend/`: servidor HTTP, API, persistência e serviços de domínio.
- `shared/`: conteúdo e dados usados por frontend e backend.
- `data/progress/`: progresso local gerado em desenvolvimento.

Detalhes de fluxo e fronteiras estão em `docs/ARCHITECTURE.md`.

## API

- `GET /api/health`: status do backend.
- `GET /api/content`: conteúdo de estudo.
- `GET /api/progress`: progresso salvo.
- `PUT /api/progress`: salva progresso.
- `POST /api/phrase/check`: avalia uma frase enviada pelo aluno.
