var animeApi = null;

function animationsAllowed(){
  if(typeof document === "undefined" || typeof document.querySelectorAll !== "function") return false;
  if(typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function playAnime(selector, params){
  if(!animeApi || typeof animeApi.animate !== "function") return;
  if(!animationsAllowed() || !document.querySelector(selector)) return;
  try{ animeApi.animate(selector, params); }
  catch(err){ /* animations are decorative; rendering must remain stable */ }
}

export function loadAnime(onReady){
  if(typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") return;
  import("animejs").then(function(mod){
    animeApi = mod;
    if(typeof onReady === "function") onReady();
  }).catch(function(){});
}

export function runScreenAnimations(){
  if(!animeApi) return;
  playAnime(".app-header", {
    opacity: { from: 0 },
    y: { from: "-0.5rem" },
    duration: 420,
    ease: "outExpo"
  });
  playAnime(".grind-hero, .daily-plan, .xp-card, .kana-hub-card, .section-head, .tool-card, .level-tile, .mode-card, .row-group, .builder-panel, .builder-output, .guide-card, .quiz-term, .quiz-opt, .draw-stage, .phrase-prompt, .phrase-textarea, .phrase-feedback, .reveal-panel, .end-card, .ach-card", {
    opacity: { from: 0 },
    y: { from: "0.85rem" },
    duration: 560,
    delay: animeApi.stagger ? animeApi.stagger(36) : 0,
    ease: "outExpo"
  });
  playAnime(".hero-kana-burst span, .rb-kana-rain span", {
    opacity: { from: 0 },
    y: { from: "1rem" },
    rotate: { from: -6 },
    duration: 620,
    delay: animeApi.stagger ? animeApi.stagger(28, { from: "center" }) : 0,
    ease: "outBack"
  });
  playAnime(".brand-mark, .hero-crest", {
    scale: { from: .82 },
    duration: 660,
    ease: "outBack"
  });
  playAnime(".progress-fill", {
    scaleX: { from: 0 },
    duration: 720,
    delay: 80,
    ease: "outExpo"
  });
  playAnime(".quiz-opt.correct, .quiz-opt.wrong, .feedback-badge, .end-score", {
    scale: { from: .88 },
    duration: 480,
    ease: "outBack"
  });
}
