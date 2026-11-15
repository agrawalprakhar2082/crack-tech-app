// Naive approach (too slow on purpose): used by verify.js --speed.
function canMakePalindrome(s, k) { const f = (i, j, k) => k < 0 ? false : i >= j ? true : s[i] === s[j] ? f(i + 1, j - 1, k) : f(i + 1, j, k - 1) || f(i, j - 1, k - 1); return f(0, s.length - 1, k); }
