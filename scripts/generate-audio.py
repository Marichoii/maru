"""Generate resumable, local Japanese MP3 assets. Not needed to run the site.

Run node scripts/audio-catalog.js first. Python deps are in requirements-audio.txt.
The open Kokoro model is fetched only on the generator's first run, never by users.
"""
import argparse
import json
import pathlib
import subprocess
import tempfile
import numpy as np
import soundfile as sf
import torch
from kokoro import KPipeline

parser = argparse.ArgumentParser()
parser.add_argument("catalog", nargs="?", default="/tmp/maru-audio-catalog.json")
parser.add_argument("--limit", type=int, default=0)
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parents[1]
directory = root / "frontend/assets/audio"
directory.mkdir(parents=True, exist_ok=True)
manifest_path = root / "frontend/assets/data/audio.json"
entries = json.loads(pathlib.Path(args.catalog).read_text())
torch.set_num_threads(4)
pipeline = None
generated = 0
manifest = {"version": 1, "source": "Kokoro-82M", "voice": "jf_alpha", "synthetic": True, "clips": {}}
try:
    for i, item in enumerate(entries):
        target = directory / item["file"]
        if not target.exists():
            if args.limit and generated >= args.limit:
                continue
            if pipeline is None:
                pipeline = KPipeline(lang_code="j", repo_id="hexgrad/Kokoro-82M", device="cpu")
            chunks = [r.audio.numpy() for r in pipeline(item["spoken"], voice="jf_alpha", speed=0.9) if r.audio is not None]
            if not chunks:
                raise RuntimeError("No audio generated: " + item["text"])
            wave = np.concatenate([np.zeros(1800), *chunks, np.zeros(3600)])
            if not np.isfinite(wave).all() or np.max(np.abs(wave)) < 0.005:
                raise RuntimeError("Empty or invalid waveform: " + item["text"])
            with tempfile.TemporaryDirectory(prefix="maru-voice-") as temporary:
                wav = pathlib.Path(temporary) / "voice.wav"
                mp3 = pathlib.Path(temporary) / "voice.mp3"
                sf.write(wav, wave, 24000)
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-ac", "1", "-b:a", "64k", str(mp3)], check=True)
                target.write_bytes(mp3.read_bytes())
            generated += 1
            print(str(i + 1) + "/" + str(len(entries)) + " " + item["text"], flush=True)
        manifest["clips"][item["key"]] = "/assets/audio/" + item["file"]
finally:
    # Keep valid completed clips usable even when interrupted; rerun to resume.
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print("Ready: " + str(len(manifest["clips"])) + " pronunciations; new files: " + str(generated), flush=True)
