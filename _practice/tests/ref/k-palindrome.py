def can_make_palindrome(s: str, k: int) -> bool:
    # Longest palindromic subsequence, bottom-up with two rows: removals = n - LPS.
    n = len(s)
    if n == 0:
        return True
    nxt = [0] * n
    for i in range(n - 1, -1, -1):
        cur = [0] * n
        cur[i] = 1
        si = s[i]
        for j in range(i + 1, n):
            if si == s[j]:
                cur[j] = nxt[j - 1] + 2
            else:
                a, b = nxt[j], cur[j - 1]
                cur[j] = a if a > b else b
        nxt = cur
    return n - nxt[n - 1] <= k
