from collections import deque


def allow_requests(times, limit, window):
    recent, out = deque(), []
    for t in times:
        while recent and recent[0] <= t - window:
            recent.popleft()
        out.append(len(recent) < limit)
        recent.append(t)
    return out
