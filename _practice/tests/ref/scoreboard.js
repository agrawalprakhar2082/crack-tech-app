class Scoreboard {
    constructor() {
        this.scores = new Map();
        this.heap = []; // [score, name], best first; stale entries skipped lazily
    }
    better(x, y) { return x[0] > y[0] || (x[0] === y[0] && x[1] < y[1]); }
    push(item) {
        const h = this.heap; h.push(item);
        let i = h.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (!this.better(h[i], h[p])) break;
            [h[i], h[p]] = [h[p], h[i]]; i = p;
        }
    }
    pop() {
        const h = this.heap, last = h.pop();
        if (!h.length) return;
        h[0] = last;
        let i = 0;
        for (;;) {
            const l = 2 * i + 1, r = l + 1;
            let m = i;
            if (l < h.length && this.better(h[l], h[m])) m = l;
            if (r < h.length && this.better(h[r], h[m])) m = r;
            if (m === i) break;
            [h[i], h[m]] = [h[m], h[i]]; i = m;
        }
    }
    assign(name, score) { this.scores.set(name, score); this.push([score, name]); }
    remove(name) { this.scores.delete(name); }
    maxScore() {
        while (this.heap.length) {
            const [s, name] = this.heap[0];
            if (this.scores.get(name) === s) return [name, s];
            this.pop();
        }
        return null;
    }
    getScore(name) { return this.scores.has(name) ? this.scores.get(name) : null; }
}
