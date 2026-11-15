# Naive approach (too slow on purpose): used by verify.js --speed.
from collections import deque
def fill_distances(grid):
    R, C = len(grid), len(grid[0])
    out = [row[:] for row in grid]
    for r in range(R):
        for c in range(C):
            if grid[r][c] != 2147483647:
                continue
            seen = {(r, c)}; q = deque([(r, c, 0)])
            while q:
                a, b, d = q.popleft()
                if grid[a][b] == 0:
                    out[r][c] = d; break
                for x, y in ((a + 1, b), (a - 1, b), (a, b + 1), (a, b - 1)):
                    if 0 <= x < R and 0 <= y < C and grid[x][y] != -1 and (x, y) not in seen:
                        seen.add((x, y)); q.append((x, y, d + 1))
    return out
