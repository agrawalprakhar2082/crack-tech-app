def count_subarrays(nums: list[int], k: int) -> int:
    seen = {0: 1}
    total = prefix = 0
    for v in nums:
        prefix += v
        total += seen.get(prefix - k, 0)
        seen[prefix] = seen.get(prefix, 0) + 1
    return total
