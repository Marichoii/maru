import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sendJson } from "./http.js";

const frontend = fileURLToPath(new URL("../frontend/", import.meta.url));
const shared = fileURLToPath(new URL("../shared/", import.meta.url));
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2" };

export async function sendStatic(req, res, pathname) {
  if (!["GET", "HEAD"].includes(req.method)) return sendJson(res, 405, { error: "Método não permitido." });
  let decoded;
  try { decoded = decodeURIComponent(pathname); }
  catch { return sendJson(res, 400, { error: "Caminho inválido." }); }
  if (decoded.includes("\0")) return sendJson(res, 400, { error: "Caminho inválido." });
  const isShared = decoded.startsWith("/shared/");
  const root = isShared ? shared : frontend;
  const relative = isShared ? decoded.slice(8) : decoded.replace(/^\//, "");
  const target = path.resolve(root, relative || "index.html");
  const boundary = path.relative(root, target);
  if (boundary.startsWith("..") || path.isAbsolute(boundary)) return sendJson(res, 403, { error: "Caminho não permitido." });
  try {
    const data = await fs.readFile(target);
    const extension = path.extname(target);
    const audioTypes = { ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg" };
    const isAudio = Boolean(audioTypes[extension]);
    const headers = {
      "Content-Type": audioTypes[extension] || types[extension] || "application/octet-stream",
      "Content-Length": data.length,
      "Cache-Control": isAudio ? "public, max-age=31536000, immutable" : "no-cache",
      "X-Content-Type-Options": "nosniff"
    };
    if (isAudio) headers["Accept-Ranges"] = "bytes";
    const range = isAudio && req.method === "GET" && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
    if (range && (range[1] || range[2])) {
      const start = range[1] ? Number(range[1]) : Math.max(0, data.length - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(Number(range[2]), data.length - 1) : data.length - 1;
      if (start >= data.length || start > end || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
        res.writeHead(416, { "Content-Range": "bytes */" + data.length, "Content-Length": 0 });
        return res.end();
      }
      headers["Content-Range"] = "bytes " + start + "-" + end + "/" + data.length;
      headers["Content-Length"] = end - start + 1;
      res.writeHead(206, headers);
      return res.end(data.subarray(start, end + 1));
    }
    res.writeHead(200, headers);
    res.end(req.method === "HEAD" ? undefined : data);
  } catch (error) {
    if (["ENOENT", "EISDIR", "ENOTDIR"].includes(error.code)) return sendJson(res, 404, { error: "Arquivo não encontrado." });
    throw error;
  }
}
