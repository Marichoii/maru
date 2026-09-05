import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeSnapshot } from "../shared/progress.js";

const defaultDirectory = fileURLToPath(new URL("../data/progress/", import.meta.url));

export function createProgressStorage(directory = process.env.MARU_DATA_DIR || defaultDirectory) {
  const queues = new Map();
  const file = userId => {
    const id = String(userId || "default").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "default";
    return path.join(directory, id + ".json");
  };
  return {
    async read(userId) {
      try { return normalizeSnapshot(JSON.parse(await fs.readFile(file(userId), "utf8"))); }
      catch (error) { if (error.code === "ENOENT") return normalizeSnapshot(); throw error; }
    },
    async write(snapshot, userId) {
      const target = file(userId);
      const normalized = normalizeSnapshot(snapshot);
      const write = async () => {
        await fs.mkdir(directory, { recursive: true });
        const temporary = target + ".tmp";
        await fs.writeFile(temporary, JSON.stringify(normalized, null, 2) + "\n", "utf8");
        await fs.rename(temporary, target);
        return normalized;
      };
      // Serialize writes per profile so simultaneous requests cannot share a temp file.
      const pending = (queues.get(target) || Promise.resolve()).catch(() => {}).then(write);
      queues.set(target, pending);
      try { return await pending; }
      finally { if (queues.get(target) === pending) queues.delete(target); }
    }
  };
}

const storage = createProgressStorage();
export const readProgress = userId => storage.read(userId);
export const writeProgress = (snapshot, userId) => storage.write(snapshot, userId);
