function isValidSudoku(board) {
    const rows = new Array(9).fill(0), cols = new Array(9).fill(0), boxes = new Array(9).fill(0);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
        const v = board[r][c];
        if (!v) continue;
        const bit = 1 << v, b = 3 * Math.floor(r / 3) + Math.floor(c / 3);
        if ((rows[r] | cols[c] | boxes[b]) & bit) return false;
        rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
    }
    return true;
}
