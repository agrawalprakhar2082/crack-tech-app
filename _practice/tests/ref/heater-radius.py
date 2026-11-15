import bisect


def min_radius(houses: list[int], heaters: list[int]) -> int:
    hs = sorted(heaters)
    best = 0
    for h in houses:
        i = bisect.bisect_left(hs, h)
        d = min(abs(hs[j] - h) for j in (i - 1, i) if 0 <= j < len(hs))
        best = max(best, d)
    return best
