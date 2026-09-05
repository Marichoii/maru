import { KANA_ROWS } from "/shared/content.js";
import { ALL_KANA } from "/shared/catalog.js";
import { pageHeading, icon, audioButton, routeLink, emptyState } from "../core/ui.js";
import { renderPractice } from "./practice.js";

export const kanaPracticeItem = item => ({
  id: item.id, prompt: item.char, answer: item.romaji, reading: item.char,
  explanation: item.romaji === "wo" ? "Como partícula, を se pronuncia o." : item.char === "ぢ" || item.char === "ヂ" ? "Mesmo som usual de じ; grafia diferente." : ""
});

export function renderKana(ctx, params = {}) {
  let script = params.script || "hiragana";
  let group = params.group || "seion";
  let rows = new Set(params.rows || ["a"]);
  let selected = ALL_KANA.find(item => item.script === script && item.group === group);
  if (selected && !ALL_KANA.some(item => item.script === script && item.group === group && rows.has(item.row))) rows = new Set([selected.row]);
  let mode = "choice";
  let focusErrors = false;
  let practiceCleanup;
  const controller = new AbortController();
  function pool() { return ALL_KANA.filter(item => item.script === script && item.group === group); }
  function selection() {
    return pool().filter(item => rows.has(item.row) && (!focusErrors || ctx.progress.kanaStats[item.id]?.wrong > 0));
  }
  function draw() {
    const availableRows = KANA_ROWS.filter(row => pool().some(item => item.row === row.id));
    const mastered = pool().filter(item => ctx.progress.kanaStats[item.id]?.streak >= 3).length;
    ctx.main.innerHTML = pageHeading("LER, OUVIR, RECONHECER", "Cada símbolo tem um som.", "Comece com cinco caracteres. Toque em um kana para conhecer a leitura e praticar a escrita.", routeLink("lesson/h-vowels", icon("book") + "Como começar", "btn btn-ghost")) +
      `<div class="toolbar"><div class="segmented" aria-label="Sistema de escrita">${["hiragana", "katakana"].map(value => `<button data-script="${value}" aria-pressed="${script === value}" class="${script === value ? "is-active" : ""}">${value === "hiragana" ? "あ Hiragana" : "ア Katakana"}</button>`).join("")}</div><span class="muted small">${mastered} de ${pool().length} com 3 acertos seguidos</span></div>
      <div class="tab-bar" aria-label="Grupo de sons">${[["seion", "46 básicos"], ["dakuten", "Dakuten ゛"], ["handakuten", "Handakuten ゜"], ["combined", "Combinações"]].map(([id, label]) => `<button data-group="${id}" class="${group === id ? "is-active" : ""}" aria-pressed="${group === id}">${label}</button>`).join("")}</div>
      <div class="kana-layout"><section class="kana-table panel"><div class="section-heading compact"><div><h2>${group === "combined" ? "Dois sinais, um som" : "Sua tabela de " + script}</h2><p class="small muted">Selecione as fileiras que quer praticar.</p></div><button class="text-link" data-kana="all">Selecionar todas</button></div>
      <div class="kana-column-head"><span>Fileira</span><span>a</span><span>i</span><span>u</span><span>e</span><span>o</span></div>
      ${availableRows.map(row => {
        const items = pool().filter(item => item.row === row.id);
        const cells = group === "combined" ? [items[0], null, items[1], null, items[2]]
          : row.id === "ya" ? [items[0], null, items[1], null, items[2]]
          : row.id === "wa" ? [items[0], null, null, null, items[1]]
          : [...items, ...Array(5 - items.length).fill(null)];
        return `<div class="kana-row ${rows.has(row.id) ? "is-selected" : ""}"><label class="row-toggle"><input type="checkbox" data-row="${row.id}" ${rows.has(row.id) ? "checked" : ""}><span>${row.id === "a" ? "Vogais" : row.id.toUpperCase()}</span></label>${cells.map(item => item ? `<button class="kana-cell ${selected?.id === item.id ? "is-active" : ""} ${ctx.progress.kanaStats[item.id]?.streak >= 3 ? "is-mastered" : ""}" data-char="${item.id}" aria-label="${item.char}, ${item.romaji}" aria-pressed="${selected?.id === item.id}"><span class="jp" lang="ja">${item.char}</span>${ctx.progress.preferences.romaji ? `<small>${item.romaji}</small>` : ""}</button>` : '<span class="kana-empty" aria-hidden="true">·</span>').join("")}</div>`;
      }).join("")}</section>
      <aside class="kana-sidebar"><div class="kana-detail panel"><span class="eyebrow">CONHEÇA ESTE KANA</span><div class="detail-character jp" lang="ja">${selected.char}</div><div class="detail-sound"><strong>${selected.romaji}</strong>${audioButton(selected.char)}</div><p>${selected.romaji === "wo" ? "Pronunciado o quando é partícula." : group === "combined" ? "Observe o tamanho do segundo caractere." : "Observe a forma, ouça e repita."}</p>${selected.char.length === 1 ? routeLink("writing/" + encodeURIComponent(selected.char), icon("pen") + "Ver os traços", "btn btn-ghost full-width") : ""}</div>
      <div class="practice-setup panel"><h2>Sua rodada de prática</h2><p class="muted small">${selection().length} caracteres selecionados · até 10 perguntas</p><label class="input-label" for="kana-mode">Como quer responder?</label><select id="kana-mode" class="text-input"><option value="choice" ${mode === "choice" ? "selected" : ""}>Escolher a leitura</option><option value="typed" ${mode === "typed" ? "selected" : ""}>Digitar a leitura</option></select><label class="check-label"><input type="checkbox" id="kana-errors" ${focusErrors ? "checked" : ""}> Reforçar meus erros</label><button class="btn btn-primary full-width" data-kana="start" ${selection().length ? "" : "disabled"}>Praticar agora ${icon("arrow")}</button>${!selection().length ? '<p class="small muted">Nenhum erro salvo neste grupo. Desmarque o filtro para praticar.</p>' : ""}</div></aside></div>
      <aside class="tip-box">${icon("spark")}<p>${group === "seion" ? "São 46 caracteres básicos em cada silabário. Dakuten, handakuten e combinações ampliam esses sons. Aprenda uma fileira por vez." : group === "combined" ? "ゃ・ゅ・ょ pequenos combinam com um kana da coluna i. Por exemplo, きゃ é kya; きや com や grande é ki-ya." : "As marcas mudam o som. ゛ transforma ka em ga, por exemplo. O pequeno círculo ゜ transforma ha em pa."}</p></aside>`;
  }
  ctx.main.addEventListener("change", event => {
    if (event.target.dataset.row) {
      if (event.target.checked) rows.add(event.target.dataset.row); else rows.delete(event.target.dataset.row);
      if (!rows.size) { rows.add(event.target.dataset.row); ctx.toast("Mantenha pelo menos uma fileira selecionada."); }
      draw();
    }
    if (event.target.id === "kana-mode") mode = event.target.value;
    if (event.target.id === "kana-errors") { focusErrors = event.target.checked; draw(); }
  }, { signal: controller.signal });
  ctx.main.addEventListener("click", event => {
    const target = event.target.closest("button");
    if (!target) return;
    if (target.dataset.script) { script = target.dataset.script; selected = pool()[0]; draw(); }
    if (target.dataset.group) { group = target.dataset.group; rows = new Set([pool()[0].row]); selected = pool()[0]; draw(); }
    if (target.dataset.char) { selected = ALL_KANA.find(item => item.id === target.dataset.char); draw(); }
    if (target.dataset.kana === "all") { rows = new Set(pool().map(item => item.row)); draw(); }
    if (target.dataset.kana === "start" && selection().length) {
      controller.abort();
      practiceCleanup = renderPractice(ctx, { title: script === "hiragana" ? "Praticando hiragana" : "Praticando katakana", items: selection().map(kanaPracticeItem), pool: pool().map(kanaPracticeItem), typed: mode === "typed", back: "kana" });
      window.scrollTo({ top: 0 });
    }
  }, { signal: controller.signal });
  if (!selected) { ctx.main.innerHTML = emptyState("Grupo não encontrado", "Volte para a tabela de kana.", routeLink("kana", "Ver kana")); return; }
  draw();
  return () => { controller.abort(); practiceCleanup?.(); };
}
