import heapq


def k_largest(heap: list[int], k: int) -> list[int]:
    out, cand = [], [(-heap[0], 0)] if heap and k else []
    while cand and len(out) < k:
        v, i = heapq.heappop(cand)
        out.append(-v)
        for j in (2 * i + 1, 2 * i + 2):
            if j < len(heap):
                heapq.heappush(cand, (-heap[j], j))
    return out
