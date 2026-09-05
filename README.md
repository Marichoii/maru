# Maru

Japonês do zero, um passo de cada vez. Uma aplicação em português com trilha
guiada, explicações, exercícios e revisão espaçada.

## Rodar localmente

Requer Node.js 20 ou superior. Não há build nem dependências de produção.

```bash
npm install
npm run dev
```

Abra [http://127.0.0.1:5173](http://127.0.0.1:5173).

`HOST` e `PORT` configuram o servidor. O progresso fica em
`data/progress/default.json`; `MARU_DATA_DIR` permite usar outra pasta.
Não abra o HTML diretamente como arquivo: os módulos usam o servidor HTTP.

## O que o aluno encontra

- **25 lições em 8 etapas:** primeiros passos, hiragana, katakana, kanji,
  frases, partículas, comunicação cotidiana e linguagem informal.
- **Kana:** 46 básicos, 25 formas com marcas e 33 combinações por silabário;
  seleção de fileiras, reconhecimento, digitação e reforço dos erros.
- **Escrita:** modelos locais com ordem dos traços para 142 kana e 20 kanji,
  animação, avanço manual, canvas com suporte a mouse/toque/caneta, guia e desfazer.
- **Frases:** 10 situações com blocos ou digitação em japonês, kana ou romaji.
  A validação compara modelos explícitos e explica a função das partículas.
- **Referências:** 12 partículas, 16 expressões com contexto e o acervo
  complementar existente de 120 itens de vocabulário, kanji e gramática.
- **Revisão:** erros retornam em 10 minutos; acertos ampliam o intervalo.
- **Progresso:** lições, XP, constância no calendário local e meta diária
  persistidos no navegador e no servidor, com migração dos dados anteriores.

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

A pronúncia usa a síntese de voz do dispositivo, quando há voz japonesa.
Gravações de falantes estão nos recursos externos da biblioteca.
As fontes do Google são opcionais, com alternativas locais no CSS.

Esta versão usa um perfil local compartilhado e não implementa autenticação.
O header `x-maru-user` separa arquivos para desenvolvimento/testes e não é um
mecanismo de segurança. Para exposição pública, o próximo trabalho é criar
contas, autorização e persistência por usuário.

## Organização

Consulte [a arquitetura](docs/ARCHITECTURE.md) e
[o guia editorial](docs/CONTENT.md) para adicionar funcionalidades ou lições.
Os modelos de traços usam [KanjiVG](https://kanjivg.tagaini.net/) sob
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), com atribuição
na própria interface e em [LICENSE.md](frontend/assets/data/LICENSE.md).
