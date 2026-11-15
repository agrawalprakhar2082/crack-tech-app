function minEffort(heights) {
    // Binary search on the effort, with a BFS that only takes steps within it.
    const rows = heights.length, cols = heights[0].length;
    const ok = limit => {
        const seen = new Uint8Array(rows * cols), q = [0];
        seen[0] = 1;
        for (let h = 0; h < q.length; h++) {
            const r = Math.floor(q[h] / cols), c = q[h] % cols;
            if (r === rows - 1 && c === cols - 1) return true;
            for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                const id = nr * cols + nc;
                if (!seen[id] && Math.abs(heights[nr][nc] - heights[r][c]) <= limit) { seen[id] = 1; q.push(id); }
            }
        }
        return false;
    };
    let lo = 0, hi = 1000000;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (ok(mid)) hi = mid; else lo = mid + 1; }
    return lo;
}
