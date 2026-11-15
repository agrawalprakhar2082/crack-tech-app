function minRemoveToValid(s) {
    const keep = s.split(""), open = [];
    for (let i = 0; i < s.length; i++) {
        if (s[i] === "(") open.push(i);
        else if (s[i] === ")") { if (open.length) open.pop(); else keep[i] = ""; }
    }
    for (const i of open) keep[i] = "";
    return keep.join("");
}
