// Naive approach (too slow on purpose): used by verify.js --speed.
function minCapacity(d,k){let c=Math.max(...d);for(;;c++){let w=0,f=0;for(const x of d){if(w<x){w=c;f++}w-=x}if(f<=k)return c}}
