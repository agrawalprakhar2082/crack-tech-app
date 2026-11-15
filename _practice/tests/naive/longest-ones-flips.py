# Naive approach (too slow on purpose): used by verify.js --speed.
def longest_ones(a,k):
    best=0
    for i in range(len(a)):
        z=0
        for j in range(i,len(a)):
            z+=a[j]==0
            if z>k: break
            best=max(best,j-i+1)
    return best
