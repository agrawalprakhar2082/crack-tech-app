function minRadius(houses, heaters) {
    const hs = [...heaters].sort((a, b) => a - b), hh = [...houses].sort((a, b) => a - b);
    let best = 0, j = 0;
    for (const h of hh) {
        while (j + 1 < hs.length && Math.abs(hs[j + 1] - h) <= Math.abs(hs[j] - h)) j++;
        best = Math.max(best, Math.abs(hs[j] - h));
    }
    return best;
}
