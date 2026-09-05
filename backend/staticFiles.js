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
    res.writeHead(200, {
      "Content-Type": types[path.extname(target)] || "application/octet-stream",
      "Content-Length": data.length,
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff"
    });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch (error) {
    if (["ENOENT", "EISDIR", "ENOTDIR"].includes(error.code)) return sendJson(res, 404, { error: "Arquivo não encontrado." });
    throw error;
  }
}
