function minCapacity(draws, k) {
    const fills = cap => {
        let water = 0, n = 0;
        for (const d of draws) {
            if (d > cap) return Infinity;
            if (water < d) { water = cap; n++; }
            water -= d;
        }
        return n;
    };
    let lo = Math.max(...draws), hi = draws.reduce((a, b) => a + b, 0);
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (fills(mid) <= k) hi = mid; else lo = mid + 1;
    }
    return lo;
}
