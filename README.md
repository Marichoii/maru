# Maru

Japonês do zero, um passo de cada vez. Uma aplicação em português com trilha
guiada, explicações, exercícios e revisão espaçada.

## Rodar localmente

Requer Node.js 22 ou superior. O frontend não exige build; o servidor usa SQLite e a biblioteca oficial de autenticação Google.

```bash
npm install
npm run dev
```

Abra [http://127.0.0.1:5173](http://127.0.0.1:5173).

`HOST` e `PORT` configuram o servidor. O progresso fica em
`data/progress/maru.sqlite`; `MARU_DATA_DIR` permite usar outra pasta.
Os arquivos JSON anteriores são importados por perfil e permanecem intactos.
Cada navegador recebe um identificador próprio, salvo em `maru-profile-id`.
Não abra o HTML diretamente como arquivo: os módulos usam o servidor HTTP.

## O que o aluno encontra

- **37 lições em 8 etapas:** primeiros passos, hiragana, katakana, kanji,
  frases, partículas, comunicação cotidiana e linguagem informal.
- **Navegação:** cinco destinos principais, com práticas agrupadas e materiais pesquisáveis em Explorar.
- **Dois modos:** Dojo claro, com washi, tinta e selos vermelhos; Arcade escuro com marca em pixels,
  nível, oito conquistas, missões diárias e efeitos opcionais. A troca mantém a atividade.
- **Kana:** 46 básicos, 25 formas com marcas e 33 combinações por silabário;
  seleção de fileiras, reconhecimento, digitação e reforço dos erros.
- **Escrita:** modelos locais com ordem dos traços para 142 kana e 20 kanji,
  animação, avanço manual, canvas com suporte a mouse/toque/caneta, guia e desfazer.
- **Frases:** 32 situações com blocos ou digitação em japonês, kana ou romaji.
  A validação compara modelos explícitos e explica a função das partículas.
- **Referências:** 12 partículas, 50 expressões com contexto e o acervo
  complementar existente de 120 itens de vocabulário, kanji e gramática.
- **Vocabulário:** 64 palavras em sete temas, cada uma com leitura, exemplo e tradução.
- **Atividades:** 24 perguntas de partículas, 16 situações, 64 práticas de vocabulário
  e 96 exercícios de escuta com transcrição revelada após responder.
- **Explicações:** 26 termos definidos do zero, também disponíveis dentro das lições.
- **Impressão:** A4 com cinco caracteres por página (as cinco vogais ficam juntas),
  ordem dos traços, modelos para cobrir, casas vazias, palavras e frases com gabarito.
- **Revisão:** erros retornam em 10 minutos; acertos ampliam o intervalo.
- **Progresso:** lições, XP, constância no calendário local e meta diária
  persistidos no navegador e no servidor, com migração dos dados anteriores.

## Novas portas de entrada

- **Diagnóstico:** 15 perguntas, pausa/retomada, sugestão de etapa e ajuste manual, sem XP ou conclusão automática.
- **Contas:** login Google, importação do progresso anônimo e sincronização entre aparelhos. Sem credenciais, o estudo anônimo continua disponível.
- **Selos:** oito etapas, conquistadas somente ao concluir suas lições. Uma pausa de um dia por semana pode preservar a constância, sem criar XP ou atividade.
- **Descobertas:** oito cápsulas culturais e três trilhas temáticas (viagem, anime/mangá, trabalho), reutilizando o acervo.
- **Apoio opcional:** página discreta; links reais do Apoia.se/Ko-fi configuráveis, sem paywall ou interrupções.

Copie `.env.example` para `.env` e siga [a configuração de contas e hospedagem](docs/DEPLOYMENT.md).
O login exige um cliente OAuth Google; nenhum segredo é enviado ao frontend.
Para ampliar o conteúdo, use `npm run content:new -- --id nova-licao --module everyday --title "Minha lição"`.
O comando cria um rascunho para revisão, sem publicá-lo. `npm run backup` gera uma cópia consistente do SQLite.

## Verificar

```bash
npm run check
npm test
npx playwright install chromium
npm run test:e2e
```

Os testes de API e navegador usam pastas temporárias, sem alterar seu progresso.
O E2E inicia um servidor próprio na porta 5187. Se necessário, use
`MARU_BROWSER_PATH` para apontar para um Chromium já instalado.

## Limites atuais

A trilha é introdutória e não equivale a um curso completo ou certificação JLPT.
A escrita é comparada pelo próprio aluno; não existe reconhecimento automático
de caligrafia. O verificador de frases é restrito aos modelos das atividades.

A pronúncia é consultada na API TTS Quest e reproduzida por streaming.
Nenhum MP3 é gerado ou salvo pelo Maru. Voz: **VOICEVOX:ずんだもん**.
A API pública funciona sem chave, exige internet e pode pedir um intervalo entre
consultas. Opcionalmente, configure `TTS_QUEST_API_KEY` no ambiente do servidor
para usar a modalidade de maior capacidade do provedor. A chave não vai para o navegador.
Os links retornados ficam em memória por dez minutos; repetição não solicita nova síntese.

A KanjiAPI complementa os kanji com leituras e contagem de traços; ela não fornece
áudio. A consulta tem cache por 24 horas e uma cópia dos 20 kanji para indisponibilidade.
Gravações de falantes em situações reais estão nos recursos da biblioteca.
As fontes do Google são opcionais, com alternativas locais no CSS.

Os perfis anônimos são separados por navegador. Contas usam sessão com cookie
HttpOnly e token armazenado como hash no SQLite. `x-maru-user` continua sendo
apenas isolamento anônimo, não autenticação. Dados antigos são preservados.
O login real depende das credenciais Google, e os links de apoio dependem de
páginas reais. IA, link mágico e blocos avançados seguem as fases posteriores
do [backlog](docs/BACKLOG.md).

## Organização

Consulte [a arquitetura](docs/ARCHITECTURE.md) e
[o guia editorial](docs/CONTENT.md) para adicionar funcionalidades ou lições.
Os modelos de traços usam [KanjiVG](https://kanjivg.tagaini.net/) sob
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), com atribuição
na própria interface e em [LICENSE.md](frontend/assets/data/LICENSE.md).

As integrações e créditos estão em [APIs e áudio](docs/INTEGRATIONS.md).
