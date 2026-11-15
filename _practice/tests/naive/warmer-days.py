# Naive approach (too slow on purpose): used by verify.js --speed.
def days_until_warmer(t):
    out = [0] * len(t)
    for i in range(len(t)):
        for j in range(i + 1, len(t)):
            if t[j] > t[i]:
                out[i] = j - i
                break
    return out
