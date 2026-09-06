import { esc } from "./html.js";
import { icon } from "./icons.js";
export { esc, icon };
export const routeLink = (route, label, className = "btn", extra = "") => `<a class="${className}" href="#/${route}" ${extra}>${label}</a>`;
export const progressBar = (value, label = "Progresso") => `<div class="progress-track" role="progressbar" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(value)}"><span style="width:${Math.max(0, Math.min(100, value))}%"></span></div>`;
export const pageHeading = (eyebrow, title, subtitle, action = "") => `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1 tabindex="-1">${title}</h1><p class="page-description">${subtitle}</p></div>${action}</div>`;
export const audioButton = (text, label = "Ouvir pronúncia") => `<button type="button" class="icon-button audio-button" data-speak="${esc(text)}" aria-label="${esc(label)}" title="${esc(label)}">${icon("volume")}</button>`;
export const exampleHTML = (example, romaji = true) => `<div class="example"><div class="example-line"><span class="jp" lang="ja">${esc(example.jp)}</span>${audioButton(example.jp)}</div>${romaji ? `<p class="romaji">${esc(example.romaji)}</p>` : ""}<p class="translation">${esc(example.pt)}</p>${example.note ? `<p class="example-note">${esc(example.note)}</p>` : ""}</div>`;
export const emptyState = (title, body, action = "") => `<div class="empty-state"><div class="empty-symbol" lang="ja">空</div><h2>${title}</h2><p>${body}</p>${action}</div>`;
export function shuffle(items) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
