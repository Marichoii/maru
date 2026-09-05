import { DATA, LEVELS, LEVEL_META, CAT_LABEL, CAT_LABEL_SING, KANA, KANA_ROWS, KANA_GROUPS, BUILDER_PATTERNS } from "../shared/content.js";
import { MODULES, LESSONS } from "../shared/curriculum.js";
import { BEGINNER_KANJI, EXPRESSIONS, PARTICLES, SENTENCES, COMBINATIONS } from "../shared/catalog.js";
import { checkPhrase } from "./phraseService.js";
import { readJson, sendJson } from "./http.js";

export async function handleApi(req, res, pathname, storage) {
  const userId = req.headers["x-maru-user"] || "default";
  if (pathname === "/api/health" && req.method === "GET") return sendJson(res, 200, { ok: true, name: "maru", version: 2 });
  if (pathname === "/api/content" && req.method === "GET") return sendJson(res, 200, {
    data: DATA, levels: LEVELS, levelMeta: LEVEL_META, catLabel: CAT_LABEL, catLabelSingular: CAT_LABEL_SING,
    kanaRows: KANA_ROWS, kanaGroups: KANA_GROUPS, kana: KANA, builderPatterns: BUILDER_PATTERNS,
    modules: MODULES, lessons: LESSONS, beginnerKanji: BEGINNER_KANJI, expressions: EXPRESSIONS, particles: PARTICLES, sentences: SENTENCES, combinations: COMBINATIONS
  });
  if (pathname === "/api/progress") {
    if (req.method === "GET") return sendJson(res, 200, await storage.read(userId));
    if (["PUT", "POST"].includes(req.method)) return sendJson(res, 200, await storage.write(await readJson(req), userId));
    return sendJson(res, 405, { error: "Método não permitido." });
  }
  if (pathname === "/api/phrase/check" && req.method === "POST") return sendJson(res, 200, checkPhrase(await readJson(req)));
  return sendJson(res, 404, { error: "Endpoint não encontrado." });
}
