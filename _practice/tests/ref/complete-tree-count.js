function countNodes(root) {
    const depth = node => { let d = 0; while (node) { d++; node = node.left; } return d; };
    let total = 0;
    while (root) {
        const l = depth(root.left), r = depth(root.right);
        if (l === r) { total += 2 ** l; root = root.right; }
        else { total += 2 ** r; root = root.left; }
    }
    return total;
}
