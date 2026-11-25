# Voice-over for a Short/Reel: reads <dir>/script.json, writes narration.wav and timeline.json.
# Voice: Kokoro TTS (kokoro-onnx), "am_michael" (the owner chose this AI male voice).
# Hindi: "voice": "hm_omega", "lang": "hi" in script.json (spoken text in Devanagari).
# Hinglish (preferred): "voice": "hm_omega:0.7+am_michael:0.3", "lang": "hinglish" (see hinglish.py).
# Model files (about 340 MB, not in git) go in _content/video/model/:
#   https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
#   https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
# Usage: python3 _content/video/synth.py <dir>
# script.json: {"voice","speed","lead","gap_line","gap_scene","tail","scenes":[{"id","lines":[[spoken, caption], ...]}]}
# "spoken" is what the voice says (spell numbers and "crack tech dot app" out), "caption" is what's shown.
import json, os, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

d = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
model = os.environ.get("KOKORO_DIR", os.path.join(here, "model"))
cfg = json.load(open(f"{d}/script.json"))
LEAD, GL, GS, TAIL = cfg.get("lead", .05), cfg.get("gap_line", .12), cfg.get("gap_scene", .25), cfg.get("tail", 1.6)
k = Kokoro(f"{model}/kokoro-v1.0.onnx", f"{model}/voices-v1.0.bin")
# "lang": "hinglish": Hindi words in Devanagari, English words in Latin letters, each pronounced in its own
# language (hinglish.py); "voice" may be a blend like "hm_omega:0.7+am_michael:0.3" (the owner's pick, Nov 2026).
HINGLISH = cfg.get("lang") == "hinglish"
if HINGLISH or ":" in cfg.get("voice", ""):
    sys.path.insert(0, here); import hinglish
VOICE = hinglish.voice_style(k, cfg.get("voice", "am_michael")) if ":" in cfg.get("voice", "") else cfg.get("voice", "am_michael")
SR = 24000
z = lambda s: np.zeros(int(s * SR), dtype=np.float32)
audio, t, timeline = [z(LEAD)], LEAD, []
for si, sc in enumerate(cfg["scenes"]):
    scene = {"id": sc["id"], "start": 0.0 if si == 0 else round(t, 3), "lines": []}
    for li, (spoken, caption) in enumerate(sc["lines"]):
        if HINGLISH: s, sr = k.create(hinglish.phonemes(k, spoken), voice=VOICE, speed=cfg.get("speed", 1.18), is_phonemes=True)
        else: s, sr = k.create(spoken, voice=VOICE, speed=cfg.get("speed", 1.18), lang=cfg.get("lang", "en-us"))
        s = np.asarray(s, dtype=np.float32)
        nz = np.where(np.abs(s) > 0.01)[0]
        if len(nz): s = s[max(0, nz[0] - int(.03 * sr)):nz[-1] + int(.06 * sr)]
        dur = len(s) / sr
        scene["lines"].append({"start": round(t, 3), "end": round(t + dur, 3), "text": caption})
        audio.append(s); t += dur
        g = GL if li < len(sc["lines"]) - 1 else (GS if si < len(cfg["scenes"]) - 1 else TAIL)
        audio.append(z(g)); t += g
    scene["end"] = round(t, 3); timeline.append(scene)
a = np.concatenate(audio); a = a / max(1e-6, np.abs(a).max()) * 0.89
sf.write(f"{d}/narration.wav", a, SR)
json.dump({"duration": round(t, 3), "scenes": timeline}, open(f"{d}/timeline.json", "w"), indent=1)
print("duration", round(t, 2))
