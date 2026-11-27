# Original 8-bit (chiptune) loop for the BFS Reel, on the page's beat grid (default 144 BPM, 24 beats = 10 s); loops seamlessly.
# Square-wave bass and arpeggio over Am-F-C-G, noise drums, and game-style bleeps on BFS events
# from sfx.json (pop = visit a node, pitch rises with the level or depth; enq = added to the queue; back = return (DFS);
# seen = already visited; clear = all done). Everything is synthesized here: no samples, no
# existing melodies. Usage: python3 bfs_music.py <dir> [bpm beats]  -> <dir>/music.wav (beats a multiple of 4)
import json, sys
import numpy as np, soundfile as sf
d = sys.argv[1]; SR = 44100; BPM = float(sys.argv[2]) if len(sys.argv) > 2 else 144; BEAT = 60 / BPM; BEATS = int(sys.argv[3]) if len(sys.argv) > 3 else 24; L = int(round(BEATS * BEAT * SR))
out = np.zeros(L + SR * 2)
def note(m): return 440 * 2 ** ((m - 69) / 12)
def sq(f, dur, duty=.5, vol=.2, dec=6.0, sweep=None):
    n = int(dur * SR); t = np.arange(n) / SR
    ph = np.cumsum((f if sweep is None else np.linspace(f, sweep, n)) / SR)
    w = np.where(ph % 1 < duty, 1.0, -1.0) * np.exp(-dec * t)
    a = int(.003 * SR); w[:a] *= np.linspace(0, 1, a); w[-a:] *= np.linspace(1, 0, a)
    return w * vol
def noise(dur, vol, dec, hp=False):
    n = int(dur * SR); w = np.random.default_rng(7).uniform(-1, 1, n)
    if hp: w = np.diff(w, prepend=0)
    return w * np.exp(-dec * np.arange(n) / SR) * vol
def put(w, beat):
    i = int(round(beat * BEAT * SR)); out[i:i + len(w)] += w[:len(out) - i]
CHORDS = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [48, 52, 55]), (55, [55, 59, 62])]   # Am F C G
PROG = [0, 1, 2, 3] * (BEATS // 16) + ([1, 3] if BEATS % 16 == 8 else [])          # 6 bars: Am F C G F G
for bar in range(BEATS // 4):
    root, tones = CHORDS[PROG[bar]]
    for k, off in enumerate([0, 1, 1.5, 2, 3, 3.5]):                      # bass groove
        put(sq(note(root - 12 + (12 if k in (2, 5) else 0)), BEAT * .45, .5, .16, 7), bar * 4 + off)
    for s in range(16):                                                   # 16th arpeggio
        put(sq(note(tones[s % 3] + 12), BEAT * .22, .25, .035, 14), bar * 4 + s * .25)
    for b in range(4):
        put(sq(150, .12, .5, .3, 25, sweep=45), bar * 4 + b)               # kick
        if b in (1, 3): put(noise(.12, .18, 28), bar * 4 + b)              # snare
        put(noise(.04, .05, 90, hp=True), bar * 4 + b + .5)                # hat
PENTA = [69, 72, 74, 76, 79, 81, 84, 86, 88, 91]
for e in json.load(open(f"{d}/sfx.json")):
    b = e["t"] / BEAT; lv = min(e.get("lvl", 0), len(PENTA) - 1)
    if e["kind"] == "pop": put(sq(note(PENTA[lv] + 12), .16, .5, .14, 10), b); put(sq(note(PENTA[lv] + 24), .1, .25, .06, 16), b + .25)
    elif e["kind"] == "enq": put(sq(note(PENTA[lv] + 7), .07, .125, .08, 30), b)
    elif e["kind"] == "back": put(sq(note(PENTA[lv]), .09, .25, .06, 22, sweep=note(PENTA[lv]) * .8), b)
    elif e["kind"] == "seen": put(sq(330, .14, .5, .1, 14, sweep=160), b)
    elif e["kind"] == "clear":
        for j, m in enumerate([69, 72, 76, 81, 84]): put(sq(note(m + 12), .14, .5, .12, 9), b + j * .25)
# wrap the tail into the start so the loop is seamless
mix = out[:L].copy(); mix[:len(out) - L] += out[L:]
mix = mix / np.abs(mix).max() * .9
sf.write(f"{d}/music.wav", mix, SR); print("music", round(L / SR, 3), "s")
