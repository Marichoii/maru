import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { ALL_KANA, BEGINNER_KANJI, PARTICLES, EXPRESSIONS, SENTENCES } from "../shared/catalog.js";
import { VOCABULARY } from "../shared/vocabulary.js";
import { LESSONS } from "../shared/curriculum.js";
import { DATA } from "../shared/content.js";
import { PARTICLE_EXERCISES, SITUATION_EXERCISES } from "../shared/exercises.js";
import { audioKey } from "../shared/audioText.js";

export function audioCatalog() {
  const entries = new Map();
  const add = (text, spoken = text) => {
    const key = audioKey(text);
    if (key && /[ぁ-ヺ一-龯]/u.test(key) && !entries.has(key)) entries.set(key, { key, text, spoken });
  };
  // Standalone characters and ambiguous words use the reading actually taught.
  ALL_KANA.forEach(item => add(item.char, item.char === "を" || item.char === "ヲ" ? "お" : item.char));
  BEGINNER_KANJI.forEach(item => { add(item.char, item.reading); add(item.word, item.wordReading); });
  VOCABULARY.forEach(item => add(item.jp, item.reading));
  SENTENCES.forEach(item => item.tokens.forEach(token => add(token[0], token[3] || token[0])));
  VOCABULARY.forEach(item => add(item.sentence));
  LESSONS.forEach(lesson => lesson.sections.forEach(section => section.examples.forEach(item => add(item.jp))));
  PARTICLES.forEach(item => add(item.jp));
  EXPRESSIONS.forEach(item => add(item.jp));
  SENTENCES.forEach(item => add(item.tokens.map(token => token[0]).join("") + "。"));
  DATA.forEach(item => add(item.example));
  [...PARTICLE_EXERCISES, ...SITUATION_EXERCISES].forEach(item => add(item.speech));
  add("こんにちは");
  return [...entries.values()].map(item => ({ ...item, file: createHash("sha256").update("kokoro-82m-jf-alpha-v1|" + item.spoken).digest("hex").slice(0, 20) + ".mp3" }));
}
if (process.argv[1]?.endsWith("audio-catalog.js")) {
  const output = process.argv[2] || "/tmp/maru-audio-catalog.json";
  const entries = audioCatalog();
  writeFileSync(output, JSON.stringify(entries, null, 2));
  console.log(entries.length + " pronunciations written to " + output);
}
