(function(){
  "use strict";

  var rootEl = document.getElementById("react-bits-root");
  if(!rootEl || !window.React || !window.ReactDOM || !window.ReactDOM.createRoot) return;

  var h = window.React.createElement;
  var useEffect = window.React.useEffect;
  var useMemo = window.React.useMemo;
  var useRef = window.React.useRef;

  var KANA = [
    "あ","い","う","え","お","か","き","く","け","こ","さ","し","す","せ","そ",
    "た","ち","つ","て","と","な","に","ぬ","ね","の","は","ひ","ふ","へ","ほ",
    "ま","み","む","め","も","や","ゆ","よ","ら","り","る","れ","ろ","わ","を","ん",
    "ア","イ","ウ","エ","オ","カ","キ","ク","ケ","コ","サ","シ","ス","セ","ソ",
    "タ","チ","ツ","テ","ト","ナ","ニ","ヌ","ネ","ノ","マ","ミ","ム","メ","モ"
  ];

  function reducedMotion(){
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function KanaRain(){
    var items = useMemo(function(){
      return Array.from({ length: 44 }, function(_, index){
        return {
          id: index,
          char: KANA[(index * 7) % KANA.length],
          left: (index * 19) % 100,
          delay: -1 * ((index * 0.47) % 9),
          duration: 10 + (index % 8),
          size: 1.1 + (index % 5) * 0.2,
          alpha: 0.1 + (index % 4) * 0.05
        };
      });
    }, []);

    if(reducedMotion()) return null;

    return h("div", { className: "rb-kana-rain" },
      items.map(function(item){
        return h("span", {
          key: item.id,
          className: "jp",
          style: {
            "--rb-left": item.left + "%",
            "--rb-delay": item.delay + "s",
            "--rb-duration": item.duration + "s",
            "--rb-size": item.size + "rem",
            "--rb-alpha": item.alpha
          }
        }, item.char);
      })
    );
  }

  function ClickSpark(){
    var canvasRef = useRef(null);
    var sparksRef = useRef([]);

    useEffect(function(){
      if(reducedMotion()) return;
      var canvas = canvasRef.current;
      if(!canvas) return;
      var ctx = canvas.getContext("2d");
      if(!ctx) return;

      var rafId = 0;
      var duration = 520;
      var sparkRadius = 34;
      var sparkSize = 15;
      var sparkCount = 10;
      var dpr = Math.max(window.devicePixelRatio || 1, 1);

      function resize(){
        dpr = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = Math.round(window.innerWidth * dpr);
        canvas.height = Math.round(window.innerHeight * dpr);
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.lineCap = "round";
      }

      function easeOut(t){
        return t * (2 - t);
      }

      function draw(now){
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        sparksRef.current = sparksRef.current.filter(function(spark){
          var elapsed = now - spark.startedAt;
          if(elapsed >= duration) return false;
          var progress = elapsed / duration;
          var eased = easeOut(progress);
          var distance = eased * sparkRadius;
          var lineLength = sparkSize * (1 - eased);
          var x1 = spark.x + distance * Math.cos(spark.angle);
          var y1 = spark.y + distance * Math.sin(spark.angle);
          var x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
          var y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);
          ctx.globalAlpha = 1 - progress;
          ctx.strokeStyle = spark.color;
          ctx.lineWidth = 2;
          ctx.shadowColor = spark.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          return true;
        });
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        rafId = window.requestAnimationFrame(draw);
      }

      function onPointerDown(event){
        var palette = ["#37d7ff", "#35f29a", "#ffd34d", "#ff4f6d", "#b665ff"];
        var color = palette[Math.floor(Math.random() * palette.length)];
        var startedAt = performance.now();
        for(var i = 0; i < sparkCount; i += 1){
          sparksRef.current.push({
            x: event.clientX,
            y: event.clientY,
            angle: (Math.PI * 2 * i) / sparkCount,
            startedAt: startedAt,
            color: color
          });
        }
      }

      resize();
      rafId = window.requestAnimationFrame(draw);
      window.addEventListener("resize", resize);
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
      return function(){
        window.cancelAnimationFrame(rafId);
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointerdown", onPointerDown);
      };
    }, []);

    return h("canvas", { className: "rb-click-spark-canvas", ref: canvasRef });
  }

  function GlareEnhancer(){
    useEffect(function(){
      if(reducedMotion() || typeof MutationObserver === "undefined") return;

      var selector = [
        ".grind-hero",
        ".daily-plan",
        ".xp-card",
        ".kana-hub-card",
        ".tool-card",
        ".level-tile",
        ".mode-card",
        ".quiz-opt",
        ".rate-btn",
        ".builder-output",
        ".guide-card",
        ".btn"
      ].join(",");

      function ensureBeam(el){
        if(el.classList.contains("rb-glare-host")) return;
        el.classList.add("rb-glare-host");
        var beam = document.createElement("span");
        beam.className = "rb-glare-beam";
        beam.setAttribute("aria-hidden", "true");
        el.appendChild(beam);
      }

      function enhance(){
        document.querySelectorAll(selector).forEach(ensureBeam);
      }

      function updatePointer(event){
        var el = event.target.closest && event.target.closest(".rb-glare-host");
        if(!el) return;
        var rect = el.getBoundingClientRect();
        var x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
        var y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
        el.style.setProperty("--rb-x", x.toFixed(2) + "%");
        el.style.setProperty("--rb-y", y.toFixed(2) + "%");
      }

      enhance();
      var observer = new MutationObserver(enhance);
      var app = document.getElementById("app");
      if(app) observer.observe(app, { childList: true, subtree: true });
      document.addEventListener("pointermove", updatePointer, { passive: true });

      return function(){
        observer.disconnect();
        document.removeEventListener("pointermove", updatePointer);
        document.querySelectorAll(".rb-glare-beam").forEach(function(beam){ beam.remove(); });
        document.querySelectorAll(".rb-glare-host").forEach(function(el){ el.classList.remove("rb-glare-host"); });
      };
    }, []);

    return null;
  }

  function ReactBitsLayer(){
    return h(window.React.Fragment, null,
      h(KanaRain),
      h(ClickSpark),
      h(GlareEnhancer)
    );
  }

  window.ReactDOM.createRoot(rootEl).render(h(ReactBitsLayer));
})();
