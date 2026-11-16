function summarizeLog(lines) {
    const latencies = [];
    let errors = 0, slowest = null, slowestMs = -1;
    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length !== 5) continue;
        const [, , path, status, latency] = parts;
        if (!/^\d{3}$/.test(status) || !/^\d+ms$/.test(latency)) continue;
        const ms = parseInt(latency, 10);
        if (Number(status) >= 500) errors++;
        latencies.push(ms);
        if (ms > slowestMs) { slowestMs = ms; slowest = path.split("?")[0]; }
    }
    latencies.sort((a, b) => a - b);
    return { requests: latencies.length, errors, median_ms: latencies.length ? latencies[Math.floor((latencies.length - 1) / 2)] : null, slowest };
}
