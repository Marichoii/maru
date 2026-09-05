# Arquitetura do Maru

O projeto está separado em quatro camadas:

- `frontend/`: entrega a experiência do aluno no navegador.
- `backend/`: expõe API HTTP, serve arquivos estáticos e concentra serviços do servidor.
- `shared/`: mantém dados de estudo que precisam ser usados por frontend e backend.
- `data/`: guarda dados locais de desenvolvimento, como progresso do usuário.

## Frontend

O frontend continua sem build obrigatório, mas agora está dividido por camadas:

- `frontend/index.html`: shell HTML, fontes, importmap e raízes do app.
- `frontend/assets/js/app.js`: orquestra estado, rotas internas e dispatch de ações.
- `frontend/assets/js/api.js`: cliente HTTP da API do backend.
- `frontend/assets/js/core/`: helpers compartilhados de UI e animação.
- `frontend/assets/js/features/`: renderizadores de domínio, como a arena de kana.
- `frontend/assets/js/motion-layer.js`: microinterações Motion.dev para hover, press e reveal.
- `frontend/assets/js/react-bits-layer.js`: camada React isolada para efeitos visuais.
- `frontend/assets/css/main.css`: agregador de CSS por `@import`.
- `frontend/assets/css/foundation/`: tokens, reset e base global.
- `frontend/assets/css/components/`: HUD, botões, cards e efeitos React Bits.
- `frontend/assets/css/screens/`: telas de kana grind, prática e suporte.
- `frontend/assets/css/responsive.css`: breakpoints e adaptações mobile.

Essa separação mantém a experiência de kana grind como foco visual e evita que a
SPA volte a depender de um único arquivo gigante de CSS.

## Fluxo de execução

1. `npm run dev` inicia `backend/server.js`.
2. O backend serve `frontend/index.html` em `/`.
3. O frontend carrega `frontend/assets/css/main.css`.
4. O frontend importa `frontend/assets/js/app.js`.
5. `app.js` importa helpers de `core/` e renderizadores de `features/`.
6. `motion-layer.js` aplica microinterações progressivas com Motion.dev.
7. `react-bits-layer.js` monta efeitos visuais em uma raiz React separada.
8. O app importa dados de `shared/content.js`, servido em `/shared/content.js`.
9. Progresso e correção de frases passam pela API em `/api/*`.

## API atual

- `GET /api/health`: confirma que o backend está ativo.
- `GET /api/content`: retorna conteúdo de estudo.
- `GET /api/progress`: retorna progresso persistido.
- `PUT /api/progress`: salva progresso persistido.
- `POST /api/phrase/check`: avalia uma frase escrita pelo aluno.

## Vendor local

O backend serve apenas os bundles necessários:

- `/vendor/animejs/anime.esm.min.js`
- `/vendor/motion/motion.js`
- `/vendor/react/react.production.min.js`
- `/vendor/react-dom/react-dom.production.min.js`

Isso evita depender de CDN em runtime e também evita expor `node_modules` inteiro.

## Persistência

O backend grava progresso em `data/progress/<user>.json`. Por enquanto existe um
usuário local padrão. O header `x-maru-user` já permite separar progresso por
usuário sem mudar os endpoints.

## Próximos cortes naturais

- autenticação real e perfis de aluno;
- banco de dados no lugar de JSON local;
- serviço de correção com IA ou regras gramaticais mais completas;
- testes automatizados de API e interface;
- build frontend com Vite ou framework quando a interface crescer.
