# Conteúdo e progressão didática

A trilha assume zero conhecimento de japonês. O aluno recebe explicação em
português antes dos exercícios; exemplos trazem japonês, leitura de apoio e
tradução. A progressão é recomendada, sem bloqueios artificiais.

| Etapa | Lições | Resultado esperado |
| --- | --- | --- |
| Primeiros passos | 5 | Reconhecer as escritas, perceber sons e cumprimentar. |
| Hiragana | 5 | Ler fileiras, marcas e combinações; iniciar escrita. |
| Katakana | 4 | Reconhecer empréstimos, formas parecidas e vogais longas. |
| Primeiros kanji | 4 | Relacionar significado, leitura em palavras e traços. |
| Construir frases | 5 | Apresentar-se, perguntar, negar e expressar ações. |
| Partículas | 4 | Identificar tópico, sujeito, objeto, lugar e relações. |
| Dia a dia | 5 | Pedir itens, encontrar lugares e pedir ajuda na conversa. |
| Além dos livros | 5 | Entender registro, gírias e expressões de comunidades. |

## Critérios editoriais

- Ensinar cinco vogais antes de apresentar toda a tabela.
- Distinguir 46 kana básicos de formas com marcas e combinações.
- Explicar as partículas は (wa), へ (e) e を (o).
- Tratar vogais longas e pequenos っ e ゃゅょ como contrastes relevantes.
- Apresentar kanji dentro de palavras, sem prometer uma única leitura.
- Associar partículas a funções e contexto, evitando traduções fixas.
- Manter frases guiadas semanticamente coerentes, com situações e modelos autorais.
- Explicar formas educadas e informais antes das gírias.
- Mostrar contexto e alternativas neutras para expressões informais.
- Evitar equivalências literais, como “いただきます = bom apetite”.
- Não apresentar N1 como “nativo” ou a biblioteca como lista oficial do JLPT.
- Explicar respostas e permitir refazer o que foi errado.

As perguntas verificam compreensão introdutória. Reconhecimento de kana,
escrita e construção de frases complementam a leitura. O resultado não prova
fluência, boa caligrafia ou capacidade de manter conversações espontâneas.

## Acrescentar uma lição

1. Adicione-a ao arquivo temático em shared/lessons, com ID estável.
2. Inclua objetivo, duração, seções, exemplos e perguntas explicadas.
3. Defina o índice da resposta correta em cada pergunta.
4. Para prática complementar, informe uma rota existente e parâmetros.
5. A etapa em curriculum.js compõe índices, contagens e navegação.
6. Execute as verificações e teste leitura e prática.

IDs existentes são usados no progresso: renomeá-los exige migração.
Ao ampliar a trilha, atualize as contagens nos testes e neste guia.

## Referências

O texto das lições e os modelos de atividade são originais desta aplicação.
Os recursos abaixo servem como referência e estudo complementar; não implicam
afiliação ou aprovação do Maru por essas organizações.

- [Irodori Starter, Japan Foundation](https://www.irodori.jpf.go.jp/en/starter/pdf.html):
  material introdutório voltado a situações de comunicação e áudios de falantes.
- [Marugoto A1, hiragana e katakana](https://a1.marugotoweb.jp/en/hiragana.php):
  apoio ao estudo dos silabários.
- [Descrições oficiais N1–N5 do JLPT](https://www.jlpt.jp/e/about/levelsummary.html):
  limites e competências associadas aos níveis.
- [KanjiVG](https://kanjivg.tagaini.net/):
  modelos de ordem dos traços, Ulrich Apel e colaboradores, CC BY-SA 3.0.

Os 120 itens anteriores foram mantidos como consulta complementar. Suas
etiquetas de nível são orientativas. Gírias e jargões variam por comunidade,
época e relação; a seleção não pretende cobrir todas as variações.

## Atividades e explicações

O vocabulário inicial contém 64 palavras em sete temas. Cada palavra recebe
leitura em kana, romaji, tradução e uma frase contextualizada. O glossário
define 26 conceitos e é ligado às seções das lições por termos presentes no texto.

Os 32 modelos de frases usam tokens com texto, romaji, função e leitura em kana.
As atividades de partículas sempre indicam a intenção pedida, evitando tratar
como erro absoluto uma alternativa possível em outro contexto. Gírias incluem
situação, grau de informalidade e alternativas educadas quando cabíveis.

As folhas de caracteres comportam cinco itens por página. As cinco vogais de
um silabário devem sempre caber juntas. As linhas da grade são bordas tracejadas,
sem degradês, para evitar artefatos em PDF. O gabarito de palavras e frases é
separado e opcional; o aluno pode esconder os modelos para praticar a lembrança.

Pronúncias novas entram automaticamente no catálogo textual quando fazem parte
dos exemplos. Para caracteres ou palavras com leitura ambígua, informe a leitura
ensinada. A API sintetiza apenas a solicitação do aluno: não há geração em lote
nem arquivos de áudio no projeto.


## Diagnóstico, contexto e novos rascunhos

O diagnóstico contém 15 perguntas em shared/placement.js. O reconhecimento de
hiragana e katakana funciona como pré-requisito para sugestões posteriores;
kanji, vocabulário, partículas e leitura refinam a indicação. O resultado sugere
uma etapa, não certifica proficiência. A resposta “Ainda não sei” é válida e não
altera revisão, XP, constância ou lições concluídas. A sugestão é reversível.

shared/discovery.js reúne oito cápsulas culturais e três trilhas temáticas.
As cápsulas reutilizam contexto e explicações de expressões existentes. As trilhas
combinam IDs reais de palavras, modelos de frases, expressões e lições; não mantêm
cópias concorrentes do conteúdo.

Para começar uma lição, execute:

    npm run content:new -- --id novo-tema --module everyday --title "Novo tema"

O rascunho aparece em docs/drafts, com todos os campos e marcações REVISAR.
O comando recusa IDs duplicados e nunca sobrescreve um arquivo. Complete o texto,
confira [o checklist editorial](EDITORIAL-CHECKLIST.md), remova metadados do rascunho
e só então integre a lição em shared/lessons e curriculum.js. O backlog registra
os blocos posteriores sem apresentá-los como conteúdo já disponível ao aluno.
