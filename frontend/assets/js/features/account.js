import { esc, icon, routeLink } from "../core/ui.js";

export function accountHTML(ctx, status) {
  const { user, googleEnabled, verified } = ctx.account;
  const message = {
    "login-success": "Conta conectada. Seu progresso está pronto para ser sincronizado; acompanhe o indicador de salvamento.",
    "login-failed": "Não foi possível concluir o login. Ele pode ter sido cancelado ou expirado. Seu progresso continua neste navegador.",
    "login-unavailable": "O login ainda não está disponível neste Maru. Você pode continuar estudando sem conta."
  }[status];
  return `<section class="panel settings-panel account-panel"><p class="eyebrow">SEU APRENDIZADO ACOMPANHA VOCÊ</p><h2>${user ? "Sua conta no Maru" : "Seu lugar, em qualquer aparelho."}</h2>${message ? `<p class="account-notice" role="status">${message}</p>` : ""}${user ? `<p>Olá, <strong>${esc(user.name)}</strong>.</p><p class="small muted">${esc(user.email)}</p><p>${verified ? "Sua conta reúne o progresso salvo neste navegador e no servidor. Ao entrar em outro aparelho, suas lições e revisões continuam com você." : "Você está usando a cópia salva neste navegador. A sincronização volta quando sua conta puder ser confirmada."}</p><button class="btn btn-ghost" id="account-logout">Sair desta conta</button>` : `<p>Estude sem cadastro ou entre com Google para levar suas lições, preferências e revisões para outro aparelho. O progresso que você já fez aqui vai junto.</p>${googleEnabled ? '<a href="/api/auth/google" class="btn btn-primary" id="google-login">Entrar com Google</a>' : '<p class="small muted">O login ainda não foi ativado. Seu progresso continua salvo neste navegador.</p>'}`}<p class="source-note">O Google confirma sua identidade. O Maru recebe nome, e-mail e um identificador de conta; não acessa seus arquivos, contatos ou mensagens.</p>${routeLink("support", "Apoie o Maru " + icon("arrow"), "text-link")}</section>`;
}
