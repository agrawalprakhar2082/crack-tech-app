def count_nodes(root) -> int:
    # Compare the leftmost depth of the two subtrees: one of them is always perfect.
    def depth(node):
        d = 0
        while node:
            d += 1
            node = node.left
        return d

    total = 0
    while root:
        left, right = depth(root.left), depth(root.right)
        if left == right:          # left subtree is perfect with height `left`
            total += 1 << left
            root = root.right
        else:                      # right subtree is perfect with height `right`
            total += 1 << right
            root = root.left
    return total
