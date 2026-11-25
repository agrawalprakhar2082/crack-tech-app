# Mixes small synthesized sound effects (sfx.json from render.js) under narration.wav -> mix.wav.
# All sounds are generated here (no third-party audio). Kinds: tick, tick2, off, found, whoosh.
import json, sys
import numpy as np, soundfile as sf
d = sys.argv[1]; SR = 24000
voice, sr = sf.read(f"{d}/narration.wav", dtype="float32"); assert sr == SR
t = lambda s: np.arange(int(s * SR)) / SR
def env(x, a=.004, k=30): e = np.exp(-k * t(len(x) / SR)); n = int(a * SR); e[:n] *= np.linspace(0, 1, n); return x * e
S = {"tick": env(np.sin(2 * np.pi * 1300 * t(.06)), k=60) * .5,
     "tick2": env(np.sin(2 * np.pi * 900 * t(.05)), k=70) * .3,
     "off": env(np.sign(np.sin(2 * np.pi * 140 * t(.16))) * .5 + np.sin(2 * np.pi * 95 * t(.16)), k=18) * .32,
     "found": np.concatenate([env(np.sin(2 * np.pi * f * t(.16)), k=16) for f in (880, 1320)]) * .45 + 0,
     "whoosh": env(np.random.default_rng(1).normal(0, 1, int(.28 * SR)) * np.sin(np.pi * t(.28) / .28), k=8) * .08}
out = np.zeros(len(voice) + SR, dtype=np.float32)
for e in json.load(open(f"{d}/sfx.json")):
    s = S[e["kind"]]; i = int(e["t"] * SR); out[i:i + len(s)] += s[:max(0, len(out) - i)]
out[:len(voice)] += voice
out = out[:len(voice)] / max(1.0, np.abs(out).max() / .95)
sf.write(f"{d}/mix.wav", out, SR); print("mixed", len(json.load(open(f"{d}/sfx.json"))), "sounds")
