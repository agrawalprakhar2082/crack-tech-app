# Hinglish pronunciation for Kokoro: Hindi words (Devanagari) get Hindi phonemes, English words
# (Latin letters) get English phonemes, then one voice speaks the joined phonemes.
# Write spoken text like: "यह robot flag तक कितने ways से पहुँच सकता है?"
import re
DEV = re.compile(r'[ऀ-ॿ]')
LAT = re.compile(r'[A-Za-z]')

def runs(text):
    out, cur, kind = [], '', None
    for tok in re.findall(r'\S+|\s+', text):
        k = 'hi' if DEV.search(tok) else 'en' if LAT.search(tok) else kind
        if kind is not None and k != kind and cur.strip():
            out.append((kind, cur)); cur = ''
        cur += tok; kind = k or kind
    if cur.strip(): out.append((kind or 'en', cur))
    return out

def phonemes(k, text):
    ps = []
    for lang, chunk in runs(text):
        ps.append(k.tokenizer.phonemize(chunk.strip(), 'hi' if lang == 'hi' else 'en-us'))
    return ' '.join(p for p in ps if p)

def voice_style(k, spec):
    """'hm_psi' or a blend 'hm_psi:0.7+am_michael:0.3'."""
    if '+' not in spec and ':' not in spec: return spec
    style = None
    for part in spec.split('+'):
        name, w = part.split(':'); v = k.get_voice_style(name) * float(w)
        style = v if style is None else style + v
    return style
