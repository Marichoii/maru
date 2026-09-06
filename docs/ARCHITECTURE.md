# Arquitetura do Maru

O produto começa com uma trilha para quem ainda não conhece japonês. Conteúdo
didático, regras de aprendizado, infraestrutura e interface são separados.
JavaScript nativo e CSS dão conta da aplicação sem build obrigatório.

## Fronteiras

| Camada | Responsabilidade |
| --- | --- |
| `shared/lessons/` | Texto das lições, exemplos, objetivos e perguntas. |
| `shared/curriculum.js` | Ordem das oito etapas, índice de lições e referências. |
| `shared/catalog.js` | Combinações, kanji iniciais, partículas, expressões e frases. |
| `shared/vocabulary.js`, `glossary.js`, `exercises.js` | Vocabulário inicial, conceitos e perguntas por tipo. |
| `shared/pronunciation.js` | Texto e leitura correta das pronúncias aceitas pela API. |
| `shared/gamification.js` | Níveis, missões e conquistas derivados do progresso. |
| `shared/content.js` | Kana básicos e acervo complementar preservado. |
| `shared/progress.js` | Normalização, migração, mesclagem, XP, constância e revisão. |
| `shared/sentenceCheck.js` | Verificação de exercícios conhecidos, reutilizada offline. |
| `shared/romaji.js` | Leitura de kana e comparação em diferentes grafias. |
| `backend/` | HTTP, rotas, arquivos estáticos e persistência. |
| `frontend/assets/js/core/` | Estado persistido, áudio, ícones e helpers de UI. |
| `frontend/assets/js/features/` | Telas e controladores de cada atividade. |
| `frontend/assets/css/` | Sistema visual, layout, componentes e responsividade. |

Conteúdo e domínio compartilhados não dependem de DOM nem do servidor. As telas
chamam as regras de domínio sem reimplementar XP, migração ou revisão.

## Inicialização e navegação

1. O backend cria o servidor e inicia a escuta quando executado diretamente.
2. `staticFiles.js` serve apenas frontend e shared, com validação de caminhos.
3. O HTML carrega o agregador de CSS e o módulo `app.js`.
4. O store lê o estado local, migra dados antigos e mescla o snapshot do servidor.
5. O app monta o shell e escolhe a tela pela URL, como `#/lesson/welcome`.
6. Cada tela renderiza em main e devolve um cleanup para eventos e recursos.
7. Ao navegar, o app limpa os recursos, interrompe o áudio e foca o título.

Histórico, links diretos e recarga funcionam com rotas por hash. O shell fica
montado entre telas. Alterações de progresso atualizam seus contadores sem
reconstruir uma atividade em andamento. Na navegação móvel, as regiões
inativas recebem inert; foco e Escape são tratados pelo shell.

## Telas

- Dashboard: próximo passo, meta diária e acesso às práticas.
- Journey: etapas expansíveis e estado de cada lição.
- Lesson: leitura, perguntas explicadas e recuperação dos erros.
- Kana: tabela, fileiras e configuração das rodadas.
- Practice: rodada reutilizável, respostas e repetição dos erros.
- Writing: modelos, animação e canvas.
- Sentences: blocos e digitação para situações específicas.
- Reference: kanji, partículas, expressões, biblioteca e revisão.
- Study: palavras por tema, exercícios, escuta e glossário.
- Worksheets: folhas A4 de caracteres, palavras e frases com gabaritos opcionais.
- Settings: modo visual, áudio, romaji, meta diária, indicadores e conquistas.

## Persistência

O schema v2 contém lessons, reviews, activity, preferences e updatedAt, além
dos campos anteriores progress, kanaStats, xp, streak e stats.

A normalização limita números, valida estruturas e converte revisões antigas.
A mesclagem mantém a união das conclusões e os registros de revisão mais
recentes; contadores históricos preservam o maior valor.

O navegador grava imediatamente em `maru-learning-v2`. Chaves
`maru-*-v1` e `nihongo-dojo-*-v1` são lidas na primeira migração e permanecem
intactas. O envio ao servidor é serializado, com debounce, timeout e retomada
ao voltar à conexão. A UI distingue salvamento no servidor, somente no
navegador e somente na sessão.

O servidor normaliza novamente, serializa gravações por perfil e usa arquivo
temporário seguido de rename. O diretório padrão é relativo ao módulo,
independente do diretório de execução. Não há autenticação nem sincronização
colaborativa entre usuários.

## Regras de aprendizado

Uma lição exige responder corretamente a todas as perguntas. As erradas são
explicadas e retornam antes da conclusão. Os 30 XP são concedidos uma vez.

Rodadas usam no máximo dez itens. Cada resposta verificada é registrada uma
vez antes do avanço. Distratores são distintos e pertencem ao mesmo tipo de
pergunta. Três acertos seguidos são um indicador de prática, não uma certificação.

Erros retornam em dez minutos. Acertos começam com um intervalo de um dia e
dobram até sessenta dias. A prática livre continua disponível.

O registro de escrita concede 5 XP uma vez por folha/caractere aberto e não
altera o desempenho de reconhecimento de kana. A caligrafia é autoavaliada.

## Frases, áudio e escrita

A API de frases recebe exerciseId e text. Compara modelos canônicos em japonês,
leituras em kana e formas de romaji previstas. Divergência significa “diferente
do modelo”, não “gramaticalmente impossível”. O mesmo código funciona localmente.
O formato legado com item permanece, sem dar notas artificiais a frases livres.

O áudio usa `POST /api/audio`. `speechService.js` valida o texto contra o catálogo
de estudo, consulta TTS Quest e devolve uma URL de streaming. Só URLs expiráveis
ficam em memória; o servidor e o frontend não escrevem áudio no disco. O player
cancela requisições e reprodução ao navegar, respeita a velocidade escolhida e
trata falhas, limites da API e bloqueio de reprodução automática.

`core/kanji.js` consulta KanjiAPI ao abrir um caractere. Valida campos, compartilha
requisições simultâneas, mantém cache de 24 horas e usa a cópia dos 20 caracteres
se a rede falhar. As explicações e traduções em português continuam sendo autorais.

`frontend/assets/data/strokes.json` contém os caminhos em ordem extraídos de
KanjiVG: 142 kana e 20 kanji. A atualização é manual:
`python3 scripts/fetch-strokes.py`. O uso normal não precisa da rede.
O arquivo derivado mantém CC BY-SA 3.0 e atribuição.

O canvas usa coordenadas normalizadas e redesenha ao mudar de tamanho.
Pointer Events permitem mouse, toque e caneta. Mostrar o guia não limpa o
desenho. Animações respeitam a preferência por movimento reduzido.

## CSS

A folha anterior foi substituída integralmente:

- foundation/tokens.css: cores, fontes e tokens estruturais;
- foundation/base.css: reset, tipografia, foco e movimento;
- layout.css: shell, navegação, cabeçalhos e rodapé;
- components.css: botões, campos, exemplos e feedback;
- screens.css: composição de cada tela;
- themes/arcade.css: variantes do modo Arcade, condicionadas por data-theme;
- responsive.css: desktop, tablet e celular, com prioridade sobre o tema;
- learning.css: vocabulário, exercícios, temas, missões e conquistas;
- print.css: papel A4, grades sem degradê e paginação independente do tema.

Dojo usa papel claro, tons naturais e vermelho. Arcade usa pixels e neon.
Os seletores de Arcade usam `:where()` para não impedir os ajustes de responsividade.
A troca atualiza tokens sem reconstruir o DOM da atividade. Fontes externas têm
fallbacks locais. React, Motion e Anime.js foram removidos; as animações de
traços usam a Web Animations API.

## API

| Método | Caminho | Uso |
| --- | --- | --- |
| GET | /api/health | Saúde e versão. |
| GET | /api/content | Currículo, catálogos e campos legados. |
| GET | /api/progress | Snapshot normalizado. |
| PUT / POST | /api/progress | Persistência de snapshot. |
| POST | /api/phrase/check | Comparação com o modelo de uma atividade. |
| POST | /api/audio | URL de reprodução remota de uma pronúncia do catálogo. |

O navegador envia seu perfil anônimo em x-maru-user; isso separa a persistência
e não autentica ninguém.
JSON inválido retorna 400; corpo excessivo, 413; caminhos inexistentes, 404.

## Verificação

`npm run check` verifica sintaxe dos módulos e imports das folhas de estilo.
`npm test` cobre currículo, respostas, traços, migração, revisão, constância,
API e gravações concorrentes.

`npm run test:e2e` usa servidor e dados isolados. Verifica conclusão e retomada,
erros, kana digitado, frases, escrita, filtros, revisão, fallback local,
histórico e teclado. As telas são verificadas em 320, 390, 768 e 1440 pixels
com captura dos erros do navegador.

Os testes de voz usam respostas controladas e áudio em memória para não consumir
a cota pública. Uma verificação separada confirmou reprodução real do streaming
TTS Quest. PDFs são gerados no teste e conferidos por número de páginas.
