# Naive approach (too slow on purpose): used by verify.js --speed.
def min_radius(houses, heaters):
    return max(min(abs(h - x) for x in heaters) for h in houses)
