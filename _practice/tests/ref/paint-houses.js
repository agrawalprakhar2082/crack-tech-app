function minPaintCost(costs) {
    let a = 0, b = 0, c = 0;
    for (const [x, y, z] of costs) [a, b, c] = [x + Math.min(b, c), y + Math.min(a, c), z + Math.min(a, b)];
    return Math.min(a, b, c);
}
