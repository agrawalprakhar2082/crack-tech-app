function minArrows(balloons) {
    const sorted = [...balloons].sort((p, q) => (p[1] < q[1] ? -1 : p[1] > q[1] ? 1 : 0));
    let arrows = 0, last = null;
    for (const [s, e] of sorted) {
        if (last === null || s > last) { arrows++; last = e; }
    }
    return arrows;
}
