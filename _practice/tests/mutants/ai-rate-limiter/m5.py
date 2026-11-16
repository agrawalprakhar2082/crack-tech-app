from collections import deque


def allow_requests(times, limit, window):
    recent, out = deque(), []
    for t in times:
        while recent and recent[0] <= t - window:
            recent.popleft()
        if len(set(recent)) < limit:
            recent.append(t)
            out.append(True)
        else:
            out.append(False)
    return out
