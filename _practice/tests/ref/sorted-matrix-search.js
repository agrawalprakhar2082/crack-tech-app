function searchMatrix(matrix, target) {
    if (!matrix.length || !matrix[0].length) return false;
    let r = 0, c = matrix[0].length - 1;
    while (r < matrix.length && c >= 0) {
        const v = matrix[r][c];
        if (v === target) return true;
        if (v > target) c--; else r++;
    }
    return false;
}
