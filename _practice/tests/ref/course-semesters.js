function minSemesters(n, prereqs) {
    const adj = Array.from({ length: n }, () => []), indeg = new Array(n).fill(0);
    for (const [a, b] of prereqs) { adj[a].push(b); indeg[b]++; }
    let level = [];
    for (let i = 0; i < n; i++) if (!indeg[i]) level.push(i);
    let semesters = 0, taken = 0;
    while (level.length) {
        semesters++; taken += level.length;
        const next = [];
        for (const u of level) for (const v of adj[u]) if (--indeg[v] === 0) next.push(v);
        level = next;
    }
    return taken === n ? semesters : -1;
}
