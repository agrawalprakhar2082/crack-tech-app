// Naive approach (too slow on purpose): used by verify.js --speed.
function windowMax(a,k){const o=[];for(let i=0;i+k<=a.length;i++){let m=-Infinity;for(let j=i;j<i+k;j++)if(a[j]>m)m=a[j];o.push(m)}return o}
