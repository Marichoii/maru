import { ringSVG } from "../core/html.js";

export function kanaHubCardHTML(deps){
  var hPct = deps.kanaPctFor("hiragana");
  var kPct = deps.kanaPctFor("katakana");
  return '<button class="kana-hub-card" data-action="go-kana-hub">' +
    '<div>' +
      '<p class="eyebrow" style="margin-bottom:.3rem;">Arena completa</p>' +
      '<h3><span class="jp">仮名</span><span class="brand-en">Kana grind</span></h3>' +
      '<p>Filtre por fileiras, alterne hiragana e katakana, foque nos erros e faça sessões rápidas de reconhecimento ou escrita.</p>' +
    '</div>' +
    '<div class="kana-hub-rings">' +
      '<div class="kana-ring">' + ringSVG(hPct) + '<span>Hiragana</span></div>' +
      '<div class="kana-ring">' + ringSVG(kPct) + '<span>Katakana</span></div>' +
    '</div>' +
  '</button>';
}

export function kanaBurstHTML(){
  var chars = ["あ","ア","き","キ","す","ス","ね","ネ","ま","マ","ゆ","ユ","り","リ","ん","ン"];
  return '<div class="hero-kana-burst" aria-hidden="true">' +
    chars.map(function(ch){ return '<span class="jp">' + ch + '</span>'; }).join("") +
  '</div>';
}

export function kanaScriptChipsHTML(state){
  return ["hiragana","katakana","both"].map(function(sc){
    var label = sc === "hiragana" ? "Hiragana" : sc === "katakana" ? "Katakana" : "Ambos";
    return '<button class="chip ' + (state.kanaSel.script === sc ? "is-active" : "") + '" data-action="set-kana-script" data-script="' + sc + '">' + label + '</button>';
  }).join("");
}

export function kanaGrindHeroHTML(deps){
  var state = deps.state;
  var pool = deps.kanaPool();
  var mastered = pool.filter(deps.kanaIsMastered).length;
  var hPct = deps.kanaPctFor("hiragana");
  var kPct = deps.kanaPctFor("katakana");
  var focusCount = pool.filter(function(k){
    return deps.kanaStats[k.id] && deps.kanaStats[k.id].wrong > 0;
  }).length;

  return '<section class="grind-hero">' +
    '<div class="grind-copy">' +
      '<p class="eyebrow">Kana grind</p>' +
      '<h1 class="page-title jp">仮名を grind する</h1>' +
      '<p class="page-sub">Sessões curtas, repetição alta, XP e foco nos caracteres que você mais erra. O objetivo é reconhecer e escrever kana sem pensar.</p>' +
      '<div class="grind-selector">' +
        kanaScriptChipsHTML(state) +
        '<button class="chip ' + (state.kanaSel.focus ? "is-active" : "") + '" data-action="toggle-kana-focus">Focar erros</button>' +
      '</div>' +
      '<div class="grind-actions">' +
        '<button class="btn grind-primary" data-action="start-kana-session" data-mode="recognize">Iniciar grind</button>' +
        '<button class="btn ghost" data-action="start-kana-session" data-mode="draw">Treinar escrita</button>' +
        '<button class="btn quiet" data-action="go-kana-hub">Editar fileiras</button>' +
      '</div>' +
      '<div class="grind-metrics">' +
        '<div class="summary-item"><b>' + pool.length + '</b>kana no pool</div>' +
        '<div class="summary-item"><b>' + mastered + '</b>dominados</div>' +
        '<div class="summary-item"><b>' + focusCount + '</b>com erro salvo</div>' +
      '</div>' +
    '</div>' +
    '<div class="kana-showcase">' +
      '<img class="hero-crest" src="./assets/img/maru-crest.svg" alt="">' +
      kanaBurstHTML() +
      '<div class="showcase-rings">' +
        '<div class="kana-ring">' + ringSVG(hPct) + '<span>Hiragana</span></div>' +
        '<div class="kana-ring">' + ringSVG(kPct) + '<span>Katakana</span></div>' +
      '</div>' +
    '</div>' +
  '</section>';
}
