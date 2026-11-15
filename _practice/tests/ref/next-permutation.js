function nextPermutation(nums) {
    let i = nums.length - 2;
    while (i >= 0 && nums[i] >= nums[i + 1]) i--;
    if (i >= 0) {
        let j = nums.length - 1;
        while (nums[j] <= nums[i]) j--;
        [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    for (let a = i + 1, b = nums.length - 1; a < b; a++, b--) [nums[a], nums[b]] = [nums[b], nums[a]];
    return nums;
}
