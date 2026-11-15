function typedText(s) {
    const out = [];
    for (const ch of s) {
        if (ch === "_") out.pop(); else out.push(ch);
    }
    return out.join("");
}
