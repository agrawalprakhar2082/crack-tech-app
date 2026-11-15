// Naive approach (too slow on purpose): used by verify.js --speed.
function longestOnes(a,k){let best=0;for(let i=0;i<a.length;i++){let z=0;for(let j=i;j<a.length;j++){if(a[j]===0)z++;if(z>k)break;if(j-i+1>best)best=j-i+1}}return best}
