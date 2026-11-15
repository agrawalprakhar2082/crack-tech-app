def count_coated(days: list[list[int]], k: int) -> int:
    events = {}
    for a, b in days:
        events[a] = events.get(a, 0) + 1
        events[b + 1] = events.get(b + 1, 0) - 1
    total, coats, prev = 0, 0, None
    for x in sorted(events):
        if prev is not None and coats >= k:
            total += x - prev
        coats += events[x]
        prev = x
    return total
