import { DATA, LEVELS, LEVEL_META, CAT_LABEL, CAT_LABEL_SING, KANA_ROWS, KANA_GROUPS, KANA, BUILDER_PATTERNS } from "../../../shared/content.js";
import { checkPhrase, getProgress, saveProgress as saveProgressSnapshot } from "./api.js";
import { loadAnime, runScreenAnimations } from "./core/animation.js";
import { esc, ringSVG } from "./core/html.js";
import { kanaGrindHeroHTML, kanaHubCardHTML } from "./features/kana-ui.js";

(function(){
  "use strict";

  // ================= storage =================
  var PROGRESS_KEY = "maru-progress-v1";
  var STREAK_KEY = "maru-streak-v1";
  var XP_KEY = "maru-xp-v1";
  var STATS_KEY = "maru-stats-v1";
  var KANA_KEY = "maru-kana-v1";
  var DAY = 86400000;
  var MASTER_THRESHOLD = 21;
  var KANA_MASTER_STREAK = 3;

  function safeGet(key){
    try{ var v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch(e){ return null; }
  }
  function safeSet(key, val){
    try{ localStorage.setItem(key, JSON.stringify(val)); }
    catch(e){ /* storage unavailable: progress just won't persist */ }
  }

  var progress = safeGet(PROGRESS_KEY) || safeGet("nihongo-dojo-progress-v1") || {};
  var streak = safeGet(STREAK_KEY) || safeGet("nihongo-dojo-streak-v1") || {count:0, lastDate:""};
  var xp = safeGet(XP_KEY) || safeGet("nihongo-dojo-xp-v1") || {total:0};
  var stats = safeGet(STATS_KEY) || safeGet("nihongo-dojo-stats-v1") || {sentencesWritten:0, focusSessions:0};
  var kanaStats = safeGet(KANA_KEY) || safeGet("nihongo-dojo-kana-v1") || {};
  var serverSaveTimer = null;

  function progressSnapshot(){
    return {
      progress: progress,
      streak: streak,
      xp: xp,
      stats: stats,
      kanaStats: kanaStats
    };
  }

  function persistLocalSnapshot(){
    safeSet(PROGRESS_KEY, progress);
    safeSet(STREAK_KEY, streak);
    safeSet(XP_KEY, xp);
    safeSet(STATS_KEY, stats);
    safeSet(KANA_KEY, kanaStats);
  }

  function scheduleServerSave(){
    if(serverSaveTimer && window.clearTimeout) window.clearTimeout(serverSaveTimer);
    if(!window.setTimeout) return;
    serverSaveTimer = window.setTimeout(function(){
      saveProgressSnapshot(progressSnapshot()).catch(function(){});
    }, 250);
  }

  function applyServerSnapshot(snapshot){
    if(!snapshot || typeof snapshot !== "object") return;
    progress = Object.assign({}, progress, snapshot.progress || {});
    kanaStats = Object.assign({}, kanaStats, snapshot.kanaStats || {});
    if(snapshot.streak && Number(snapshot.streak.count || 0) >= Number(streak.count || 0)) streak = snapshot.streak;
    if(snapshot.xp && Number(snapshot.xp.total || 0) >= Number(xp.total || 0)) xp = snapshot.xp;
    if(snapshot.stats){
      stats = {
        sentencesWritten: Math.max(Number(stats.sentencesWritten) || 0, Number(snapshot.stats.sentencesWritten) || 0),
        focusSessions: Math.max(Number(stats.focusSessions) || 0, Number(snapshot.stats.focusSessions) || 0)
      };
    }
    persistLocalSnapshot();
    render();
  }

  function hydrateFromServer(){
    getProgress().then(applyServerSnapshot).catch(function(){});
  }

  function saveProgress(){ safeSet(PROGRESS_KEY, progress); scheduleServerSave(); }
  function saveStreak(){ safeSet(STREAK_KEY, streak); scheduleServerSave(); }
  function saveXP(){ safeSet(XP_KEY, xp); scheduleServerSave(); }
  function saveStats(){ safeSet(STATS_KEY, stats); scheduleServerSave(); }
  function saveKanaStats(){ safeSet(KANA_KEY, kanaStats); scheduleServerSave(); }

  function todayStr(d){ return new Date(d).toISOString().slice(0,10); }

  function touchStreak(){
    var t = todayStr(Date.now());
    if(streak.lastDate === t) return;
    var y = todayStr(Date.now() - DAY);
    streak.count = (streak.lastDate === y) ? streak.count + 1 : 1;
    streak.lastDate = t;
    saveStreak();
  }

  function addXP(n){
    xp.total += n;
    saveXP();
  }

  // ================= JLPT SRS =================
  function isDue(card){
    var p = progress[card.id];
    return !p || p.due <= Date.now();
  }
  function isMastered(card){
    var p = progress[card.id];
    return !!p && p.interval >= MASTER_THRESHOLD;
  }

  function computeNext(p, rating){
    var np = {ef:p.ef, interval:p.interval, reps:p.reps, due:p.due};
    if(rating === 0){
      np.reps = 0; np.interval = 0;
      np.ef = Math.max(1.3, np.ef - 0.2);
      np.due = Date.now() + 10*60000;
      return np;
    }
    if(rating === 1) np.ef = Math.max(1.3, np.ef - 0.15);
    if(rating === 3) np.ef = np.ef + 0.15;
    if(np.reps === 0){ np.interval = rating===1 ? 1 : (rating===3 ? 2 : 1); }
    else if(np.reps === 1){ np.interval = rating===1 ? 2 : (rating===3 ? 6 : 3); }
    else{
      var mult = rating===1 ? 1.2 : (rating===3 ? np.ef*1.3 : np.ef);
      np.interval = Math.max(1, Math.round(np.interval * mult));
    }
    np.reps += 1;
    np.due = Date.now() + np.interval*DAY;
    return np;
  }

  function fmtInterval(days){
    if(days < 1) return "10 min";
    if(days === 1) return "amanhã";
    if(days < 30) return days + " dias";
    return Math.round(days/30) + " meses";
  }

  function ratePreview(cardId, rating){
    var p = progress[cardId] || {ef:2.5, interval:0, reps:0, due:0};
    var np = computeNext(p, rating);
    return fmtInterval(np.interval || (10/1440));
  }

  function rateCard(cardId, rating){
    var p = progress[cardId] || {ef:2.5, interval:0, reps:0, due:0};
    progress[cardId] = computeNext(p, rating);
    saveProgress();
    touchStreak();
  }

  var FLASH_XP = [2,5,8,12];
  var DRAW_XP = [3,6,10,14];

  // ================= kana mistake tracking =================
  function rateKana(id, correct){
    var s = kanaStats[id] || {attempts:0, wrong:0, streak:0};
    s.attempts += 1;
    if(correct){ s.streak += 1; } else { s.streak = 0; s.wrong += 1; }
    kanaStats[id] = s;
    saveKanaStats();
    touchStreak();
  }
  function kanaIsMastered(k){
    var s = kanaStats[k.id];
    return !!s && s.streak >= KANA_MASTER_STREAK;
  }
  function kanaMasteredCount(script){
    return KANA.filter(function(k){ return k.script===script && kanaIsMastered(k); }).length;
  }
  function kanaPool(){
    var sel = state.kanaSel;
    return KANA.filter(function(k){
      if(sel.script !== "both" && k.script !== sel.script) return false;
      return sel.rows.indexOf(k.row) !== -1;
    });
  }

  // ================= belts / xp =================
  var BELTS = [
    {name:"Faixa Branca",  min:0,    color:"#f0ead8"},
    {name:"Faixa Amarela", min:150,  color:"#e0b13c"},
    {name:"Faixa Laranja", min:400,  color:"#d17f2c"},
    {name:"Faixa Verde",   min:800,  color:"#4f7a3d"},
    {name:"Faixa Azul",    min:1400, color:"#2f5aa8"},
    {name:"Faixa Roxa",    min:2200, color:"#7a4f9e"},
    {name:"Faixa Marrom",  min:3200, color:"#6b4a35"},
    {name:"Faixa Preta",   min:4500, color:"#2a2521"}
  ];
  function beltFor(total){
    var cur = BELTS[0];
    for(var i=0;i<BELTS.length;i++){ if(total>=BELTS[i].min) cur = BELTS[i]; }
    return cur;
  }
  function beltProgress(){
    var b = beltFor(xp.total);
    var idx = BELTS.indexOf(b);
    var next = BELTS[idx+1] || null;
    if(!next) return {belt:b, next:null, pct:100};
    var span = next.min - b.min;
    var into = xp.total - b.min;
    return {belt:b, next:next, pct:Math.round(into/span*100)};
  }

  var ACHIEVEMENTS = [
    {id:"first",     name:"Primeiro Treino",     desc:"Complete sua primeira atividade no Maru.", test:function(){ return xp.total > 0; }},
    {id:"streak7",   name:"Uma Semana no Maru",  desc:"7 dias seguidos de prática.", test:function(){ return streak.count >= 7; }},
    {id:"streak30",  name:"Um Mês no Maru",      desc:"30 dias seguidos de prática.", test:function(){ return streak.count >= 30; }},
    {id:"blackbelt", name:"Faixa Preta",         desc:"Alcance 4500 XP no total.", test:function(){ return xp.total >= 4500; }},
    {id:"hiragana",  name:"Mestre do Hiragana",  desc:"Domine os 71 hiragana (3 acertos seguidos cada).", test:function(){ return kanaMasteredCount("hiragana") === 71; }},
    {id:"katakana",  name:"Mestre do Katakana",  desc:"Domine os 71 katakana (3 acertos seguidos cada).", test:function(){ return kanaMasteredCount("katakana") === 71; }},
    {id:"hunter",    name:"Caçador de Erros",    desc:"Complete 5 sessões focadas nos seus erros.", test:function(){ return stats.focusSessions >= 5; }},
    {id:"writer",    name:"Escritor Dedicado",   desc:"Escreva 10 frases em japonês.", test:function(){ return stats.sentencesWritten >= 10; }}
  ];

  // ================= helpers =================
  function shuffle(arr){
    var a = arr.slice();
    for(var i=a.length-1; i>0; i--){
      var j = Math.floor(Math.random()*(i+1));
      var t = a[i]; a[i]=a[j]; a[j]=t;
    }
    return a;
  }

  function cardsFor(level, cat){
    return DATA.filter(function(c){
      return c.level === level && (cat === "all" || c.cat === cat);
    });
  }

  // ---------------- state ----------------
  var state = {
    view: "dashboard",
    level: null,
    cat: "all",
    kanaSel: {script:"hiragana", rows: KANA_ROWS.map(function(r){return r.id;}), focus:false},
    session: null,
    builder: {pattern:"identity", slots:{}, copied:false}
  };

  var app = document.getElementById("app");

  function go(view, patch){
    state.view = view;
    Object.assign(state, patch || {});
    render();
    window.scrollTo({top:0, behavior:"auto"});
  }

  // ---------------- header ----------------
  function headerHTML(){
    var bp = beltProgress();
    return (
      '<header class="app-header">' +
        '<button class="brand" data-action="go-dashboard">' +
          '<span class="brand-mark"><img src="./assets/img/maru-crest.svg" alt=""></span>' +
          '<span class="brand-copy">' +
            '<span class="brand-jp jp">まる</span>' +
            '<span class="brand-en">Maru</span>' +
          '</span>' +
        '</button>' +
        '<nav class="header-nav" aria-label="Navegação principal">' +
          '<button class="nav-btn" data-action="go-kana-hub">Arena Kana</button>' +
          '<button class="nav-btn" data-action="go-builder">Frases</button>' +
          '<button class="nav-btn" data-action="go-guides">Guias</button>' +
        '</nav>' +
        '<div class="header-stats">' +
          '<button class="belt-chip" data-action="go-profile" style="--belt-color:'+bp.belt.color+'"><span class="belt-dot"></span><b>'+bp.belt.name+'</b></button>' +
          '<div class="streak"><b>'+streak.count+'</b> dia'+(streak.count===1?'':'s')+' seguido'+(streak.count===1?'':'s')+'</div>' +
        '</div>' +
      '</header>'
    );
  }

  // ---------------- dashboard ----------------
  function xpCardHTML(){
    var bp = beltProgress();
    return '<div class="xp-card">' +
      '<div class="xp-card-head">' +
        '<div><span class="belt-dot lg" style="--belt-color:'+bp.belt.color+'"></span><b class="jp">'+bp.belt.name+'</b></div>' +
        '<span class="xp-total">'+xp.total+' XP</span>' +
      '</div>' +
      '<div class="progress-track"><div class="progress-fill" style="width:'+(bp.next?bp.pct:100)+'%"></div></div>' +
      '<p class="xp-note">'+(bp.next ? (bp.next.min - xp.total)+' XP para '+bp.next.name : 'Você alcançou o topo do Maru!')+'</p>' +
    '</div>';
  }

  function kanaPctFor(script){
    var pool = KANA.filter(function(k){ return k.script===script; });
    var mastered = pool.filter(kanaIsMastered).length;
    return Math.round(mastered/pool.length*100);
  }

  function dailyPlanHTML(){
    return '<aside class="daily-plan">' +
      '<div class="daily-plan-head"><h2>Missões de grind</h2><span class="quest-reward">+40 XP</span></div>' +
      '<ul class="quest-list">' +
        '<li><span class="quest-check">1</span><span>15 reconhecimentos sem quebrar combo</span><span class="quest-xp">+12 XP</span></li>' +
        '<li><span class="quest-check">2</span><span>10 caracteres desenhados no grid</span><span class="quest-xp">+10 XP</span></li>' +
        '<li><span class="quest-check">3</span><span>Repetir os 5 kana mais errados</span><span class="quest-xp">+10 XP</span></li>' +
        '<li><span class="quest-check">4</span><span>Trocar script e manter o ritmo</span><span class="quest-xp">+8 XP</span></li>' +
      '</ul>' +
    '</aside>';
  }

  function dashboardToolsHTML(){
    return '<div class="section-head">' +
      '<div><p class="eyebrow">Modos rápidos</p><h2 class="page-title" style="font-size:1.25rem;">Grind em blocos curtos</h2></div>' +
      '<p>Reconheça, escreva, foque nos erros e suba XP sem sair do fluxo.</p>' +
    '</div>' +
    '<div class="tool-grid">' +
      '<button class="tool-card" data-action="start-kana-session" data-mode="recognize" data-reward="+6 XP">' +
        '<span class="tool-symbol jp">あ</span>' +
        '<span><strong>Reconhecimento</strong><p>Veja o kana e responda a leitura correta antes de perder o ritmo.</p></span>' +
      '</button>' +
      '<button class="tool-card" data-action="start-kana-session" data-mode="draw" data-reward="+8 XP">' +
        '<span class="tool-symbol jp">書</span>' +
        '<span><strong>Escrita no grid</strong><p>Desenhe com guia opcional, compare com o modelo e marque acerto.</p></span>' +
      '</button>' +
      '<button class="tool-card" data-action="go-kana-hub" data-reward="Setup">' +
        '<span class="tool-symbol jp">段</span>' +
        '<span><strong>Setup de fileiras</strong><p>Monte seu pool por linha, script ou lista de erros acumulados.</p></span>' +
      '</button>' +
    '</div>';
  }

  function renderDashboard(){
    var totalDue = 0, totalMastered = 0, totalCards = DATA.length;
    var tiles = LEVELS.map(function(lvl, i){
      var cards = cardsFor(lvl, "all");
      var due = cards.filter(isDue).length;
      var mastered = cards.filter(isMastered).length;
      totalDue += due; totalMastered += mastered;
      var pct = Math.round(mastered / cards.length * 100);
      return (
        '<button class="level-tile" style="--step:'+i+'" data-action="open-level" data-level="'+lvl+'">' +
          '<div class="level-top"><span class="level-num jp">'+lvl+'</span><span class="rank-chip">Fase '+(i+1)+'</span></div>' +
          '<span class="level-name">'+LEVEL_META[lvl].name+'</span>' +
          '<p class="level-desc">'+LEVEL_META[lvl].desc+'</p>' +
          '<div class="level-tile-foot">' +
            ringSVG(pct) +
            '<span class="due-badge '+(due>0?'has-due':'clear')+'">'+(due>0? due+' para revisar' : 'Tudo em dia')+'</span>' +
          '</div>' +
        '</button>'
      );
    }).join("");

    app.innerHTML =
      headerHTML() +
      '<div class="dashboard-lead">' +
        kanaGrindHeroHTML({
          state: state,
          kanaPool: kanaPool,
          kanaStats: kanaStats,
          kanaIsMastered: kanaIsMastered,
          kanaPctFor: kanaPctFor
        }) +
        dailyPlanHTML() +
      '</div>' +
      xpCardHTML() +
      dashboardToolsHTML() +
      kanaHubCardHTML({ kanaPctFor: kanaPctFor }) +
      '<div class="section-head">' +
        '<div><p class="eyebrow">Depois do kana</p><h2 class="page-title" style="font-size:1.25rem;">JLPT como modo extra</h2></div>' +
        '<p>Quando o kana estiver fluindo, use os cartões para vocabulário, kanji e estruturas básicas.</p>' +
      '</div>' +
      '<div class="level-grid">' + tiles + '</div>' +
      '<p class="foot-note">Seu progresso é salvo automaticamente neste navegador.</p>';
  }

  // ---------------- level detail ----------------
  function renderLevel(){
    var lvl = state.level;
    var cat = state.cat;
    var pool = cardsFor(lvl, cat);
    var due = pool.filter(isDue).length;
    var mastered = pool.filter(isMastered).length;
    var drawablePool = pool.filter(function(c){ return c.cat !== "grammar"; });
    var phrasePool = pool.filter(function(c){ return c.cat !== "kanji"; });

    var chips = ["all","vocab","kanji","grammar"].map(function(c){
      return '<button class="chip '+(cat===c?'is-active':'')+'" data-action="set-cat" data-cat="'+c+'">'+CAT_LABEL[c]+'</button>';
    }).join("");

    app.innerHTML =
      headerHTML() +
      '<button class="back-link" data-action="go-dashboard">&larr; Painel</button>' +
      '<p class="eyebrow">Nível '+lvl+'</p>' +
      '<h1 class="page-title jp">'+lvl+' &middot; '+LEVEL_META[lvl].name+'</h1>' +
      '<p class="page-sub">'+LEVEL_META[lvl].desc+'</p>' +
      '<div class="chip-row">'+chips+'</div>' +
      '<div class="stat-row">' +
        '<div class="summary-item"><b>'+pool.length+'</b>cartões</div>' +
        '<div class="summary-item"><b>'+due+'</b>para revisar</div>' +
        '<div class="summary-item"><b>'+mastered+'</b>dominados</div>' +
      '</div>' +
      (pool.length === 0 ? '<div class="empty-state"><p>Nenhum cartão nesta categoria ainda.</p></div>' :
      '<div class="mode-grid">' +
        '<button class="mode-card flash" data-action="start-session" data-mode="flash">' +
          '<span class="mode-mark"></span><h3>Flashcards</h3><p>Vire o cartão, teste sua memória e avalie o quanto lembrou.</p>' +
        '</button>' +
        '<button class="mode-card quiz" data-action="start-session" data-mode="quiz">' +
          '<span class="mode-mark"></span><h3>Quiz</h3><p>Escolha o significado certo entre 4 alternativas.</p>' +
        '</button>' +
        (drawablePool.length ? (
        '<button class="mode-card draw" data-action="start-session" data-mode="draw">' +
          '<span class="mode-mark"></span><h3>Escrever</h3><p>Desenhe o kanji ou a palavra e compare com o modelo.</p>' +
        '</button>') : '') +
        (phrasePool.length ? (
        '<button class="mode-card phrase" data-action="start-session" data-mode="phrase">' +
          '<span class="mode-mark"></span><h3>Frases</h3><p>Escreva uma frase original usando a palavra ou estrutura.</p>' +
        '</button>') : '') +
      '</div>');
  }

  // ---------------- sentence builder ----------------
  function builderPattern(){
    return BUILDER_PATTERNS.filter(function(p){ return p.id === state.builder.pattern; })[0] || BUILDER_PATTERNS[0];
  }

  function ensureBuilderDefaults(pattern){
    pattern.slots.forEach(function(slot){
      if(!state.builder.slots[slot.key]){
        state.builder.slots[slot.key] = slot.options[0].jp;
      }
    });
  }

  function selectedBuilderSlot(pattern, slot){
    ensureBuilderDefaults(pattern);
    var selected = state.builder.slots[slot.key];
    return slot.options.filter(function(opt){ return opt.jp === selected; })[0] || slot.options[0];
  }

  function sentenceFromPattern(pattern){
    ensureBuilderDefaults(pattern);
    var values = {};
    pattern.slots.forEach(function(slot){ values[slot.key] = selectedBuilderSlot(pattern, slot); });
    if(pattern.id === "identity"){
      return {
        jp: values.topic.jp + "は" + values.predicate.jp + "です。",
        reading: values.topic.reading + "は" + values.predicate.reading + "です。",
        meaning: "Tópico: " + values.topic.pt + ". Comentário: " + values.predicate.pt + "."
      };
    }
    if(pattern.id === "like"){
      return {
        jp: values.topic.jp + "は" + values.object.jp + "が好きです。",
        reading: values.topic.reading + "は" + values.object.reading + "がすきです。",
        meaning: "Tópico: " + values.topic.pt + ". Preferência: " + values.object.pt + "."
      };
    }
    if(pattern.id === "action"){
      return {
        jp: values.topic.jp + "は" + values.action.jp + "。",
        reading: values.topic.reading + "は" + values.action.reading + "。",
        meaning: "Tópico: " + values.topic.pt + ". Ação: " + values.action.pt + "."
      };
    }
    if(pattern.id === "destination"){
      return {
        jp: values.topic.jp + "は" + values.movement.jp + "。",
        reading: values.topic.reading + "は" + values.movement.reading + "。",
        meaning: "Tópico: " + values.topic.pt + ". Movimento: " + values.movement.pt + "."
      };
    }
    return {
      jp: values.request.jp + "ください。",
      reading: values.request.reading + "ください。",
      meaning: "Pedido educado: por favor, " + values.request.pt + "."
    };
  }

  function builderPatternsHTML(pattern){
    return BUILDER_PATTERNS.map(function(p){
      return '<button class="pattern-btn '+(p.id===pattern.id?'is-active':'')+'" data-action="set-builder-pattern" data-pattern="'+p.id+'">' +
        '<b>'+esc(p.title)+'</b><span>'+esc(p.level)+' · '+esc(p.formula)+'</span>' +
      '</button>';
    }).join("");
  }

  function builderSlotsHTML(pattern){
    ensureBuilderDefaults(pattern);
    return pattern.slots.map(function(slot){
      var options = slot.options.map(function(opt){
        var active = selectedBuilderSlot(pattern, slot).jp === opt.jp;
        return '<button class="slot-option '+(active?'is-active':'')+'" data-action="set-builder-slot" data-slot="'+slot.key+'" data-value="'+esc(opt.jp)+'">' +
          '<span class="jp">'+esc(opt.jp)+'</span> · '+esc(opt.pt) +
        '</button>';
      }).join("");
      return '<div class="slot-group">' +
        '<span class="slot-label">'+esc(slot.label)+'</span>' +
        '<div class="slot-options">'+options+'</div>' +
      '</div>';
    }).join("");
  }

  function particlePocketHTML(){
    return '<div class="particle-table">' +
      '<div class="particle-cell"><b class="jp">は</b><span>tópico, assunto da frase</span></div>' +
      '<div class="particle-cell"><b class="jp">が</b><span>sujeito, foco ou informação nova</span></div>' +
      '<div class="particle-cell"><b class="jp">を</b><span>alvo direto da ação</span></div>' +
      '<div class="particle-cell"><b class="jp">に</b><span>tempo, destino, localização precisa</span></div>' +
      '<div class="particle-cell"><b class="jp">へ</b><span>direção, movimento</span></div>' +
      '<div class="particle-cell"><b class="jp">で</b><span>lugar da ação ou meio usado</span></div>' +
      '<div class="particle-cell"><b class="jp">と</b><span>com alguém ou ligação entre itens</span></div>' +
      '<div class="particle-cell"><b class="jp">の</b><span>posse, relação ou descrição</span></div>' +
    '</div>';
  }

  function renderBuilder(){
    var pattern = builderPattern();
    var built = sentenceFromPattern(pattern);
    app.innerHTML =
      headerHTML() +
      '<button class="back-link" data-action="go-dashboard">&larr; Painel</button>' +
      '<p class="eyebrow">Construir frases</p>' +
      '<h1 class="page-title">Monte frases japonesas por padrão.</h1>' +
      '<p class="page-sub">Escolha um modelo, troque as partes e observe como as partículas amarram a frase. Comece curto; naturalidade vem com repetição.</p>' +
      '<div class="builder-layout">' +
        '<section class="builder-panel">' +
          '<p class="eyebrow">Padrão</p>' +
          '<div class="pattern-list">'+builderPatternsHTML(pattern)+'</div>' +
          builderSlotsHTML(pattern) +
        '</section>' +
        '<section class="builder-output">' +
          '<p class="eyebrow">'+esc(pattern.level)+' · '+esc(pattern.formula)+'</p>' +
          '<div class="sentence-display jp">'+esc(built.jp)+'</div>' +
          '<p class="reading-line">'+esc(built.reading)+'</p>' +
          '<p class="meaning-line">'+esc(built.meaning)+'</p>' +
          '<div class="builder-notes">' +
            '<b>Guia rápido</b>' +
            '<p>'+esc(pattern.guide)+'</p>' +
          '</div>' +
          '<div class="builder-actions">' +
            '<button class="btn" data-action="copy-builder">'+(state.builder.copied?'Copiado':'Copiar frase')+'</button>' +
            '<button class="btn ghost" data-action="go-guides">Ver partículas</button>' +
          '</div>' +
        '</section>' +
      '</div>' +
      '<div class="section-head">' +
        '<div><p class="eyebrow">Partículas</p><h2 class="page-title" style="font-size:1.25rem;">Bolso de consulta</h2></div>' +
      '</div>' +
      particlePocketHTML();
  }

  function copyBuilderSentence(){
    var built = sentenceFromPattern(builderPattern());
    state.builder.copied = true;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(built.jp).catch(function(){});
    }
    render();
    window.setTimeout(function(){
      state.builder.copied = false;
      if(state.view === "builder") render();
    }, 1200);
  }

  function renderGuides(){
    app.innerHTML =
      headerHTML() +
      '<button class="back-link" data-action="go-dashboard">&larr; Painel</button>' +
      '<p class="eyebrow">Ajuda e guias</p>' +
      '<h1 class="page-title">Guias curtos para estudar japonês sem pular etapas.</h1>' +
      '<p class="page-sub">Use estes roteiros como apoio antes ou depois dos treinos. Eles cobrem escrita, frase, revisão e ordem de estudo.</p>' +
      '<div class="guide-layout">' +
        '<article class="guide-card">' +
          '<h2>Ordem de estudo</h2>' +
          '<ol>' +
            '<li>Hiragana até reconhecer e escrever sem olhar.</li>' +
            '<li>Katakana para palavras estrangeiras e nomes.</li>' +
            '<li>N5 com frases curtas, partículas e verbos polidos.</li>' +
            '<li>Kanji sempre com palavra e exemplo, não isolado.</li>' +
          '</ol>' +
          '<div class="guide-actions"><button class="btn ghost" data-action="go-kana-hub">Treinar kana</button></div>' +
        '</article>' +
        '<article class="guide-card">' +
          '<h2>Escrita</h2>' +
          '<ul>' +
            '<li>Em geral, escreva de cima para baixo e da esquerda para a direita.</li>' +
            '<li>Traços horizontais costumam vir antes dos verticais.</li>' +
            '<li>Caixas externas aparecem antes do conteúdo, e fecham no fim.</li>' +
            '<li>Compare proporção, direção do traço e espaço vazio.</li>' +
          '</ul>' +
          '<div class="guide-actions"><button class="btn ghost" data-action="go-kana-hub">Abrir escrita</button></div>' +
        '</article>' +
        '<article class="guide-card">' +
          '<h2>Frases</h2>' +
          '<ul>' +
            '<li>A estrutura base é tópico + comentário, com verbo no final.</li>' +
            '<li>Partículas não traduzem palavra por palavra; elas mostram função.</li>' +
            '<li>Uma boa frase iniciante tem uma ideia clara e poucos elementos.</li>' +
            '<li>Depois de montar, leia em voz baixa e troque uma parte.</li>' +
          '</ul>' +
          '<div class="guide-actions"><button class="btn ghost" data-action="go-builder">Construir frase</button></div>' +
        '</article>' +
        '<article class="guide-card">' +
          '<h2>Revisão</h2>' +
          '<ul>' +
            '<li>Errou: revise logo e escreva um exemplo próprio.</li>' +
            '<li>Acertou com esforço: mantenha na fila de amanhã.</li>' +
            '<li>Acertou fácil: aumente o intervalo e use em frase.</li>' +
            '<li>Não avance nível se o kana ainda estiver lento.</li>' +
          '</ul>' +
          '<div class="guide-actions"><button class="btn ghost" data-action="open-level" data-level="N5">Começar N5</button></div>' +
        '</article>' +
        '<article class="guide-card wide-guide">' +
          '<h2>Partículas essenciais</h2>' +
          '<p>Quando travar, identifique primeiro o tópico, depois o alvo da ação, o lugar, o tempo e por fim o verbo.</p>' +
          particlePocketHTML() +
        '</article>' +
      '</div>';
  }

  // ---------------- session queues (JLPT) ----------------
  function buildQueue(lvl, cat, mode){
    var pool = cardsFor(lvl, cat);
    var due = shuffle(pool.filter(isDue));
    var cap = mode === "flash" ? 20 : 10;
    if(due.length >= (mode==="flash"?1:4)){
      return due.slice(0, cap);
    }
    return shuffle(pool).slice(0, Math.min(cap, pool.length));
  }
  function buildDrawQueue(lvl, cat){
    var pool = cardsFor(lvl, cat).filter(function(c){ return c.cat !== "grammar"; });
    var due = shuffle(pool.filter(isDue));
    if(due.length >= 1) return due.slice(0,20);
    return shuffle(pool).slice(0, Math.min(20,pool.length));
  }
  function buildPhraseQueue(lvl, cat){
    var pool = cardsFor(lvl, cat).filter(function(c){ return c.cat !== "kanji"; });
    var due = shuffle(pool.filter(isDue));
    return (due.length >= 1 ? due : shuffle(pool)).slice(0,8);
  }

  function newSession(extra){
    return Object.assign({index:0, flipped:false, showGuide:false, score:0, combo:0, maxCombo:0, quizLocked:false, quizChoices:null, quizSelected:null}, extra);
  }

  function startSession(mode){
    if(mode === "phrase"){
      var pq = buildPhraseQueue(state.level, state.cat);
      if(pq.length === 0) return;
      state.session = {mode:"phrase", kind:"jlpt", queue:pq, index:0, checking:false, feedback:null, draft:""};
      go("phrase");
      return;
    }
    var queue = mode === "draw" ? buildDrawQueue(state.level, state.cat) : buildQueue(state.level, state.cat, mode);
    if(queue.length === 0) return;
    state.session = newSession({mode:mode, kind:"jlpt", queue:queue});
    go(mode === "flash" ? "study" : (mode === "quiz" ? "quiz" : "draw"));
  }

  // ---------------- flashcards ----------------
  function renderStudy(){
    var s = state.session;
    var card = s.queue[s.index];
    app.innerHTML =
      headerHTML() +
      '<button class="back-link" data-action="open-level" data-level="'+state.level+'">&larr; '+state.level+'</button>' +
      '<div class="session-bar">' +
        '<span>Cartão '+(s.index+1)+' de '+s.queue.length+'</span>' +
        '<div class="progress-track"><div class="progress-fill" style="width:'+Math.round((s.index)/s.queue.length*100)+'%"></div></div>' +
        '<span>'+CAT_LABEL_SING[card.cat]+'</span>' +
      '</div>' +
      '<div class="flip-stage">' +
        '<div class="flip-card '+(s.flipped?'is-flipped':'')+'" data-action="flip-card" role="button" tabindex="0">' +
          '<div class="flip-face flip-front">' +
            '<span class="tag">'+state.level+' &middot; '+CAT_LABEL_SING[card.cat]+'</span>' +
            '<div class="term jp">'+esc(card.term)+'</div>' +
            '<span class="hint">Toque para virar</span>' +
          '</div>' +
          '<div class="flip-face flip-back">' +
            '<span class="back-label">'+(card.cat==="grammar"?"Formação":"Leitura")+'</span>' +
            '<div class="reading">'+esc(card.reading)+'</div>' +
            '<div class="meaning">'+esc(card.meaning)+'</div>' +
            '<div class="example">' +
              '<p class="ex-jp jp">'+esc(card.example)+'</p>' +
              '<p class="ex-pt">'+esc(card.exampleReading)+' - '+esc(card.exampleMeaning)+'</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      (s.flipped ? rateRowHTML(card.id) : '<p style="text-align:center;color:var(--ink-soft);font-size:.82rem;">Vire o cartão para avaliar sua resposta</p>');
  }

  function rateRowHTML(cardId, action){
    action = action || "rate";
    return '<div class="rate-row">' +
      '<button class="rate-btn again" data-action="'+action+'" data-rating="0" style="--tilt:-1deg"><span class="rate-label">Errei</span><span class="rate-when">'+ratePreview(cardId,0)+'</span></button>' +
      '<button class="rate-btn hard" data-action="'+action+'" data-rating="1" style="--tilt:1deg"><span class="rate-label">Difícil</span><span class="rate-when">'+ratePreview(cardId,1)+'</span></button>' +
      '<button class="rate-btn good" data-action="'+action+'" data-rating="2" style="--tilt:-1deg"><span class="rate-label">Bom</span><span class="rate-when">'+ratePreview(cardId,2)+'</span></button>' +
      '<button class="rate-btn easy" data-action="'+action+'" data-rating="3" style="--tilt:1deg"><span class="rate-label">Fácil</span><span class="rate-when">'+ratePreview(cardId,3)+'</span></button>' +
    '</div>';
  }

  function handleFlip(){
    state.session.flipped = !state.session.flipped;
    render();
  }

  function handleRate(rating){
    var s = state.session;
    var card = s.queue[s.index];
    rateCard(card.id, rating);
    addXP(FLASH_XP[rating]);
    s.score += 1;
    if(s.index + 1 >= s.queue.length){
      go("session-end");
    } else {
      s.index += 1;
      s.flipped = false;
      render();
    }
  }

  // ---------------- choice quiz (JLPT + kana share this) ----------------
  function quizTermOf(item, kind){ return kind==="kana" ? item.char : item.term; }
  function quizAnswerOf(item, kind){ return kind==="kana" ? item.romaji : item.meaning; }
  function quizTagOf(item, kind){
    if(kind==="kana") return (item.script==="hiragana"?"Hiragana":"Katakana")+" · "+item.rowLabel;
    return state.level+" · "+CAT_LABEL_SING[item.cat];
  }
  function quizDistractors(item, kind){
    if(kind === "kana"){
      var pool = kanaPool().filter(function(k){ return k.id !== item.id; });
      if(pool.length < 3) pool = KANA.filter(function(k){ return k.id !== item.id && k.script === item.script; });
      return shuffle(pool).slice(0,3).map(function(k){ return k.romaji; });
    }
    var poolAll = cardsFor(state.level, "all").filter(function(c){ return c.id !== item.id; });
    var samecat = poolAll.filter(function(c){ return c.cat === item.cat; });
    return shuffle(samecat.length >= 3 ? samecat : poolAll).slice(0,3).map(function(c){ return c.meaning; });
  }

  function renderChoiceQuiz(){
    var s = state.session;
    var item = s.queue[s.index];
    var kind = s.kind;
    if(!s.quizChoices){
      var correct = quizAnswerOf(item, kind);
      s.quizChoices = shuffle(quizDistractors(item, kind).concat([correct]));
    }
    var correctAns = quizAnswerOf(item, kind);
    var opts = s.quizChoices.map(function(opt){
      var cls = "quiz-opt";
      if(s.quizLocked){
        if(opt === correctAns) cls += " correct";
        else if(opt === s.quizSelected) cls += " wrong";
      }
      return '<button class="'+cls+'" data-action="answer-choice" data-opt="'+esc(opt)+'" '+(s.quizLocked?'disabled':'')+'>'+esc(opt)+'</button>';
    }).join("");

    var backBtn = kind === "kana"
      ? '<button class="back-link" data-action="go-kana-hub">&larr; Kana</button>'
      : '<button class="back-link" data-action="open-level" data-level="'+state.level+'">&larr; '+state.level+'</button>';

    app.innerHTML =
      headerHTML() + backBtn +
      '<div class="session-bar">' +
        '<span>Pergunta '+(s.index+1)+' de '+s.queue.length+'</span>' +
        '<div class="progress-track"><div class="progress-fill" style="width:'+Math.round(s.index/s.queue.length*100)+'%"></div></div>' +
        '<span>Acertos: '+s.score+(s.combo>=2?' <span class="combo-badge">combo x'+s.combo+'</span>':'')+'</span>' +
      '</div>' +
      '<div class="quiz-term">' +
        '<span class="tag">'+quizTagOf(item,kind)+'</span>' +
        '<div class="term jp">'+esc(quizTermOf(item,kind))+'</div>' +
      '</div>' +
      '<div class="quiz-options">'+opts+'</div>' +
      '<div class="quiz-actions">' +
        (s.quizLocked ? '<button class="btn" data-action="next-choice">'+(s.index+1>=s.queue.length?'Ver resultado':'Próxima')+'</button>' : '') +
      '</div>';
  }

  function handleChoiceAnswer(opt){
    var s = state.session;
    var item = s.queue[s.index];
    var kind = s.kind;
    s.quizLocked = true; s.quizSelected = opt;
    var correct = opt === quizAnswerOf(item, kind);
    if(correct){ s.score += 1; s.combo += 1; s.maxCombo = Math.max(s.maxCombo, s.combo); }
    else { s.combo = 0; }
    if(kind === "jlpt"){ rateCard(item.id, correct?2:0); addXP(correct?10:3); }
    else { rateKana(item.id, correct); addXP(correct?6:2); }
    render();
  }

  function handleNextChoice(){
    var s = state.session;
    if(s.index+1 >= s.queue.length){ go("session-end"); return; }
    s.index += 1; s.quizLocked = false; s.quizSelected = null; s.quizChoices = null;
    render();
  }

  // ---------------- drawing practice (JLPT kanji/vocab + kana share this) ----------------
  var canvasEl = null;
  var canvasResizeHandler = null;

  function mountCanvas(){
    var canvas = document.getElementById("draw-canvas");
    if(!canvas) return;
    canvasEl = canvas;
    var ctx = canvas.getContext("2d");
    function resize(){
      var rect = canvas.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width*dpr));
      canvas.height = Math.max(1, Math.round(rect.height*dpr));
      ctx.setTransform(1,0,0,1,0,0);
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 9;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      var inkColor = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim();
      ctx.strokeStyle = inkColor || "#221f1a";
    }
    resize();
    var drawing = false;
    function pos(e){
      var rect = canvas.getBoundingClientRect();
      return {x:e.clientX-rect.left, y:e.clientY-rect.top};
    }
    function start(e){
      drawing = true;
      var p = pos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      if(canvas.setPointerCapture){ try{ canvas.setPointerCapture(e.pointerId); }catch(err){} }
      e.preventDefault();
    }
    function move(e){
      if(!drawing) return;
      var p = pos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      e.preventDefault();
    }
    function end(){ drawing = false; }
    canvas.addEventListener("pointerdown", start);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointerleave", end);
    canvas.addEventListener("pointercancel", end);
    if(canvasResizeHandler) window.removeEventListener("resize", canvasResizeHandler);
    canvasResizeHandler = resize;
    window.addEventListener("resize", resize);
  }
  function clearCanvas(){
    if(!canvasEl) return;
    var ctx = canvasEl.getContext("2d");
    ctx.clearRect(0,0,canvasEl.width, canvasEl.height);
  }

  function drawStageHTML(term, showGuide){
    var len = term.length;
    var fs = len<=1 ? "8.5rem" : len===2 ? "5.6rem" : len===3 ? "4rem" : "3.2rem";
    return (
      '<div class="draw-stage">' +
        '<div class="draw-guide jp '+(showGuide?'is-visible':'')+'" style="font-size:'+fs+'">'+esc(term)+'</div>' +
        '<canvas id="draw-canvas" class="draw-canvas"></canvas>' +
      '</div>' +
      '<div class="draw-controls">' +
        '<button class="chip" data-action="toggle-guide">'+(showGuide?"Ocultar guia":"Mostrar guia")+'</button>' +
        '<button class="chip" data-action="clear-canvas">Limpar</button>' +
      '</div>' +
      '<div class="draw-submit"><button class="btn" data-action="reveal-draw">Comparar com o modelo</button></div>'
    );
  }

  function drawRevealHTML(item, kind){
    if(kind === "kana"){
      return (
        '<div class="reveal-panel">' +
          '<span class="tag">'+(item.script==="hiragana"?"Hiragana":"Katakana")+' &middot; '+item.rowLabel+'</span>' +
          '<div class="term jp">'+esc(item.char)+'</div>' +
          '<span class="back-label">Leitura</span>' +
          '<div class="reading">'+esc(item.romaji)+'</div>' +
        '</div>' +
        '<div class="rate-row rate-row-2">' +
          '<button class="rate-btn again" data-action="rate-draw" data-rating="0"><span class="rate-label">Errei</span></button>' +
          '<button class="rate-btn easy" data-action="rate-draw" data-rating="1"><span class="rate-label">Acertei</span></button>' +
        '</div>'
      );
    }
    return (
      '<div class="reveal-panel">' +
        '<span class="tag">'+state.level+' &middot; '+CAT_LABEL_SING[item.cat]+'</span>' +
        '<div class="term jp">'+esc(item.term)+'</div>' +
        '<span class="back-label">'+(item.cat==="grammar"?"Formação":"Leitura")+'</span>' +
        '<div class="reading">'+esc(item.reading)+'</div>' +
        '<div class="meaning">'+esc(item.meaning)+'</div>' +
        '<div class="example">' +
          '<p class="ex-jp jp">'+esc(item.example)+'</p>' +
          '<p class="ex-pt">'+esc(item.exampleReading)+' - '+esc(item.exampleMeaning)+'</p>' +
        '</div>' +
      '</div>' +
      rateRowHTML(item.id, "rate-draw")
    );
  }

  function renderDraw(){
    var s = state.session;
    var item = s.queue[s.index];
    var term = s.kind === "kana" ? item.char : item.term;
    var backBtn = s.kind === "kana"
      ? '<button class="back-link" data-action="go-kana-hub">&larr; Kana</button>'
      : '<button class="back-link" data-action="open-level" data-level="'+state.level+'">&larr; '+state.level+'</button>';

    app.innerHTML =
      headerHTML() + backBtn +
      '<div class="session-bar">' +
        '<span>'+(s.index+1)+' de '+s.queue.length+'</span>' +
        '<div class="progress-track"><div class="progress-fill" style="width:'+Math.round(s.index/s.queue.length*100)+'%"></div></div>' +
        '<span>Escrever</span>' +
      '</div>' +
      (s.flipped ? drawRevealHTML(item, s.kind) : drawStageHTML(term, s.showGuide));
  }

  function handleRevealDraw(){
    state.session.flipped = true;
    render();
  }

  function handleRateDraw(rating){
    var s = state.session;
    var item = s.queue[s.index];
    if(s.kind === "kana"){
      var correct = rating === 1;
      rateKana(item.id, correct);
      addXP(correct ? 8 : 3);
    } else {
      rateCard(item.id, rating);
      addXP(DRAW_XP[rating]);
    }
    s.score += 1;
    if(s.index+1 >= s.queue.length){
      go("session-end");
    } else {
      s.index += 1; s.flipped = false; s.showGuide = false;
      render();
    }
  }

  // ---------------- Kana hub ----------------
  function renderKanaHub(){
    var sel = state.kanaSel;
    var pool = kanaPool();
    var mastered = pool.filter(kanaIsMastered).length;
    var errored = pool.filter(function(k){ return kanaStats[k.id] && kanaStats[k.id].wrong > 0; })
                    .sort(function(a,b){ return kanaStats[b.id].wrong - kanaStats[a.id].wrong; })
                    .slice(0,5);

    var scriptChips = ["hiragana","katakana","both"].map(function(sc){
      var label = sc==="hiragana"?"Hiragana":sc==="katakana"?"Katakana":"Ambos";
      return '<button class="chip '+(sel.script===sc?'is-active':'')+'" data-action="set-kana-script" data-script="'+sc+'">'+label+'</button>';
    }).join("");

    var rowsHTML = KANA_GROUPS.map(function(g){
      var rows = KANA_ROWS.filter(function(r){ return r.group === g[0]; });
      var chips = rows.map(function(r){
        var active = sel.rows.indexOf(r.id) !== -1;
        var sample = sel.script === "katakana" ? r.k[0] : r.h[0];
        return '<button class="row-chip '+(active?'is-active':'')+'" data-action="toggle-kana-row" data-row="'+r.id+'"><span class="jp">'+sample+'</span>'+r.label+'</button>';
      }).join("");
      return '<div class="row-group"><span class="row-group-label">'+g[1]+'</span><div class="row-chip-row">'+chips+'</div></div>';
    }).join("");

    app.innerHTML =
      headerHTML() +
      '<button class="back-link" data-action="go-dashboard">&larr; Painel</button>' +
      '<p class="eyebrow">Kana</p>' +
      '<h1 class="page-title jp">仮名</h1>' +
      '<p class="page-sub">Escolha o roteiro e as fileiras que quer treinar, ou foque direto nos caracteres que mais te derrubam.</p>' +
      '<div class="chip-row">'+scriptChips+'</div>' +
      rowsHTML +
      '<div class="chip-row" style="margin-top:.25rem;">' +
        '<button class="chip" data-action="kana-select-all">Selecionar tudo</button>' +
        '<button class="chip" data-action="kana-select-none">Limpar seleção</button>' +
        '<button class="chip '+(sel.focus?'is-active':'')+'" data-action="toggle-kana-focus">Focar nos que mais erro</button>' +
      '</div>' +
      '<div class="stat-row">' +
        '<div class="summary-item"><b>'+pool.length+'</b>selecionados</div>' +
        '<div class="summary-item"><b>'+mastered+'</b>dominados</div>' +
        '<div class="summary-item"><b>'+errored.length+'</b>com erros</div>' +
      '</div>' +
      (errored.length ? '<p class="mistake-preview">Mais errados: '+errored.map(function(k){return '<span class="jp">'+esc(k.char)+'</span>';}).join(' ')+'</p>' : '') +
      (pool.length === 0 ? '<div class="empty-state"><p>Selecione ao menos uma fileira para começar.</p></div>' :
      '<div class="mode-grid">' +
        '<button class="mode-card flash" data-action="start-kana-session" data-mode="recognize">' +
          '<span class="mode-mark"></span><h3>Reconhecer</h3><p>Veja o kana e escolha a leitura certa entre 4 opções.</p>' +
        '</button>' +
        '<button class="mode-card draw" data-action="start-kana-session" data-mode="draw">' +
          '<span class="mode-mark"></span><h3>Escrever</h3><p>Desenhe o kana com o dedo ou o mouse e compare com o modelo.</p>' +
        '</button>' +
      '</div>');
  }

  function startKanaSession(mode){
    var pool = kanaPool();
    if(pool.length === 0) return;
    var queue;
    if(state.kanaSel.focus){
      var errored = pool.filter(function(k){ return kanaStats[k.id] && kanaStats[k.id].wrong > 0; })
                      .sort(function(a,b){ return kanaStats[b.id].wrong - kanaStats[a.id].wrong; });
      var rest = shuffle(pool.filter(function(k){ return errored.indexOf(k) === -1; }));
      queue = errored.concat(rest).slice(0, mode==="draw" ? 20 : 15);
      stats.focusSessions += 1; saveStats();
    } else {
      queue = shuffle(pool).slice(0, mode==="draw" ? 20 : 15);
    }
    state.session = newSession({mode: mode==="draw"?"draw":"quiz", kind:"kana", queue:queue});
    go(mode === "draw" ? "draw" : "quiz");
  }

  // ---------------- sentence writing ----------------
  function renderPhrase(){
    var s = state.session;
    var item = s.queue[s.index];
    var promptNote = item.cat === "grammar" ? '<p class="phrase-hint">'+esc(item.reading)+'</p>' : '';
    app.innerHTML =
      headerHTML() +
      '<button class="back-link" data-action="open-level" data-level="'+state.level+'">&larr; '+state.level+'</button>' +
      '<div class="session-bar">' +
        '<span>Frase '+(s.index+1)+' de '+s.queue.length+'</span>' +
        '<div class="progress-track"><div class="progress-fill" style="width:'+Math.round(s.index/s.queue.length*100)+'%"></div></div>' +
        '<span>'+CAT_LABEL_SING[item.cat]+'</span>' +
      '</div>' +
      '<div class="phrase-prompt">' +
        '<p class="eyebrow">Escreva uma frase usando</p>' +
        '<div class="term jp">'+esc(item.term)+'</div>' +
        '<p class="phrase-meaning">'+esc(item.meaning)+'</p>' +
        promptNote +
      '</div>' +
      (s.feedback ? phraseFeedbackHTML(s) : phraseInputHTML(s));
  }

  function phraseInputHTML(s){
    return (
      '<textarea id="phrase-input" class="phrase-textarea" placeholder="日本語で書いてください…" rows="3" '+(s.checking?'disabled':'')+'>'+esc(s.draft||"")+'</textarea>' +
      '<div class="phrase-actions">' +
        '<button class="btn" data-action="submit-phrase" '+(s.checking?'disabled':'')+'>'+(s.checking?"Verificando…":"Verificar")+'</button>' +
      '</div>'
    );
  }

  function phraseFeedbackHTML(s){
    var f = s.feedback;
    var badgeClass = /ótimo|otimo/i.test(f.nota||"") ? "matcha" : /precisa/i.test(f.nota||"") ? "amber" : "indigo";
    return (
      '<div class="phrase-feedback">' +
        (f.fallback ? '' : '<span class="feedback-badge '+badgeClass+'">'+esc(f.nota)+'</span>') +
        '<p class="feedback-comment">'+esc(f.comentario)+'</p>' +
        (f.frase_corrigida ? '<p class="feedback-corrected jp">'+esc(f.frase_corrigida)+'</p>' : '') +
      '</div>' +
      '<div class="phrase-actions">' +
        '<button class="btn" data-action="next-phrase">'+(s.index+1>=s.queue.length?"Ver resultado":"Próxima frase")+'</button>' +
      '</div>'
    );
  }

  function handleSubmitPhrase(){
    var s = state.session;
    var ta = document.getElementById("phrase-input");
    var text = ta ? ta.value.trim() : "";
    if(!text) return;
    var item = s.queue[s.index];
    s.checking = true; s.draft = text; render();

    checkPhrase({text:text, item:item, level:state.level})
      .then(function(result){ applyPhraseResult(result, item); })
      .catch(function(){ resolvePhraseFallback(item); });
  }

  function applyPhraseResult(result, item){
    var s = state.session;
    var nota = (result && result.nota) ? String(result.nota) : "bom";
    var xpGain = /ótimo|otimo/i.test(nota) ? 15 : /precisa/i.test(nota) ? 6 : 10;
    s.feedback = {
      nota: nota,
      comentario: (result && result.comentario) || "Boa tentativa!",
      frase_corrigida: (result && result.frase_corrigida) || item.example || ""
    };
    addXP(xpGain); touchStreak();
    stats.sentencesWritten += 1; saveStats();
    s.checking = false;
    render();
  }

  function resolvePhraseFallback(item){
    var s = state.session;
    s.feedback = {
      fallback:true,
      comentario:"Não consegui verificar automaticamente agora. Compare sua frase com o exemplo:",
      frase_corrigida: item.example + "  (" + item.exampleMeaning + ")"
    };
    addXP(8); touchStreak();
    stats.sentencesWritten += 1; saveStats();
    s.checking = false;
    render();
  }

  function handleNextPhrase(){
    var s = state.session;
    if(s.index+1 >= s.queue.length){ go("session-end"); return; }
    s.index += 1; s.feedback = null; s.draft = ""; s.checking = false;
    render();
  }

  // ---------------- session end ----------------
  function renderSessionEnd(){
    var s = state.session;
    var kind = s.kind;
    var title, scoreValue, scoreLine;
    if(s.mode === "flash"){
      title = "お疲れ様でした"; scoreValue = s.queue.length; scoreLine = scoreValue+" cartões revisados";
    } else if(s.mode === "quiz"){
      title = "結果"; scoreValue = s.score+" / "+s.queue.length;
      scoreLine = "respostas certas"+(s.maxCombo>=3?" · combo máximo x"+s.maxCombo:"");
    } else if(s.mode === "draw"){
      title = "書けました"; scoreValue = s.queue.length; scoreLine = scoreValue+" caracteres praticados";
    } else {
      title = "よく書けました"; scoreValue = s.queue.length; scoreLine = scoreValue+" frases escritas";
    }
    var backBtn = kind === "kana"
      ? '<button class="btn ghost" data-action="go-kana-hub">Voltar ao Kana</button>'
      : '<button class="btn ghost" data-action="open-level" data-level="'+state.level+'">Voltar ao nível</button>';

    app.innerHTML =
      headerHTML() +
      '<div class="end-card">' +
        '<p class="eyebrow">Sessão concluída</p>' +
        '<h2 class="jp">'+title+'</h2>' +
        '<div class="end-score">'+scoreValue+'</div>' +
        '<p style="color:var(--ink-soft);font-size:.88rem;">'+scoreLine+'</p>' +
        '<div class="end-actions">' + backBtn + '<button class="btn" data-action="go-dashboard">Painel</button></div>' +
      '</div>';
  }

  // ---------------- profile / achievements ----------------
  function renderProfile(){
    var bp = beltProgress();
    var hMastered = kanaMasteredCount("hiragana");
    var kMastered = kanaMasteredCount("katakana");
    var unlockedCount = ACHIEVEMENTS.filter(function(a){ return a.test(); }).length;
    var cards = ACHIEVEMENTS.map(function(a){
      var unlocked = a.test();
      return '<div class="ach-card '+(unlocked?'is-unlocked':'')+'">' +
        '<span class="ach-dot"></span>' +
        '<div><b>'+a.name+'</b><p>'+a.desc+'</p></div>' +
      '</div>';
    }).join("");

    app.innerHTML =
      headerHTML() +
      '<button class="back-link" data-action="go-dashboard">&larr; Painel</button>' +
      '<p class="eyebrow">Seu progresso</p>' +
      '<h1 class="page-title jp">'+bp.belt.name+'</h1>' +
      xpCardHTML() +
      '<div class="stat-row">' +
        '<div class="summary-item"><b>'+streak.count+'</b>dias seguidos</div>' +
        '<div class="summary-item"><b>'+hMastered+'/71</b>hiragana</div>' +
        '<div class="summary-item"><b>'+kMastered+'/71</b>katakana</div>' +
        '<div class="summary-item"><b>'+stats.sentencesWritten+'</b>frases escritas</div>' +
      '</div>' +
      '<p class="eyebrow">Conquistas ('+unlockedCount+'/'+ACHIEVEMENTS.length+')</p>' +
      '<div class="ach-grid">'+cards+'</div>';
  }

  // ---------------- dispatch / render ----------------
  function render(){
    if(state.view === "dashboard") renderDashboard();
    else if(state.view === "level") renderLevel();
    else if(state.view === "study") renderStudy();
    else if(state.view === "quiz") renderChoiceQuiz();
    else if(state.view === "draw") renderDraw();
    else if(state.view === "phrase") renderPhrase();
    else if(state.view === "kana-hub") renderKanaHub();
    else if(state.view === "builder") renderBuilder();
    else if(state.view === "guides") renderGuides();
    else if(state.view === "profile") renderProfile();
    else if(state.view === "session-end") renderSessionEnd();
    afterRender();
  }

  function afterRender(){
    runScreenAnimations();
    if(state.view === "draw" && state.session && !state.session.flipped){
      mountCanvas();
    }
  }

  app.addEventListener("click", function(e){
    var el = e.target.closest("[data-action]");
    if(!el) return;
    var action = el.getAttribute("data-action");
    if(action === "go-dashboard") go("dashboard");
    else if(action === "open-level") go("level", {level: el.getAttribute("data-level"), cat:"all"});
    else if(action === "set-cat"){ state.cat = el.getAttribute("data-cat"); render(); }
    else if(action === "start-session") startSession(el.getAttribute("data-mode"));
    else if(action === "flip-card") handleFlip();
    else if(action === "rate") handleRate(parseInt(el.getAttribute("data-rating"),10));
    else if(action === "answer-choice") handleChoiceAnswer(el.getAttribute("data-opt"));
    else if(action === "next-choice") handleNextChoice();
    else if(action === "reveal-draw") handleRevealDraw();
    else if(action === "rate-draw") handleRateDraw(parseInt(el.getAttribute("data-rating"),10));
    else if(action === "toggle-guide"){
      state.session.showGuide = !state.session.showGuide;
      var g = document.querySelector(".draw-guide");
      if(g) g.classList.toggle("is-visible", state.session.showGuide);
      el.textContent = state.session.showGuide ? "Ocultar guia" : "Mostrar guia";
    }
    else if(action === "clear-canvas") clearCanvas();
    else if(action === "submit-phrase") handleSubmitPhrase();
    else if(action === "next-phrase") handleNextPhrase();
    else if(action === "go-kana-hub") go("kana-hub");
    else if(action === "go-builder") go("builder");
    else if(action === "go-guides") go("guides");
    else if(action === "set-builder-pattern"){
      state.builder.pattern = el.getAttribute("data-pattern");
      state.builder.slots = {};
      state.builder.copied = false;
      render();
    }
    else if(action === "set-builder-slot"){
      state.builder.slots[el.getAttribute("data-slot")] = el.getAttribute("data-value");
      state.builder.copied = false;
      render();
    }
    else if(action === "copy-builder") copyBuilderSentence();
    else if(action === "set-kana-script"){ state.kanaSel.script = el.getAttribute("data-script"); render(); }
    else if(action === "toggle-kana-row"){
      var r = el.getAttribute("data-row");
      var idx = state.kanaSel.rows.indexOf(r);
      if(idx === -1) state.kanaSel.rows.push(r); else state.kanaSel.rows.splice(idx,1);
      render();
    }
    else if(action === "kana-select-all"){ state.kanaSel.rows = KANA_ROWS.map(function(r){return r.id;}); render(); }
    else if(action === "kana-select-none"){ state.kanaSel.rows = []; render(); }
    else if(action === "toggle-kana-focus"){ state.kanaSel.focus = !state.kanaSel.focus; render(); }
    else if(action === "start-kana-session") startKanaSession(el.getAttribute("data-mode"));
    else if(action === "go-profile") go("profile");
  });

  app.addEventListener("keydown", function(e){
    if(e.key !== "Enter" && e.key !== " ") return;
    var el = e.target.closest('[data-action="flip-card"]');
    if(el){ e.preventDefault(); handleFlip(); }
  });

  loadAnime(runScreenAnimations);
  render();
  hydrateFromServer();
})();
