# Builds the YouTube Short and Instagram Reel folders for one visual explainer video.
# Usage: python3 _content/visual/make.py <spec.json> <outdir> [--theme neon|olive]
# Writes <outdir>/yt and <outdir>/ig, each with frame.html + script.json; then run render.sh on each.
# Spec: name, frame (the video's HTML in this folder), speed, scenes [{id, lines:[[spoken, caption]]}],
#   cta_yt / cta_ig: lines for the ending scene ("cta"). Captions mark the highlighted words with *...*.
#   Optional: voice + lang for another language, e.g. Hindi "voice": "hm_omega", "lang": "hi" (spoken text in Devanagari).
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = json.load(open(sys.argv[1])); out = sys.argv[2]
theme = sys.argv[sys.argv.index("--theme") + 1] if "--theme" in sys.argv else spec.get("theme", "neon")
CTA = {"yt": '<div class="btn yt">▶ Subscribe</div><div class="site">cracktech.app</div>',
       "ig": '<div class="btn ig">Follow</div><div class="site">🔖 Save for later</div>'}
tpl = open(os.path.join(HERE, spec["frame"])).read()
for k, v in {"{{THEME_CSS}}": open(f"{HERE}/theme.css").read(), "{{RUNTIME}}": open(f"{HERE}/runtime.js").read(), "{{THEME}}": theme}.items():
    tpl = tpl.replace(k, v)
for plat in ("yt", "ig"):
    d = f"{out}/{plat}"; os.makedirs(d, exist_ok=True)
    open(f"{d}/frame.html", "w").write(tpl.replace("{{CTA}}", CTA[plat]))
    scenes = spec["scenes"] + [{"id": "cta", "lines": spec["cta_" + plat]}]
    json.dump({"voice": spec.get("voice", "am_michael"), "lang": spec.get("lang", "en-us"), "speed": spec.get("speed", 1.1), "lead": 0.05, "gap_line": 0.18, "gap_scene": 0.3,
               "tail": 1.2 if plat == "yt" else 0.5, "name": f'{spec["name"]}-{theme}' + ("-short" if plat == "yt" else "-reel"),
               "scenes": scenes}, open(f"{d}/script.json", "w"), indent=1, ensure_ascii=False)
print("ok:", f"{out}/yt", f"{out}/ig")
