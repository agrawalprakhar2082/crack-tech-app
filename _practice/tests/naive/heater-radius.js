// Naive approach (too slow on purpose): used by verify.js --speed.
function minRadius(houses, heaters) { let best = 0; for (const h of houses) { let d = Infinity; for (const x of heaters) d = Math.min(d, Math.abs(h - x)); best = Math.max(best, d); } return best; }
