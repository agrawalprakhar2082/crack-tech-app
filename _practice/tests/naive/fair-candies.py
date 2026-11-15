# Naive approach (too slow on purpose): used by verify.js --speed.
def min_candies(r):
    c = [1] * len(r)
    changed = True
    while changed:
        changed = False
        for i in range(len(r)):
            if i > 0 and r[i] > r[i - 1] and c[i] <= c[i - 1]:
                c[i] = c[i - 1] + 1; changed = True
            if i + 1 < len(r) and r[i] > r[i + 1] and c[i] <= c[i + 1]:
                c[i] = c[i + 1] + 1; changed = True
    return sum(c)
