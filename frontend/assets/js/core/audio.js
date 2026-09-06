import { audioKey } from "/shared/audioText.js";

export function createAudio(toast, preferences = () => ({})) {
  let sequence = 0, media = null, activeButton = null, utterance = null, effectContext = null;
  const manifest = fetch("/assets/data/audio.json", { signal: AbortSignal.timeout(5000) })
    .then(response => response.ok ? response.json() : { clips: {} }).then(data => data.clips || {}).catch(() => ({}));
  const mark = (button, state) => {
    if (!button) return;
    button.classList.toggle("is-loading", state === "loading");
    button.classList.toggle("is-playing", state === "playing");
    button.setAttribute("aria-busy", String(state === "loading"));
    button.setAttribute("aria-pressed", String(state === "playing"));
  };
  function stop() {
    sequence++;
    if (media) { media.pause(); media.removeAttribute("src"); media.load(); media = null; }
    window.speechSynthesis?.cancel();
    utterance = null;
    mark(activeButton, "idle"); activeButton = null;
  }
  async function japaneseVoice() {
    const synth = window.speechSynthesis;
    if (!synth) return null;
    const find = () => synth.getVoices().find(voice => /^ja(?:[-_]|$)/i.test(voice.lang));
    if (find()) return find();
    return new Promise(resolve => {
      let timer;
      const finish = () => { clearTimeout(timer); synth.removeEventListener("voiceschanged", finish); resolve(find() || null); };
      timer = setTimeout(finish, 1500);
      synth.addEventListener("voiceschanged", finish);
    });
  }
  async function speak(text, button = null) {
    if (button && activeButton === button) { stop(); return; }
    stop();
    const request = sequence;
    activeButton = button; mark(button, "loading");
    const rate = preferences().audioRate || 1;
    const done = () => { if (request === sequence) { mark(button, "idle"); activeButton = null; } };
    const fallback = async () => {
      const voice = await japaneseVoice();
      if (request !== sequence) return;
      if (!voice || !window.SpeechSynthesisUtterance) {
        done(); toast("Não foi possível tocar este áudio. Confira sua conexão com o site e tente novamente."); return;
      }
      utterance = new SpeechSynthesisUtterance(String(text));
      utterance.voice = voice; utterance.lang = "ja-JP"; utterance.rate = .85 * rate;
      utterance.onstart = () => { if (request === sequence) mark(button, "playing"); };
      utterance.onend = done;
      utterance.onerror = event => { done(); if (request === sequence && !["canceled","interrupted"].includes(event.error)) toast("O navegador interrompeu o áudio. Toque em ouvir para tentar novamente."); };
      window.speechSynthesis.speak(utterance);
    };
    const clips = await manifest;
    if (request !== sequence) return;
    const source = clips[audioKey(text)];
    if (!source) { await fallback(); return; }
    const player = new Audio(source);
    media = player;
    player.preload = "auto";
    player.playbackRate = rate;
    player.preservesPitch = true;
    player.addEventListener("ended", done, { once: true });
    let recovered = false;
    const recover = async error => {
      if (recovered || request !== sequence) return;
      recovered = true;
      if (error?.name === "NotAllowedError") { done(); toast("Toque em ouvir novamente para permitir a reprodução no navegador."); }
      else await fallback();
    };
    player.addEventListener("error", () => { void recover(); }, { once: true });
    try { await player.play(); if (request === sequence) mark(button, "playing"); }
    catch (error) { await recover(error); }
  }
  function feedback(kind) {
    const prefs = preferences();
    if (prefs.theme !== "arcade" || !prefs.soundEffects) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      effectContext ||= new AudioContext();
      void effectContext.resume().catch(() => {});
      const notes = kind === "complete" ? [523.25,659.25,783.99,1046.5] : kind === "correct" ? [659.25,880] : [220,164.81];
      const start = effectContext.currentTime;
      notes.forEach((frequency,index) => {
        const oscillator = effectContext.createOscillator(), gain = effectContext.createGain();
        oscillator.type = "square"; oscillator.frequency.value = frequency;
        const time = start + index * .10;
        gain.gain.setValueAtTime(0,time); gain.gain.linearRampToValueAtTime(.022,time+.008); gain.gain.exponentialRampToValueAtTime(.0001,time+.10);
        oscillator.connect(gain); gain.connect(effectContext.destination);
        oscillator.start(time); oscillator.stop(time+.11);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    } catch { /* Feedback sounds are optional; scoring does not depend on Web Audio. */ }
  }
  return { speak, stop, feedback };
}
