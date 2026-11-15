// Naive approach (too slow on purpose): used by verify.js --speed.
function countNodes(root) { return root ? 1 + countNodes(root.left) + countNodes(root.right) : 0; }
