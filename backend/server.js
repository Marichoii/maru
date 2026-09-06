import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleApi } from "./apiRouter.js";
import { sendStatic } from "./staticFiles.js";
import { sendJson } from "./http.js";
import { createProgressStorage } from "./storage.js";
import { createSpeechService } from "./speechService.js";

export function createServer({ storage = createProgressStorage(), speech = createSpeechService() } = {}) {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://localhost");
      if (url.pathname.startsWith("/api/")) await handleApi(req, res, url.pathname, storage, speech);
      else await sendStatic(req, res, url.pathname);
    } catch (error) {
      if (!res.headersSent && !res.destroyed) {
        if (error.retryAfter) res.setHeader("Retry-After", String(error.retryAfter));
        sendJson(res, error.status || 500, { error: error.status ? error.message : "Não foi possível concluir a solicitação.", ...(error.retryAfter ? { retryAfter: error.retryAfter } : {}) });
      }
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 5173;
  const host = process.env.HOST || "127.0.0.1";
  createServer().listen(port, host, () => console.log("Maru rodando em http://" + host + ":" + port));
}
