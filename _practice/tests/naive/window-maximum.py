# Naive approach (too slow on purpose): used by verify.js --speed.
def window_max(nums,k):
    return [max(nums[i:i+k]) for i in range(len(nums)-k+1)]
