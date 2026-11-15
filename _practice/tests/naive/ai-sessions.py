# The round's given code: correct but slow (used as the brute force and by verify.js --speed).
def count_sessions(events, gap):
    result = []
    users = []
    for e in events:
        if e[0] not in users:
            users.append(e[0])
    users.sort()
    for u in users:
        times = []
        for e in events:
            if e[0] == u:
                times.append(e[1])
        for i in range(len(times)):
            for j in range(len(times) - 1 - i):
                if times[j] > times[j + 1]:
                    tmp = times[j]
                    times[j] = times[j + 1]
                    times[j + 1] = tmp
        count = 0
        last = None
        for t in times:
            if last is None or t - last > gap:
                count = count + 1
            last = t
        result.append([u, count])
    return result
