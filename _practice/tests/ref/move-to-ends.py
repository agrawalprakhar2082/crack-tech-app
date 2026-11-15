def min_moves(a: list[int], b: list[int]) -> int:
    # Elements never moved keep their order in b and must be a contiguous run of a.
    pos = {v: i for i, v in enumerate(b)}
    best = run = 0
    for i, v in enumerate(a):
        run = run + 1 if i and pos[v] > pos[a[i - 1]] else 1
        best = max(best, run)
    return len(a) - best
