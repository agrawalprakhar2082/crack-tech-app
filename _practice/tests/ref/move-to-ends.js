function minMoves(a, b) {
    const pos = new Map(b.map((v, i) => [v, i]));
    let best = 0, run = 0;
    for (let i = 0; i < a.length; i++) {
        run = i && pos.get(a[i]) > pos.get(a[i - 1]) ? run + 1 : 1;
        best = Math.max(best, run);
    }
    return a.length - best;
}
