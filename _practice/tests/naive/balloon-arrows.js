// Naive approach (too slow on purpose): used by verify.js --speed.
function minArrows(b){const left=b.map(x=>x.slice());let n=0;while(left.length){let e=Infinity,idx=-1;for(let i=0;i<left.length;i++)if(left[i][1]<e){e=left[i][1];idx=i}n++;for(let i=left.length-1;i>=0;i--)if(left[i][0]<=e)left.splice(i,1)}return n}
