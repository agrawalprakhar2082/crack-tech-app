def min_paint_cost(costs: list[list[int]]) -> int:
    a = b = c = 0
    for x, y, z in costs:
        a, b, c = x + min(b, c), y + min(a, c), z + min(a, b)
    return min(a, b, c)
