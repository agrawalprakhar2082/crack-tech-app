// Two heaps keyed by [age, arrival]; the younger half keeps the extra person.
class Heap {
    constructor(before) { this.a = []; this.before = before; }
    get size() { return this.a.length; }
    top() { return this.a[0]; }
    push(x) { const a = this.a; a.push(x); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (!this.before(a[i], a[p])) break; [a[i], a[p]] = [a[p], a[i]]; i = p; } }
    pop() { const a = this.a, top = a[0], last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && this.before(a[l], a[m])) m = l; if (r < a.length && this.before(a[r], a[m])) m = r; if (m === i) break; [a[i], a[m]] = [a[m], a[i]]; i = m; } } return top; }
}
const older = (x, y) => x[0] > y[0] || (x[0] === y[0] && x[1] > y[1]);
function skillGaps(ages, skills) {
    const young = new Heap(older), old = new Heap((x, y) => older(y, x));
    let ys = 0, os = 0;
    const out = [];
    for (let i = 0; i < ages.length; i++) {
        const p = [ages[i], i, skills[i]];
        if (young.size && older(young.top(), p)) { young.push(p); ys += p[2]; } else { old.push(p); os += p[2]; }
        while (young.size < old.size) { const q = old.pop(); os -= q[2]; young.push(q); ys += q[2]; }
        while (young.size > old.size + 1) { const q = young.pop(); ys -= q[2]; old.push(q); os += q[2]; }
        out.push(Math.abs(ys - os));
    }
    return out;
}
