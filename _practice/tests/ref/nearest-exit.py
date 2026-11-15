from collections import deque

ROOM = 2147483647


def fill_distances(grid: list[list[int]]) -> list[list[int]]:
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    q = deque((r, c) for r in range(rows) for c in range(cols) if grid[r][c] == 0)
    while q:
        r, c = q.popleft()
        d = grid[r][c] + 1
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == ROOM:
                grid[nr][nc] = d
                q.append((nr, nc))
    return grid
