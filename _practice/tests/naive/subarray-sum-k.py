# Naive approach (too slow on purpose): used by verify.js --speed.
def count_subarrays(nums,k):
    r=0
    for i in range(len(nums)):
        s=0
        for j in range(i,len(nums)):
            s+=nums[j]
            if s==k: r+=1
    return r
