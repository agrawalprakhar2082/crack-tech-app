// Naive approach (too slow on purpose): used by verify.js --speed.
function countSubarrays(a,k){let r=0;for(let i=0;i<a.length;i++){let s=0;for(let j=i;j<a.length;j++){s+=a[j];if(s===k)r++}}return r}
