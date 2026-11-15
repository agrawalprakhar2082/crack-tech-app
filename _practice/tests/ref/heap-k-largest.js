function kLargest(heap, k) {
    // Candidates: a small max-heap of indices into heap, ordered by value.
    const cand = [], out = [];
    const up = () => { let i = cand.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[cand[p]] >= heap[cand[i]]) break; [cand[p], cand[i]] = [cand[i], cand[p]]; i = p; } };
    const down = () => { let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < cand.length && heap[cand[l]] > heap[cand[m]]) m = l; if (r < cand.length && heap[cand[r]] > heap[cand[m]]) m = r; if (m === i) return; [cand[m], cand[i]] = [cand[i], cand[m]]; i = m; } };
    if (heap.length && k) cand.push(0);
    while (cand.length && out.length < k) {
        const i = cand[0], last = cand.pop();
        if (cand.length) { cand[0] = last; down(); }
        out.push(heap[i]);
        for (const j of [2 * i + 1, 2 * i + 2]) if (j < heap.length) { cand.push(j); up(); }
    }
    return out;
}
