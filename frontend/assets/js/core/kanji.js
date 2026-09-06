const endpoint = "https://kanjiapi.dev/v1/kanji/";
const pending = new Map(), memory = new Map();
const TTL = 24 * 60 * 60 * 1000;
let fallback;

function normalize(data, char) {
  if (data?.kanji !== char || !Number.isInteger(data.stroke_count) || data.stroke_count < 1) throw new Error("Resposta de kanji inválida.");
  const list = value => Array.isArray(value) ? value.filter(item=>typeof item==="string").slice(0,30) : [];
  return { kanji: char, stroke_count: data.stroke_count, kun_readings: list(data.kun_readings), on_readings: list(data.on_readings), meanings: list(data.meanings) };
}

// KanjiAPI exposes dictionary data, not audio. Pronunciation stays in audio.js.
export function getKanjiDetails(char) {
  if (!/^\p{Script=Han}$/u.test(char)) return Promise.reject(new Error("Escolha um kanji."));
  const stored = memory.get(char);
  if (stored && Date.now()-stored.savedAt<TTL) return Promise.resolve({...stored.data,source:"cache"});
  if (pending.has(char)) return pending.get(char);
  const load = async () => {
    let cache;
    try {
      cache = JSON.parse(localStorage.getItem("maru-kanji-"+char));
      if(cache && Date.now()-cache.savedAt<TTL){const data=normalize(cache.data,char);memory.set(char,{data,savedAt:cache.savedAt});return {...data,source:"cache"};}
    } catch { /* Invalid browser cache is replaced by a fresh response. */ }
    try {
      const response = await fetch(endpoint+encodeURIComponent(char),{headers:{Accept:"application/json"},signal:AbortSignal.timeout(5000)});
      if(!response.ok)throw new Error("KanjiAPI indisponível.");
      const data=normalize(await response.json(),char), savedAt=Date.now();
      memory.set(char,{data,savedAt});
      try{localStorage.setItem("maru-kanji-"+char,JSON.stringify({savedAt,data}));}catch{}
      return {...data,source:"live"};
    } catch {
      if(cache?.data){try{return {...normalize(cache.data,char),source:"offline"};}catch{}}
      fallback ||= fetch("/assets/data/kanji-api.json").then(response=>response.ok?response.json():{}).catch(()=>({}));
      const seed=(await fallback).characters?.[char];
      if(seed)return {...normalize(seed,char),source:"offline"};
      throw new Error("Não foi possível consultar outras leituras agora. O exemplo desta página continua disponível.");
    }
  };
  const request=load().finally(()=>pending.delete(char));pending.set(char,request);return request;
}
