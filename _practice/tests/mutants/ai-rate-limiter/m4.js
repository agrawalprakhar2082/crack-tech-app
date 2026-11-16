function allowRequests(times, limit, window) {
    const counts = new Map(), out = [];
    for (const t of times) {
        const bucket = Math.floor(t / window), c = counts.get(bucket) || 0;
        if (c < limit) { counts.set(bucket, c + 1); out.push(true); } else out.push(false);
    }
    return out;
}
