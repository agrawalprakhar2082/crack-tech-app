# Builds a YouTube Short and its Instagram Reel cut from one spec.
# Usage: python3 _content/video/make_short.py <spec.json> <outdir>
# Writes <outdir>/yt/ and <outdir>/ig/, each with frame.html + script.json (+ thumb.png if "thumb" is set).
# Then run render.sh on each folder.
#
# Spec (see examples/ai-terms-part-5.json):
#   name: file name stem, topic: top-right label, speed (default 1.2), thumb (optional image for the CTA card)
#   css: extra CSS for this video's visuals
#   scenes: exactly hook, t1, t2, t3 (the progress bar has 3 steps), each {id, html, lines:[[spoken, caption]]}
#     html uses class "a" + data-l="<line index>" to animate an element in when that line is spoken.
#   cta_yt / cta_ig: {html, lines} for the ending. YouTube says Subscribe and "linked below";
#     Instagram says Follow, Save, "on my profile" and "link in bio" (Instagram has no links under a Reel).
import json, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = json.load(open(sys.argv[1]))
out = sys.argv[2]
base = open(f"{HERE}/template.html").read().replace("{{TOPIC}}", spec.get("topic", "System design"))
if spec.get("css"):
    base = base.replace(".cap{position:absolute", spec["css"] + "\n.cap{position:absolute", 1)

# Instagram: move everything inside the area its UI leaves clear, and use a Follow button colour.
IG = [(".top{position:absolute;left:80px;right:80px;top:150px", ".top{position:absolute;left:80px;right:80px;top:230px"),
      (".prog{position:absolute;left:80px;right:80px;top:225px", ".prog{position:absolute;left:80px;right:80px;top:305px"),
      (".scene{position:absolute;left:80px;right:80px;top:300px;bottom:620px", ".scene{position:absolute;left:80px;right:80px;top:350px;bottom:560px"),
      (".cap{position:absolute;left:80px;right:80px;top:1340px", ".cap{position:absolute;left:70px;right:150px;top:1335px"),
      ("background:#e5322d;color:#fff;box-shadow:0 10px 30px rgba(229,50,45,.35)", "background:#0095f6;color:#fff;box-shadow:0 10px 30px rgba(0,149,246,.35)")]

for plat in ("yt", "ig"):
    d = f"{out}/{plat}"; os.makedirs(d, exist_ok=True)
    cta = spec["cta_" + plat]
    scenes = spec["scenes"] + [{"id": "cta", "html": cta["html"], "lines": cta["lines"]}]
    assert [s["id"] for s in scenes] == ["hook", "t1", "t2", "t3", "cta"], "scenes must be hook, t1, t2, t3"
    body = "".join(f'\n <div class="scene" data-s="{s["id"]}">\n  {s["html"]}\n </div>\n' for s in scenes)
    h = base.replace("{{SCENES}}", body)
    if plat == "ig":
        for a, b in IG:
            assert a in h, a[:40]; h = h.replace(a, b)
    open(f"{d}/frame.html", "w").write(h)
    json.dump({"voice": "am_michael", "speed": spec.get("speed", 1.2), "lead": 0.05, "gap_line": 0.12, "gap_scene": 0.25,
               "tail": 1.6 if plat == "yt" else 0.9, "name": spec["name"] + ("" if plat == "yt" else "-reel"),
               "scenes": [{"id": s["id"], "lines": s["lines"]} for s in scenes]},
              open(f"{d}/script.json", "w"), indent=1, ensure_ascii=False)
    if spec.get("thumb"): shutil.copy(spec["thumb"], f"{d}/thumb.png")
print("ok:", out + "/yt", out + "/ig")
