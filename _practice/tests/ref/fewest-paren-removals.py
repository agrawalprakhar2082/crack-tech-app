def min_remove_to_valid(s: str) -> str:
    keep = list(s)
    stack = []
    for i, ch in enumerate(s):
        if ch == "(":
            stack.append(i)
        elif ch == ")":
            if stack:
                stack.pop()
            else:
                keep[i] = ""
    for i in stack:
        keep[i] = ""
    return "".join(keep)
