function allowRequests(times, limit, window) {
    const recent = [], out = [];
    let head = 0;
    for (const t of times) {
        while (head < recent.length && recent[head] <= t - window) head++;
        out.push(recent.length - head < limit); recent.push(t);
    }
    return out;
}
