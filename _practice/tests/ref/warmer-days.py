def days_until_warmer(temps: list[int]) -> list[int]:
    out = [0] * len(temps)
    stack = []  # indexes still waiting for a warmer day, temperatures non-increasing
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            out[j] = i - j
        stack.append(i)
    return out
