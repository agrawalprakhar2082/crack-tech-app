// Naive approach (too slow on purpose): used by verify.js --speed.
function countCoated(days,k){const c=new Map();for(const[a,b]of days)for(let x=a;x<=b;x++)c.set(x,(c.get(x)||0)+1);let n=0;for(const v of c.values())if(v>=k)n++;return n}
