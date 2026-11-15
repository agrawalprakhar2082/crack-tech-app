# Naive approach (too slow on purpose): used by verify.js --speed.
def count_nodes(root):
    if root is None:
        return 0
    return 1 + count_nodes(root.left) + count_nodes(root.right)
