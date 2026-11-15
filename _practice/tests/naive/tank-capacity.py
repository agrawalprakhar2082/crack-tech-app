# Naive approach (too slow on purpose): used by verify.js --speed.
def min_capacity(d,k):
    c=max(d)
    while True:
        w=f=0
        for x in d:
            if w<x: w=c; f+=1
            w-=x
        if f<=k: return c
        c+=1
