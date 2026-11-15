function fillDistances(grid) {
    const ROOM = 2147483647, rows = grid.length, cols = rows ? grid[0].length : 0;
    let q = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] === 0) q.push(r, c);
    for (let h = 0; h < q.length; h += 2) {
        const r = q[h], c = q[h + 1], d = grid[r][c] + 1;
        for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === ROOM) { grid[nr][nc] = d; q.push(nr, nc); }
        }
    }
    return grid;
}
