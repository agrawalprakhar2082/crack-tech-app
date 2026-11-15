// Naive approach (too slow on purpose): used by verify.js --speed.
class Scoreboard{constructor(){this.s=new Map()}assign(n,v){this.s.set(n,v)}remove(n){this.s.delete(n)}maxScore(){let b=null;for(const[n,v]of this.s)if(!b||v>b[1]||(v===b[1]&&n<b[0]))b=[n,v];return b}getScore(n){return this.s.has(n)?this.s.get(n):null}}
