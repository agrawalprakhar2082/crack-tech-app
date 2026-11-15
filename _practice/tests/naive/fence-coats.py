# Naive approach (too slow on purpose): used by verify.js --speed.
from collections import Counter
def count_coated(days,k):
    c=Counter()
    for a,b in days:
        for x in range(a,b+1): c[x]+=1
    return sum(1 for v in c.values() if v>=k)
