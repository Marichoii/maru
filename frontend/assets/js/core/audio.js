export function createAudio(toast) {
  const supported = "speechSynthesis" in window;
  const voices = () => supported ? window.speechSynthesis.getVoices().filter(voice => /^ja(?:-|_)/i.test(voice.lang)) : [];
  if (supported) window.speechSynthesis.getVoices();
  return {
    speak(text) {
      if (!supported || !voices().length) {
        toast("Nenhuma voz japonesa disponível neste dispositivo. Você pode acompanhar a leitura e consultar os áudios da Japan Foundation em Recursos.");
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.voice = voices()[0];
      utterance.rate = 0.8;
      utterance.onerror = event => {
        if (!["canceled", "interrupted"].includes(event.error)) toast("Não foi possível reproduzir o áudio nesta tentativa.");
      };
      window.speechSynthesis.speak(utterance);
    },
    stop() { if (supported) window.speechSynthesis.cancel(); }
  };
}
