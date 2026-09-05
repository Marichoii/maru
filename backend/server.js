import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILDER_PATTERNS,
  CAT_LABEL,
  CAT_LABEL_SING,
  DATA,
  KANA,
  KANA_GROUPS,
  KANA_ROWS,
  LEVELS,
  LEVEL_META
} from "../shared/content.js";
import { checkPhrase } from "./phraseService.js";
import { readProgress, writeProgress } from "./storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT_DIR, "frontend");
const SHARED_DIR = path.join(ROOT_DIR, "shared");
const ANIMEJS_FILE = path.join(ROOT_DIR, "node_modules", "animejs", "dist", "bundles", "anime.esm.min.js");
const REACT_FILE = path.join(ROOT_DIR, "node_modules", "react", "umd", "react.production.min.js");
const REACT_DOM_FILE = path.join(ROOT_DIR, "node_modules", "react-dom", "umd", "react-dom.production.min.js");
const PORT = Number(process.env.PORT) || 5173;
const HOST = process.env.HOST || "127.0.0.1";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function sendJson(res, status, body){
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

function sendError(res, status, message){
  sendJson(res, status, { error: message });
}

function readBody(req){
  return new Promise(function(resolve, reject){
    let body = "";
    req.on("data", function(chunk){
      body += chunk;
      if(body.length > 1_000_000){
        reject(new Error("Payload muito grande"));
        req.destroy();
      }
    });
    req.on("end", function(){
      if(!body) return resolve({});
      try{
        resolve(JSON.parse(body));
      }catch(err){
        reject(new Error("JSON invalido"));
      }
    });
    req.on("error", reject);
  });
}

function userIdFrom(req){
  return req.headers["x-maru-user"] || "default";
}

async function handleApi(req, res, pathname){
  if(req.method === "GET" && pathname === "/api/health"){
    sendJson(res, 200, { ok: true, name: "maru" });
    return;
  }

  if(req.method === "GET" && pathname === "/api/content"){
    sendJson(res, 200, {
      data: DATA,
      levels: LEVELS,
      levelMeta: LEVEL_META,
      catLabel: CAT_LABEL,
      catLabelSingular: CAT_LABEL_SING,
      kanaRows: KANA_ROWS,
      kanaGroups: KANA_GROUPS,
      kana: KANA,
      builderPatterns: BUILDER_PATTERNS
    });
    return;
  }

  if(req.method === "GET" && pathname === "/api/progress"){
    sendJson(res, 200, await readProgress(userIdFrom(req)));
    return;
  }

  if((req.method === "PUT" || req.method === "POST") && pathname === "/api/progress"){
    const body = await readBody(req);
    sendJson(res, 200, await writeProgress(body, userIdFrom(req)));
    return;
  }

  if(req.method === "POST" && pathname === "/api/phrase/check"){
    const body = await readBody(req);
    sendJson(res, 200, checkPhrase(body));
    return;
  }

  sendError(res, 404, "Endpoint nao encontrado");
}

async function sendFile(res, target){
  const stat = await fs.stat(target);
  if(!stat.isFile()) throw new Error("not-file");
  const ext = path.extname(target).toLowerCase();
  const data = await fs.readFile(target);
  res.writeHead(200, {
    "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
    "Content-Length": data.length
  });
  res.end(data);
}

async function sendStatic(req, res, pathname){
  if(pathname === "/vendor/animejs/anime.esm.min.js"){
    await sendFile(res, ANIMEJS_FILE);
    return;
  }
  if(pathname === "/vendor/react/react.production.min.js"){
    await sendFile(res, REACT_FILE);
    return;
  }
  if(pathname === "/vendor/react-dom/react-dom.production.min.js"){
    await sendFile(res, REACT_DOM_FILE);
    return;
  }

  const isShared = pathname.startsWith("/shared/");
  const baseDir = isShared ? SHARED_DIR : FRONTEND_DIR;
  const requested = pathname === "/"
    ? "/index.html"
    : decodeURIComponent(isShared ? pathname.slice("/shared".length) : pathname);
  const target = path.resolve(baseDir, "." + requested);
  const relative = path.relative(baseDir, target);
  const safeTarget = relative && (relative.startsWith("..") || path.isAbsolute(relative))
    ? path.join(FRONTEND_DIR, "index.html")
    : target;

  try{
    await sendFile(res, safeTarget);
  }catch(err){
    if(path.extname(pathname)){
      sendError(res, 404, "Arquivo nao encontrado");
      return;
    }
    const fallback = await fs.readFile(path.join(FRONTEND_DIR, "index.html"));
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[".html"],
      "Content-Length": fallback.length
    });
    res.end(fallback);
  }
}

const server = http.createServer(async function(req, res){
  try{
    const url = new URL(req.url || "/", "http://localhost");
    if(url.pathname.startsWith("/api/")){
      await handleApi(req, res, url.pathname);
      return;
    }
    await sendStatic(req, res, url.pathname);
  }catch(err){
    sendError(res, 500, err && err.message ? err.message : "Erro interno");
  }
});

server.listen(PORT, HOST, function(){
  console.log("Maru rodando em http://" + HOST + ":" + PORT);
});
