function countCoated(days, k) {
    const ev = new Map();
    for (const [a, b] of days) {
        ev.set(a, (ev.get(a) || 0) + 1);
        ev.set(b + 1, (ev.get(b + 1) || 0) - 1);
    }
    const xs = [...ev.keys()].sort((p, q) => p - q);
    let total = 0, coats = 0;
    for (let i = 0; i < xs.length; i++) {
        if (i && coats >= k) total += xs[i] - xs[i - 1];
        coats += ev.get(xs[i]);
    }
    return total;
}
