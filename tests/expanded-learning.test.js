import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, statSync } from "node:fs";
import { audioCatalog } from "../scripts/audio-catalog.js";
import { audioKey } from "../shared/audioText.js";
import { VOCABULARY } from "../shared/vocabulary.js";
import { GLOSSARY, conceptsIn } from "../shared/glossary.js";
import { EXERCISE_GROUPS } from "../shared/exercises.js";
import { EXPRESSIONS, SENTENCES } from "../shared/catalog.js";
import { normalizeSnapshot, mergeSnapshots, recordReview, completeLesson } from "../shared/progress.js";
import { playerLevel, ACHIEVEMENTS, dailyMissions } from "../shared/gamification.js";
import { checkGuidedSentence } from "../shared/sentenceCheck.js";

test("visual and audio preferences migrate safely and survive a newer local snapshot", () => {
  const legacy = normalizeSnapshot({ xp: {total: 42} });
  assert.equal(legacy.preferences.theme,"dojo");
  assert.equal(legacy.preferences.audioRate,1);
  assert.equal(legacy.preferences.soundEffects,true);
  assert.equal(legacy.stats.writingSessions,0);
  const invalid = normalizeSnapshot({preferences:{theme:"unknown",audioRate:-1}});
  assert.equal(invalid.preferences.theme,"dojo");
  assert.equal(invalid.preferences.audioRate,1);
  const local = normalizeSnapshot({updatedAt:200,preferences:{theme:"arcade",audioRate:.75,soundEffects:false},stats:{writingSessions:3}});
  const merged = mergeSnapshots(local,{updatedAt:100,preferences:{theme:"dojo"}});
  assert.equal(merged.preferences.theme,"arcade");
  assert.equal(merged.preferences.audioRate,.75);
  assert.equal(merged.preferences.soundEffects,false);
  assert.equal(merged.stats.writingSessions,3);
});

test("levels, missions and achievements reflect recorded actions, including wrong attempts", () => {
  const p=normalizeSnapshot();
  assert.deepEqual(ACHIEVEMENTS.filter(item=>item.test(p)),[]);
  assert.equal(playerLevel(0).level,1);
  assert.equal(playerLevel(49).level,1);
  assert.equal(playerLevel(50).level,2);
  assert.equal(playerLevel(50).earned,0);
  assert.equal(playerLevel(200).level,3);
  for(let i=0;i<5;i++)recordReview(p,"listen-word-"+i,i!==0);
  assert.equal(ACHIEVEMENTS.find(item=>item.id==="ears").test(p),false);
  recordReview(p,"listen-word-0",true);
  assert.equal(ACHIEVEMENTS.find(item=>item.id==="ears").test(p),true);
  completeLesson(p,"welcome",3);
  const missions=dailyMissions(p);
  assert.equal(missions[0].current,5);
  assert.equal(missions[1].current,1);
  assert.equal(missions[2].current,5);
});

test("every authored exercise has one answer, distinct choices and a teaching explanation", () => {
  const items=EXERCISE_GROUPS.flatMap(group=>group.items);
  assert.equal(new Set(items.map(item=>item.id)).size,items.length);
  assert.ok(VOCABULARY.length>=60);
  assert.equal(EXPRESSIONS.length,50);
  assert.equal(SENTENCES.length,32);
  for(const item of items){
    assert.ok(item.prompt && item.answer && item.speech && item.explanation,item.id);
    if(item.choices){
      assert.equal(item.choices.filter(choice=>choice===item.answer).length,1,item.id);
      assert.equal(new Set(item.choices).size,4,item.id);
    }
  }
  assert.ok(GLOSSARY.length>=25);
  assert.ok(conceptsIn("A partícula marca o objeto.").some(item=>item.id==="particle"));
  assert.ok(!conceptsIn("O superverbo inventado").some(item=>item.id==="verb"));
});

test("expanded sentence models accept the kana reading and reject wrong particles or tense", () => {
  assert.equal(checkGuidedSentence("home-study","いえでにほんごをべんきょうします").correct,true);
  assert.equal(checkGuidedSentence("cat-here","ここにねこがいます").correct,true);
  assert.equal(checkGuidedSentence("ate","きのうパンをたべました").correct,true);
  assert.equal(checkGuidedSentence("past-negative","きのうほんをよみませんでした").correct,true);
  assert.equal(checkGuidedSentence("cat-here","ここで猫がいます").correct,false);
  assert.equal(checkGuidedSentence("ate","昨日パンを食べます").correct,false);
});

test("all study pronunciations resolve to nonempty local MP3s, including listening activities", () => {
  const manifest=JSON.parse(readFileSync(new URL("../frontend/assets/data/audio.json",import.meta.url)));
  const entries=audioCatalog();
  assert.equal(Object.keys(manifest.clips).length,entries.length);
  for(const entry of entries){
    const url=manifest.clips[entry.key];
    assert.equal(url,"/assets/audio/"+entry.file,entry.text);
    const file=new URL("../frontend"+url,import.meta.url);
    assert.ok(statSync(file).size>1000,entry.text);
    const data=readFileSync(file);
    assert.equal(data.subarray(0,3).toString(),"ID3",entry.text);
  }
  for(const item of EXERCISE_GROUPS.flatMap(group=>group.items))assert.ok(manifest.clips[audioKey(item.speech)],item.id);
  assert.equal(audioKey("こんにちは。"),audioKey("こんにちは"));
});
