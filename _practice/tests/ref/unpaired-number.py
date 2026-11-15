def find_unpaired(nums: list[int]) -> int:
    x = 0
    for v in nums:
        x ^= v
    return x
