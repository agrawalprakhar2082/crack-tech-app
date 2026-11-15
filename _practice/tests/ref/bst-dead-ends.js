function noDeadEnds(root) {
    const stack = root ? [[root, 0, Infinity]] : [];
    while (stack.length) {
        const [node, lo, hi] = stack.pop();
        if (!node.left && !node.right) {
            if (node.val - lo === 1 && hi - node.val === 1) return false;
            continue;
        }
        if (node.left) stack.push([node.left, lo, node.val]);
        if (node.right) stack.push([node.right, node.val, hi]);
    }
    return true;
}
