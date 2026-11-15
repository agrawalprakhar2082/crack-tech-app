def is_valid_sudoku(board: list[list[int]]) -> bool:
    seen = set()
    for r in range(9):
        for c in range(9):
            v = board[r][c]
            if v == 0:
                continue
            keys = (("row", r, v), ("col", c, v), ("box", r // 3, c // 3, v))
            if any(key in seen for key in keys):
                return False
            seen.update(keys)
    return True
