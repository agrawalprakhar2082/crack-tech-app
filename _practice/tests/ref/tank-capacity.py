def min_capacity(draws: list[int], k: int) -> int:
    def fills(cap):
        water, n = 0, 0
        for d in draws:
            if d > cap:
                return float("inf")
            if water < d:
                water, n = cap, n + 1
            water -= d
        return n

    lo, hi = max(draws), sum(draws)
    while lo < hi:
        mid = (lo + hi) // 2
        if fills(mid) <= k:
            hi = mid
        else:
            lo = mid + 1
    return lo
