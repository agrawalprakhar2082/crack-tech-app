def min_semesters(n: int, prereqs: list[list[int]]) -> int:
    indeg = [0] * n
    adj = [[] for _ in range(n)]
    for a, b in prereqs:
        adj[a].append(b)
        indeg[b] += 1
    level = [i for i in range(n) if indeg[i] == 0]
    semesters = taken = 0
    while level:
        semesters += 1
        taken += len(level)
        nxt = []
        for u in level:
            for v in adj[u]:
                indeg[v] -= 1
                if indeg[v] == 0:
                    nxt.append(v)
        level = nxt
    return semesters if taken == n else -1
