import heapq


def skill_gaps(ages: list[int], skills: list[int]) -> list[int]:
    # younger: max-heap by (age, arrival); older: min-heap. Younger holds the extra person.
    younger, older = [], []
    ys = os_ = 0
    out = []
    for i, (age, skill) in enumerate(zip(ages, skills)):
        key = (age, i)
        if younger and key < (-younger[0][0], -younger[0][1]):
            heapq.heappush(younger, (-age, -i, skill)); ys += skill
        else:
            heapq.heappush(older, (age, i, skill)); os_ += skill
        while len(younger) < len(older):
            a, j, s = heapq.heappop(older); os_ -= s
            heapq.heappush(younger, (-a, -j, s)); ys += s
        while len(younger) > len(older) + 1:
            a, j, s = heapq.heappop(younger); ys -= s
            heapq.heappush(older, (-a, -j, s)); os_ += s
        out.append(abs(ys - os_))
    return out
