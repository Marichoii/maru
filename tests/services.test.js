import assert from "node:assert/strict";
import test from "node:test";
import { checkPhrase } from "../backend/phraseService.js";
import { BUILDER_PATTERNS, DATA, KANA, LEVELS } from "../shared/content.js";

test("shared study content is available", function(){
  assert.equal(LEVELS.length, 5);
  assert.equal(DATA.length, 120);
  assert.equal(KANA.length, 142);
  assert.ok(BUILDER_PATTERNS.length >= 5);
});

test("phrase checker accepts a sentence using the requested item", function(){
  const result = checkPhrase({
    level: "N5",
    text: "私は日本語が好きです。",
    item: { term: "好き", example: "音楽が好きです。" }
  });

  assert.equal(result.nota, "ótimo");
  assert.equal(result.frase_corrigida, "私は日本語が好きです。");
});

test("phrase checker rejects non Japanese input", function(){
  const result = checkPhrase({
    level: "N5",
    text: "eu gosto de japones",
    item: { term: "好き", example: "音楽が好きです。" }
  });

  assert.equal(result.nota, "precisa melhorar");
});
