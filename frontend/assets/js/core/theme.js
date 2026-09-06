export const THEMES = [
  { id: "dojo", title: "Dojo", subtitle: "Papel, tinta e tranquilidade.", description: "Um espaço claro e minimalista para estudar com calma.", symbol: "道" },
  { id: "arcade", title: "Arcade", subtitle: "Pixels, neon e novas conquistas.", description: "Um fliperama escuro com nível, missões e feedback de jogo.", symbol: "遊" }
];
export function applyTheme(theme) {
  const selected = theme === "arcade" ? "arcade" : "dojo";
  document.documentElement.dataset.theme = selected;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", selected === "arcade" ? "#050713" : "#f8f7f3");
  const mark = selected === "arcade" ? "maru-crest.svg" : "maru-mark.svg";
  document.querySelector('link[rel="icon"]')?.setAttribute("href", "/assets/img/" + mark);
  document.querySelector(".brand img")?.setAttribute("src", "/assets/img/" + mark);
  document.querySelectorAll("[data-theme-choice]").forEach(button => {
    const active = button.dataset.themeChoice === selected;
    button.setAttribute("aria-pressed", String(active));
    button.classList.toggle("is-active", active);
  });
}
export function themeSwitcher() {
  return '<div class="theme-switcher" role="group" aria-label="Modo visual"><button class="theme-choice" data-theme-choice="dojo" aria-pressed="true"><span aria-hidden="true">道</span> Dojo</button><button class="theme-choice" data-theme-choice="arcade" aria-pressed="false"><span aria-hidden="true">✦</span> Arcade</button></div>';
}
