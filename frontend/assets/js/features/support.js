import { getSiteConfig } from "../api.js";
import { esc, icon, pageHeading, routeLink } from "../core/ui.js";

export function renderSupport(ctx) {
  let active = true;
  ctx.main.innerHTML = pageHeading("FEITO PARA CONTINUAR ABERTO", "Um pequeno apoio. Mais caminhos.", "O Maru é gratuito. Apoiar é uma escolha, nunca uma condição para aprender.") +
    `<section class="panel support-card"><span class="hanko jp" lang="ja" aria-hidden="true">丸</span><h2>Seu japonês tem lugar aqui.</h2><p>Você pode acessar todas as lições, praticar, ouvir e imprimir atividades sem pagar. Não há conteúdo reservado a apoiadores.</p><p>Se quiser contribuir, seu apoio ajuda a manter a hospedagem, as consultas de áudio e o tempo dedicado a revisar o conteúdo.</p><div id="support-destinations" aria-live="polite"><p class="muted">Consultando as opções de apoio…</p></div><p class="small muted">A contribuição acontece no serviço escolhido. O Maru não recebe dados de cartão nem armazena informações de pagamento.</p></section><section class="panel support-card"><h2>Aprender também é participar.</h2><p>Voltar para mais uma lição, treinar uma palavra no papel e compartilhar o Maru com alguém que quer começar já fazem parte dessa história. O seu acesso continua igual, com ou sem contribuição.</p>${routeLink("home", "Voltar ao meu aprendizado " + icon("arrow"), "btn btn-ghost")}</section>`;
  getSiteConfig().then(config => {
    if (!active) return;
    ctx.main.querySelector("#support-destinations").innerHTML = config.support.length
      ? config.support.map(item => `<a class="btn btn-primary" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.label)} ${icon("external")}</a>`).join("")
      : '<p class="support-message">O canal de contribuições ainda está sendo preparado. Enquanto isso, fique à vontade para estudar e compartilhar o Maru.</p>';
  }).catch(() => { if (active) ctx.main.querySelector("#support-destinations").textContent = "As opções de apoio não carregaram. Você pode continuar estudando e voltar aqui depois."; });
  return () => { active = false; };
}
