function hasCycle(n, edges) {
    const adj = Array.from({ length: n }, () => []);
    for (const [u, v] of edges) adj[u].push(v);
    const state = new Array(n).fill(0); // 0 new, 1 on the stack, 2 done
    for (let s = 0; s < n; s++) {
        if (state[s]) continue;
        const stack = [[s, 0]];
        state[s] = 1;
        while (stack.length) {
            const top = stack[stack.length - 1], u = top[0];
            if (top[1] < adj[u].length) {
                const v = adj[u][top[1]++];
                if (state[v] === 1) return true;
                if (state[v] === 0) { state[v] = 1; stack.push([v, 0]); }
            } else { state[u] = 2; stack.pop(); }
        }
    }
    return false;
}
