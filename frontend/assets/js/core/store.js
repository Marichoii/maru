import { normalizeSnapshot, mergeSnapshots } from "/shared/progress.js";
import { getProgress, saveProgress } from "../api.js";

const KEY = "maru-learning-v2";
function readLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved) return normalizeSnapshot(saved);
    const legacy = {};
    const keys = { progress: "progress", streak: "streak", xp: "xp", stats: "stats", kanaStats: "kana" };
    for (const [field, key] of Object.entries(keys)) {
      legacy[field] = JSON.parse(localStorage.getItem("maru-" + key + "-v1") || localStorage.getItem("nihongo-dojo-" + key + "-v1") || "null");
    }
    return normalizeSnapshot(legacy);
  } catch { return normalizeSnapshot(); }
}
export async function createStore(onStatus) {
  let snapshot = readLocal();
  let localAvailable = true;
  const persistLocal = () => {
    try { localStorage.setItem(KEY, JSON.stringify(snapshot)); localAvailable = true; }
    catch { localAvailable = false; }
  };
  let remoteAvailable = false;
  try {
    snapshot = mergeSnapshots(snapshot, await getProgress());
    remoteAvailable = true;
  } catch { /* The local snapshot remains usable when the server is unavailable. */ }
  persistLocal();
  let timer;
  let dirty = false;
  let saving = false;
  const report = status => onStatus(status || (remoteAvailable ? "saved" : localAvailable ? "local" : "unsaved"));
  const flush = async () => {
    clearTimeout(timer);
    if (saving || !dirty) return;
    saving = true;
    dirty = false;
    try {
      await saveProgress(structuredClone(snapshot));
      remoteAvailable = true;
    } catch {
      remoteAvailable = false;
      dirty = true;
    } finally {
      saving = false;
      report();
      if (dirty && remoteAvailable) void flush();
    }
  };
  window.addEventListener("online", () => { dirty = true; void flush(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) void flush(); });
  report();
  return {
    get snapshot() { return snapshot; },
    save() {
      snapshot.updatedAt = Date.now();
      persistLocal();
      dirty = true;
      report("saving");
      clearTimeout(timer);
      timer = setTimeout(flush, 250);
    },
    flush
  };
}
