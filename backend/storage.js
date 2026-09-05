import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(process.cwd(), "data", "progress");

const EMPTY_PROGRESS = {
  progress: {},
  streak: { count: 0, lastDate: "" },
  xp: { total: 0 },
  stats: { sentencesWritten: 0, focusSessions: 0 },
  kanaStats: {}
};

function clone(value){
  return JSON.parse(JSON.stringify(value));
}

function safeUserId(userId){
  return String(userId || "default").replace(/[^a-zA-Z0-9_-]/g, "_") || "default";
}

function progressPath(userId){
  return path.join(DATA_DIR, safeUserId(userId) + ".json");
}

function isRecord(value){
  return value && typeof value === "object" && !Array.isArray(value);
}

function normalizeSnapshot(input){
  const snapshot = isRecord(input) ? input : {};
  return {
    progress: isRecord(snapshot.progress) ? snapshot.progress : {},
    streak: isRecord(snapshot.streak) ? {
      count: Number(snapshot.streak.count) || 0,
      lastDate: typeof snapshot.streak.lastDate === "string" ? snapshot.streak.lastDate : ""
    } : clone(EMPTY_PROGRESS.streak),
    xp: isRecord(snapshot.xp) ? {
      total: Number(snapshot.xp.total) || 0
    } : clone(EMPTY_PROGRESS.xp),
    stats: isRecord(snapshot.stats) ? {
      sentencesWritten: Number(snapshot.stats.sentencesWritten) || 0,
      focusSessions: Number(snapshot.stats.focusSessions) || 0
    } : clone(EMPTY_PROGRESS.stats),
    kanaStats: isRecord(snapshot.kanaStats) ? snapshot.kanaStats : {}
  };
}

export async function readProgress(userId){
  try{
    const raw = await fs.readFile(progressPath(userId), "utf8");
    return normalizeSnapshot(JSON.parse(raw));
  }catch(err){
    if(err && err.code === "ENOENT") return clone(EMPTY_PROGRESS);
    throw err;
  }
}

export async function writeProgress(snapshot, userId){
  await fs.mkdir(DATA_DIR, { recursive: true });
  const normalized = normalizeSnapshot(snapshot);
  const target = progressPath(userId);
  const tmp = target + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(normalized, null, 2), "utf8");
  await fs.rename(tmp, target);
  return normalized;
}
