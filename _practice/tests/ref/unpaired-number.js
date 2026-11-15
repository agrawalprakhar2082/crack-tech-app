function findUnpaired(nums) {
    let x = 0;
    for (const v of nums) x ^= v;
    return x;
}
