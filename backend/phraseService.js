const JAPANESE_RE = /[\u3040-\u30ff\u3400-\u9fff]/;

function cleanTarget(term){
  return String(term || "").replace(/[〜~]/g, "").trim();
}

function withJapanesePeriod(text){
  return /[。！？!?]$/.test(text) ? text : text + "。";
}

export function checkPhrase({ text, item, level }){
  const phrase = String(text || "").trim();
  const target = cleanTarget(item && item.term);
  const hasJapanese = JAPANESE_RE.test(phrase);
  const usesTarget = target ? phrase.indexOf(target) !== -1 : true;

  if(!phrase){
    return {
      nota: "precisa melhorar",
      comentario: "Escreva uma frase em japonês antes de pedir a correção.",
      frase_corrigida: item && item.example ? item.example : ""
    };
  }

  if(!hasJapanese){
    return {
      nota: "precisa melhorar",
      comentario: "A frase precisa estar em japonês. Use kana, kanji ou uma mistura dos dois.",
      frase_corrigida: item && item.example ? item.example : ""
    };
  }

  if(!usesTarget){
    return {
      nota: "bom",
      comentario: "A frase está em japonês, mas não encontrei o item pedido. Tente reutilizar a palavra ou estrutura do exercício.",
      frase_corrigida: item && item.example ? item.example : withJapanesePeriod(phrase)
    };
  }

  const hasParticle = /[はがをにへでとのも]/.test(phrase);
  const nota = hasParticle ? "ótimo" : "bom";
  const comentario = hasParticle
    ? "Boa frase para o nível " + (level || "atual") + ". Ela usa o alvo do exercício e já mostra função gramatical com partícula."
    : "Boa tentativa. Para soar mais natural, confira se a frase deixa claro tópico, alvo ou destino com uma partícula.";

  return {
    nota,
    comentario,
    frase_corrigida: withJapanesePeriod(phrase)
  };
}
