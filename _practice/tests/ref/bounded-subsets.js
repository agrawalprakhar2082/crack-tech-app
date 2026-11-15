function countBoundedSubsets(nums, target, k) {
    const MOD = 1000000007;
    let ways = new Array(target + 1).fill(0);
    ways[0] = 1;
    for (const v of nums) {
        const next = new Array(target + 1).fill(0);
        for (let r = 0; r < v && r <= target; r++) {
            let win = 0;
            for (let s = r, i = 0; s <= target; s += v, i++) {
                win = (win + ways[s]) % MOD;
                if (i > k) win = (win - ways[s - (k + 1) * v] + MOD) % MOD;
                next[s] = win;
            }
        }
        ways = next;
    }
    return ways[target];
}
