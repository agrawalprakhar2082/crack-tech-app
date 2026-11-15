def min_arrows(balloons: list[list[int]]) -> int:
    arrows, last = 0, None
    for start, end in sorted(balloons, key=lambda b: b[1]):
        if last is None or start > last:
            arrows += 1
            last = end
    return arrows
