(function(){
  "use strict";

  var motion = window.Motion;
  if(!motion) return;

  var enhanced = new WeakSet();
  var revealed = new WeakSet();
  var cleanups = [];
  var observer = null;
  var enhanceFrame = null;
  var entranceFrame = null;
  var entranceRevision = 0;
  var interactiveSelector = [
    ".btn",
    ".chip",
    ".nav-btn",
    ".tool-card",
    ".mode-card",
    ".level-tile",
    ".quiz-opt",
    ".rate-btn",
    ".kana-hub-card",
    ".guide-card",
    ".ach-card"
  ].join(",");
  var revealSelector = ".section-head, .row-group, .guide-card, .ach-card";

  function reducedMotion(){
    return Boolean(
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function safe(run){
    try{
      return run();
    }catch(err){
      return null;
    }
  }

  function addCleanup(cleanup){
    if(typeof cleanup === "function"){
      cleanups.push(cleanup);
    }
  }

  function stopInteractionCleanups(){
    cleanups.forEach(function(cleanup){
      safe(cleanup);
    });
    cleanups = [];
  }

  function pulse(el, state){
    if(state === "hover"){
      return motion.animate(el, { scale: 1.025, y: -2 }, {
        type: "spring",
        stiffness: 430,
        damping: 26
      });
    }

    return motion.animate(el, { scale: 1, y: 0 }, {
      type: "spring",
      stiffness: 420,
      damping: 30
    });
  }

  function enhanceInteractiveElement(el){
    if(enhanced.has(el)) return;
    enhanced.add(el);

    if(motion.hover){
      addCleanup(motion.hover(el, function(target){
        pulse(target, "hover");
        return function(){
          pulse(target, "rest");
        };
      }));
    }

    if(motion.press){
      addCleanup(motion.press(el, function(target){
        motion.animate(target, { scale: 0.975 }, { duration: 0.08, ease: "easeOut" });
        return function(){
          motion.animate(target, { scale: 1 }, {
            type: "spring",
            stiffness: 520,
            damping: 24
          });
        };
      }));
    }
  }

  function runEntrancePass(){
    var revision = entranceRevision + 1;
    entranceRevision = revision;

    safe(function(){
      motion.animate(".grind-hero", { opacity: [0, 1], y: [10, 0] }, {
        duration: 0.45,
        ease: "easeOut"
      });
    });

    safe(function(){
      motion.animate(".hero-kana-burst span", { opacity: [0, 1], y: [12, 0], scale: [0.9, 1] }, {
        delay: motion.stagger ? motion.stagger(0.025) : 0,
        duration: 0.42,
        ease: "backOut"
      });
    });

    safe(function(){
      motion.animate(".hud-chip, .mode-card, .tool-card", { opacity: [0, 1], y: [8, 0] }, {
        delay: motion.stagger ? motion.stagger(0.035) : 0,
        duration: 0.35,
        ease: "easeOut"
      });
    });

    window.setTimeout(function(){
      if(revision === entranceRevision){
        document.documentElement.classList.add("motion-ready");
      }
    }, 500);
  }

  function wireScrollEntrances(){
    if(!motion.inView || typeof IntersectionObserver === "undefined") return;

    document.querySelectorAll(revealSelector).forEach(function(el){
      if(revealed.has(el)) return;
      revealed.add(el);

      addCleanup(motion.inView(el, function(target){
        motion.animate(target, { opacity: [0, 1], y: [14, 0] }, {
          duration: 0.38,
          ease: "easeOut"
        });
      }, {
        amount: 0.18,
        margin: "0px 0px -12% 0px"
      }));
    });
  }

  function enhanceCurrentDom(){
    if(reducedMotion()) return;

    safe(function(){
      document.querySelectorAll(interactiveSelector).forEach(enhanceInteractiveElement);
    });

    safe(wireScrollEntrances);
  }

  function scheduleEnhance(){
    if(enhanceFrame) return;
    enhanceFrame = window.requestAnimationFrame(function(){
      enhanceFrame = null;
      enhanceCurrentDom();
    });
  }

  function scheduleEntrance(){
    if(entranceFrame) return;
    entranceFrame = window.requestAnimationFrame(function(){
      entranceFrame = null;
      if(!reducedMotion()){
        document.documentElement.classList.add("has-motion-dev");
        runEntrancePass();
      }
    });
  }

  function observeApp(){
    var app = document.getElementById("app");
    if(!app || typeof MutationObserver === "undefined") return;

    observer = new MutationObserver(function(){
      if(reducedMotion()) return;
      scheduleEnhance();
      scheduleEntrance();
    });

    observer.observe(app, {
      childList: true,
      subtree: true
    });
  }

  function boot(){
    if(reducedMotion()) return;

    document.documentElement.classList.add("has-motion-dev");
    scheduleEntrance();
    enhanceCurrentDom();
    wireScrollEntrances();
    observeApp();

    window.addEventListener("pagehide", function(){
      stopInteractionCleanups();
      if(observer) observer.disconnect();
    }, { once: true });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  }else{
    boot();
  }
}());
