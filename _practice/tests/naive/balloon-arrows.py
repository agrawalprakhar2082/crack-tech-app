# Naive approach (too slow on purpose): used by verify.js --speed.
def min_arrows(b):
    left=[list(x) for x in b]; n=0
    while left:
        e=min(x[1] for x in left); n+=1
        left=[x for x in left if x[0]>e]
    return n
