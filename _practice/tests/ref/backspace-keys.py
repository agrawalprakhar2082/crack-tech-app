def typed_text(s: str) -> str:
    out = []
    for ch in s:
        if ch == "_":
            if out:
                out.pop()
        else:
            out.append(ch)
    return "".join(out)
