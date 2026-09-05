"""Vendor the KanjiVG path data used by the writing notebook (CC BY-SA 3.0).

Run explicitly when updating the reference data; never needed at app startup.
"""
import concurrent.futures
import json
from pathlib import Path
import subprocess
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
SOURCE = "https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/"

chars = json.loads(subprocess.check_output([
    "node", "--input-type=module", "-e",
    "import {KANA} from './shared/content.js';"
    "import {BEGINNER_KANJI} from './shared/catalog.js';"
    "console.log(JSON.stringify([...new Set([...KANA,...BEGINNER_KANJI].map(x=>x.char))]));"
], cwd=ROOT, text=True))

def fetch(char):
    code = format(ord(char), "05x")
    with urllib.request.urlopen(SOURCE + code + ".svg", timeout=30) as response:
        root = ET.fromstring(response.read())
    paths = [element.attrib["d"] for element in root.iter()
             if element.tag.endswith("}path") and "-s" in element.attrib.get("id", "")]
    if not paths:
        raise ValueError("No strokes for " + char)
    return char, paths

with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
    data = dict(executor.map(fetch, chars))

target = ROOT / "frontend/assets/data/strokes.json"
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps({
    "source": "KanjiVG · Ulrich Apel and contributors",
    "license": "CC BY-SA 3.0",
    "url": "https://kanjivg.tagaini.net/",
    "changes": "Extracted and grouped ordered SVG path data by character.",
    "characters": data
}, ensure_ascii=False, separators=(",", ":")) + "\n")
print("Saved stroke models for", len(data), "characters.")
