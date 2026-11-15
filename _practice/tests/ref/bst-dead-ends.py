def no_dead_ends(root) -> bool:
    # Each node carries the open interval (lo, hi) its value had to fit in. A leaf with
    # value v is a dead end when no integer fits on either side: lo == v - 1 and hi == v + 1.
    stack = [(root, 0, float("inf"))] if root else []
    while stack:
        node, lo, hi = stack.pop()
        if not node.left and not node.right:
            if node.val - lo == 1 and hi - node.val == 1:
                return False
            continue
        if node.left:
            stack.append((node.left, lo, node.val))
        if node.right:
            stack.append((node.right, node.val, hi))
    return True
