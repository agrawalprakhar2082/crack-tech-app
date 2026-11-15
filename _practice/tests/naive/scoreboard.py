# Naive approach (too slow on purpose): used by verify.js --speed.
class Scoreboard:
    def __init__(self): self.s={}
    def assign(self,n,v): self.s[n]=v
    def remove(self,n): self.s.pop(n,None)
    def max_score(self):
        if not self.s: return None
        n=min(self.s,key=lambda x:(-self.s[x],x)); return [n,self.s[n]]
    def get_score(self,n): return self.s.get(n)
