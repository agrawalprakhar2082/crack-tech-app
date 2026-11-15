# Naive approach (too slow on purpose): used by verify.js --speed.
def min_effort(h):
    R, C = len(h), len(h[0])
    lim = 0
    while True:
        seen = {(0, 0)}; st = [(0, 0)]
        while st:
            r, c = st.pop()
            for x, y in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= x < R and 0 <= y < C and (x, y) not in seen and abs(h[x][y] - h[r][c]) <= lim:
                    seen.add((x, y)); st.append((x, y))
        if (R - 1, C - 1) in seen:
            return lim
        lim += 1
