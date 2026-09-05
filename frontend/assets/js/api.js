const JSON_HEADERS = {
  "Accept": "application/json",
  "Content-Type": "application/json"
};

export function canUseBackend(){
  return typeof fetch === "function" &&
    typeof window !== "undefined" &&
    window.location &&
    window.location.protocol !== "file:";
}

async function request(path, options){
  if(!canUseBackend()) throw new Error("Backend indisponivel");
  const res = await fetch(path, Object.assign({
    headers: JSON_HEADERS,
    signal: AbortSignal.timeout(5000),
    keepalive: !options?.body || new TextEncoder().encode(options.body).byteLength < 60000
  }, options || {}));

  if(!res.ok){
    const message = await res.text().catch(function(){ return ""; });
    throw new Error(message || "Falha na API");
  }

  if(res.status === 204) return null;
  return res.json();
}

export function getProgress(){
  return request("/api/progress");
}

export function saveProgress(snapshot){
  return request("/api/progress", {
    method: "PUT",
    body: JSON.stringify(snapshot)
  });
}

export function checkPhrase(payload){
  return request("/api/phrase/check", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
