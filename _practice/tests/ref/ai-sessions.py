def count_sessions(events, gap):
    by_user = {}
    for user, t in events:
        by_user.setdefault(user, []).append(t)
    result = []
    for user in sorted(by_user):
        times = sorted(by_user[user])
        sessions = 1 + sum(1 for a, b in zip(times, times[1:]) if b - a > gap)
        result.append([user, sessions])
    return result
