from collections import Counter


def least_time(tasks: str, n: int) -> int:
    if not tasks:
        return 0
    counts = Counter(tasks).values()
    top = max(counts)
    ties = sum(1 for c in counts if c == top)
    return max(len(tasks), (top - 1) * (n + 1) + ties)
