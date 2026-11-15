# Naive approach (too slow on purpose): used by verify.js --speed.
def can_make_palindrome(s, k):
    def f(i, j, k):
        if k < 0:
            return False
        if i >= j:
            return True
        if s[i] == s[j]:
            return f(i + 1, j - 1, k)
        return f(i + 1, j, k - 1) or f(i, j - 1, k - 1)
    return f(0, len(s) - 1, k)
