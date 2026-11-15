function allowRequests(times, limit, window) {
    const recent = [], out = [];
    let head = 0;
    for (const t of times) {
        while (head < recent.length && recent[head] <= t - window) head++;
        if (new Set(recent.slice(head)).size < limit) { recent.push(t); out.push(true); } else out.push(false);
    }
    return out;
}
