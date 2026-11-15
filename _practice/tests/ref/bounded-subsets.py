MOD = 10**9 + 7


def count_bounded_subsets(nums: list[int], target: int, k: int) -> int:
    # ways[s]: multisets of the values seen so far with sum s. Adding value v up to k times:
    # new[s] = ways[s] + ways[s-v] + ... + ways[s-k*v], a sliding sum along s mod v.
    ways = [1] + [0] * target
    for v in nums:
        new = [0] * (target + 1)
        for r in range(min(v, target + 1)):
            window = 0
            for i, s in enumerate(range(r, target + 1, v)):
                window += ways[s]
                if i > k:
                    window -= ways[s - (k + 1) * v]
                new[s] = window % MOD
        ways = new
    return ways[target] % MOD
