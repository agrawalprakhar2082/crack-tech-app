function daysUntilWarmer(temps) {
    const out = new Array(temps.length).fill(0), stack = [];
    for (let i = 0; i < temps.length; i++) {
        while (stack.length && temps[stack[stack.length - 1]] < temps[i]) { const j = stack.pop(); out[j] = i - j; }
        stack.push(i);
    }
    return out;
}
