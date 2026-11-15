def longest_ones(nums: list[int], k: int) -> int:
    best = left = zeros = 0
    for right, v in enumerate(nums):
        zeros += v == 0
        while zeros > k:
            zeros -= nums[left] == 0
            left += 1
        best = max(best, right - left + 1)
    return best
