function countSubarrays(nums, k) {
    const seen = new Map([[0, 1]]);
    let total = 0, prefix = 0;
    for (const v of nums) {
        prefix += v;
        total += seen.get(prefix - k) || 0;
        seen.set(prefix, (seen.get(prefix) || 0) + 1);
    }
    return total;
}
