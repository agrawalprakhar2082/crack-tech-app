function canMakePalindrome(s, k) {
    // Fewest removals with a memo-free DP: dp[i][j] = removals to make s[i..j] a palindrome.
    const n = s.length;
    if (!n) return true;
    let next = new Int32Array(n);
    for (let i = n - 1; i >= 0; i--) {
        const cur = new Int32Array(n);
        for (let j = i + 1; j < n; j++) cur[j] = s[i] === s[j] ? (j - i > 1 ? next[j - 1] : 0) : 1 + Math.min(next[j], cur[j - 1]);
        next = cur;
    }
    return next[n - 1] <= k;
}
