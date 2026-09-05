import { LESSONS } from "/shared/curriculum.js";
import { currentStreak } from "/shared/progress.js";
import { pageHeading, icon, routeLink } from "../core/ui.js";

export function renderSettings(ctx) {
  const controller = new AbortController();
  const p = ctx.progress;
  ctx.main.innerHTML = pageHeading("DO SEU JEITO", "Um ritmo que combina com você.", "Ajuste o apoio de leitura e a meta diária. Você pode mudar de ideia quando quiser.") +
    `<div class="settings-layout"><section class="panel settings-panel"><h2>Seu aprendizado</h2><div class="setting-row"><div><h3>Leitura de apoio em romaji</h3><p>Mostra a leitura em letras latinas junto dos exemplos. Perguntas sobre leitura continuam mostrando as respostas.</p></div><label class="switch"><input id="setting-romaji" type="checkbox" ${p.preferences.romaji ? "checked" : ""}><span aria-hidden="true"></span><span class="sr-only">Mostrar romaji</span></label></div><div class="setting-row vertical"><div><h3>Sua meta diária</h3><p>Uma atividade é uma resposta de prática, uma lição concluída ou um registro de escrita.</p></div><div class="goal-options">${[[5, "Um começo leve"], [10, "Criando o hábito"], [15, "Um pouco mais"]].map(([goal, label]) => `<label class="goal-option"><input type="radio" name="daily-goal" value="${goal}" ${p.preferences.dailyGoal === goal ? "checked" : ""}><strong>${goal} atividades</strong><span>${label}</span></label>`).join("")}</div></div><div class="setting-note">${icon("check")} As preferências são salvas automaticamente.</div></section>
      <aside class="panel progress-overview"><span class="jp" lang="ja">歩</span><h2>Cada passo fica.</h2><dl><div><dt>Lições concluídas</dt><dd>${LESSONS.filter(lesson => p.lessons[lesson.id]?.completedAt).length} / ${LESSONS.length}</dd></div><div><dt>Experiência acumulada</dt><dd>${p.xp.total} XP</dd></div><div><dt>Dias de constância</dt><dd>${currentStreak(p)}</dd></div><div><dt>Frases acertadas</dt><dd>${p.stats.sentencesWritten}</dd></div></dl>${routeLink("journey", "Continuar minha trilha " + icon("arrow"), "text-link")}</aside></div>
      <section class="panel settings-panel about-panel"><h2>Sobre este espaço</h2><p>Maru é um ponto de partida para pessoas que começam japonês do zero. A trilha introduz leitura, escrita, gramática e situações de comunicação. Ela não substitui prática de conversação ou um curso completo.</p><p>Seu progresso é salvo neste navegador e, quando disponível, no servidor local. Esta versão usa um perfil compartilhado no servidor e não possui contas individuais.</p><p>O botão de áudio usa uma voz japonesa do seu dispositivo, quando disponível. Para ouvir gravações de falantes, visite os recursos da biblioteca.</p>${routeLink("library", "Conhecer os recursos e as referências " + icon("external"), "text-link")}</section>`;
  ctx.main.addEventListener("change", event => {
    if (event.target.id === "setting-romaji") p.preferences.romaji = event.target.checked;
    if (event.target.name === "daily-goal") p.preferences.dailyGoal = Number(event.target.value);
    ctx.save();
    ctx.toast("Preferências salvas.");
  }, { signal: controller.signal });
  return () => controller.abort();
}
