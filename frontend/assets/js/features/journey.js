import { MODULES, LESSONS } from "/shared/curriculum.js";
import { pageHeading, routeLink, icon, progressBar } from "../core/ui.js";

export function renderJourney(ctx, moduleId) {
  const next = LESSONS.find(lesson => !ctx.progress.lessons[lesson.id]?.completedAt);
  const completed = LESSONS.filter(lesson => ctx.progress.lessons[lesson.id]?.completedAt).length;
  ctx.main.innerHTML = pageHeading("SUA TRILHA", "Do zero, com direção.", "Siga a ordem sugerida ou explore uma etapa. Todas as lições estão abertas.") +
    `<div class="journey-summary panel"><span class="summary-symbol jp">道</span><div><strong>${completed} de ${LESSONS.length} lições concluídas</strong><p>8 etapas para construir sua base no japonês.</p>${progressBar(completed / LESSONS.length * 100)}</div>${routeLink(next ? "lesson/" + next.id : "review", (completed ? "Continuar" : "Dar o primeiro passo") + icon("arrow"), "btn btn-primary")}</div>
    <div class="journey-list">${MODULES.map(module => {
      const done = module.lessons.filter(lesson => ctx.progress.lessons[lesson.id]?.completedAt).length;
      const open = moduleId ? moduleId === module.id : next?.moduleId === module.id;
      return `<details class="journey-module" ${open ? "open" : ""}><summary><span class="module-symbol ${module.color} jp" lang="ja">${module.symbol}</span><div><span class="eyebrow">ETAPA ${module.number}</span><h2>${module.title}</h2><p>${module.subtitle}</p></div><span class="module-count">${done}/${module.lessons.length}</span>${icon("down")}</summary><div class="lesson-list">${module.lessons.map((lesson, index) => {
        const complete = ctx.progress.lessons[lesson.id]?.completedAt;
        return `<a class="lesson-row ${next?.id === lesson.id ? "is-next" : ""}" href="#/lesson/${lesson.id}"><span class="lesson-state ${complete ? "is-done" : ""}">${complete ? icon("check") : String(index + 1).padStart(2, "0")}</span><div><h3>${lesson.title}${next?.id === lesson.id ? '<span class="pill small-pill">Próximo passo</span>' : ""}</h3><p>${lesson.goal}</p></div><span class="lesson-duration">${icon("clock")} ${lesson.minutes} min</span>${icon("chevron")}</a>`;
      }).join("")}</div></details>`;
    }).join("")}</div>`;
}
