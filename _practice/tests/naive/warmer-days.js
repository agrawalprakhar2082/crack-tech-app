// Naive approach (too slow on purpose): used by verify.js --speed.
function daysUntilWarmer(t) { const o = new Array(t.length).fill(0); for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) if (t[j] > t[i]) { o[i] = j - i; break; } return o; }
