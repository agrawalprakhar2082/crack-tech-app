// Runnable coding questions for the "Coding practice sets" on /practice/ (sessions.js uses
// them by id). Each question: the statement, input and output, constraints, sample tests
// (shown to the candidate, also used as the examples), what interviewers look for, and the
// function signature the starter code and the test runner use.
// Hidden tests live in _practice/tests/hidden/<id>.json (made by _practice/tests/generate.py
// from the reference solutions in _practice/tests/ref/). Check everything with:
//   node _practice/tests/verify.js
// Text may use `backticks` for code. Types: int, long, bool, string, int[], int[][], tree
// (a binary tree written in level order with null for a missing child; the runners turn it
// into TreeNode objects with val, left and right). inplace: index of an argument the candidate
// may change in place and return nothing (that argument is then taken as the answer).
// compare: "exact" (default), "unordered", "float", or a checker in judge.js (e.g. "parens").
// speed: true when the hidden tests include full-size inputs (see judge.js GENS); otherwise
// the page says the hidden tests check correctness, not speed. keep: argument indexes the
// candidate's function must not modify (checked by both runners).
window.PRACTICE_PROBLEMS = {
  /* ---------------- Session 1 ---------------- */
  "unpaired-number": {
    title: "The unpaired number",
    fn: "findUnpaired", params: [["nums", "int[]"]], returns: "int",
    statement: [
      "Every value in the list `nums` appears exactly twice, except for one value that appears only once. Return that value.",
      "Aim for one pass over the list and constant extra memory."],
    input: ["`nums`: a list of integers in any order, with an odd length."],
    output: "The one value that has no pair.",
    constraints: ["1 ≤ nums.length ≤ 10⁵ (always odd)", "−10⁹ ≤ nums[i] ≤ 10⁹", "Exactly one value appears once; every other value appears exactly twice"],
    samples: [
      { args: [[6, 3, 8, 3, 6]], expected: 8, why: "3 and 6 each appear twice; 8 appears once." },
      { args: [[-7]], expected: -7 },
      { args: [[3, 9, 9, -2, 3]], expected: -2 }],
    clarify: [
      "Confirms there is always exactly one unpaired value, and that negatives are allowed",
      "Mentions the easy versions first (sort, or a hash map of counts) and their cost",
      "Aims for O(n) time and O(1) memory"],
    look: [
      "XOR of everything: pairs cancel (x ^ x = 0) and x ^ 0 = x, so only the single value is left",
      "Explains why order doesn't matter (XOR is commutative and associative)",
      "Works for negative numbers",
      "Clean, short code with a good name for the accumulator"],
    testing: [
      "A single element, the unpaired value first, last and in the middle, negatives",
      "O(n) time, O(1) extra space; the hash-map version is O(n) space"],
    followup: "What if every value appears three times except one? (Count each bit modulo 3.)"
  },
  "unpaired-in-sorted": {
    title: "The unpaired number, sorted",
    fn: "findUnpairedSorted", params: [["nums", "int[]"]], returns: "int",
    statement: [
      "Now the list `nums` is sorted in ascending order. Every value appears exactly twice, side by side, except one value that appears once. Return that value.",
      "Do it in O(log n) time: a linear scan or XOR is correct but too slow for this version."],
    input: ["`nums`: a sorted list of integers with an odd length."],
    output: "The value that appears only once.",
    constraints: ["1 ≤ nums.length ≤ 10⁵ (always odd)", "−10⁹ ≤ nums[i] ≤ 10⁹", "nums is sorted ascending; pairs are next to each other"],
    samples: [
      { args: [[2, 2, 5, 9, 9]], expected: 5, why: "The pair before 5 starts at index 0 (even); the pair after it starts at index 3 (odd)." },
      { args: [[-4, -4, 0, 0, 6, 7, 7]], expected: 6 },
      { args: [[5]], expected: 5 }],
    clarify: [
      "Notices that sorted input is the hint: the expected complexity drops to O(log n)",
      "Asks whether the single value can be first or last",
      "States the pattern before coding: left of the single value, pairs start at even indices"],
    look: [
      "Binary search on pair positions: move mid to an even index, compare nums[mid] with nums[mid + 1]",
      "If they match, the single value is to the right (lo = mid + 2); otherwise it's at mid or to the left (hi = mid)",
      "Loop condition and updates that always shrink the range (no infinite loop, no index out of range)",
      "Explains the invariant out loud"],
    testing: [
      "Length 1, single value first, single value last, negative values",
      "O(log n) time, O(1) space"],
    followup: "Could you do it without forcing mid to be even? (Compare with the neighbour chosen by mid's parity: mid ^ 1.)"
  },

  /* ---------------- Session 2 ---------------- */
  "backspace-keys": {
    title: "Backspace keys",
    fn: "typedText", params: [["s", "string"]], returns: "string",
    statement: [
      "Someone types the string `s` on a keyboard. Letters appear as typed; each underscore `_` is the backspace key and deletes the last remaining character, if there is one. Backspace on an empty line does nothing.",
      "Return the text left on the screen."],
    input: ["`s`: lowercase letters and underscores."],
    output: "The final text (possibly empty).",
    constraints: ["0 ≤ s.length ≤ 10⁵", "s contains only a–z and _"],
    samples: [
      { args: ["ab_c"], expected: "ac", why: "Type a, b, delete b, type c." },
      { args: ["a__b"], expected: "b", why: "The second backspace hits an empty line and does nothing." },
      { args: ["xy__"], expected: "" }],
    clarify: [
      "Asks what a backspace does on an empty line",
      "Asks about the character set and input size",
      "Plans a stack (or a list used as one) and says its cost"],
    look: [
      "Stack of characters: push letters, pop on _ if not empty",
      "Builds the result with a join or a string builder, not repeated string concatenation",
      "Handles leading and repeated backspaces",
      "Follow-up ready: walk from the end with a skip counter for O(1) extra space"],
    testing: [
      "Empty string, only backspaces, backspaces at the start, everything deleted",
      "O(n) time, O(n) space for the stack"],
    followup: "Given two typed strings, decide whether they end up as the same text using O(1) extra memory. (Walk both from the end, skipping characters that a later _ deletes.)"
  },
  "fewest-paren-removals": {
    title: "Fewest removals to balance",
    fn: "minRemoveToValid", params: [["s", "string"]], returns: "string",
    compare: "parens",
    statement: [
      "The string `s` contains lowercase letters and the brackets `(` and `)`. Remove as few characters as possible so that the brackets are balanced: every `(` has a matching `)` after it, and no `)` appears without an earlier unmatched `(`.",
      "Return the string that is left, keeping the remaining characters in their original order. If several answers remove the same, smallest number of characters, return any of them: the tests accept every valid answer."],
    input: ["`s`: letters a–z, `(` and `)`."],
    output: "A balanced string made by deleting the fewest characters from s.",
    constraints: ["0 ≤ s.length ≤ 10⁵"],
    samples: [
      { args: ["x)(y)z)"], expected: "x(y)z", why: "The first and last ) have no partner." },
      { args: [")a(("], expected: "a", why: "None of the three brackets has a partner, so only the letter stays." },
      { args: ["(a(b)"], expected: "a(b)", why: "\"(ab)\" is also accepted: both remove one character." }],
    clarify: [
      "Asks whether letters can be removed (never needed) and whether any valid answer is accepted",
      "Defines balanced precisely, including the empty string",
      "Plans two kinds of bad brackets: unmatched ) found left to right, and ( left over at the end"],
    look: [
      "One pass with a stack of indices of open brackets; mark a ) with no open bracket for removal",
      "After the pass, every index still on the stack is an unmatched ( to remove",
      "Builds the answer in one more pass (no repeated string slicing)",
      "Explains why this removes the minimum: each removed bracket could never be matched"],
    testing: [
      "Empty string, no brackets, only ), only (, nested and side-by-side pairs",
      "O(n) time, O(n) space"],
    followup: "Return every distinct valid string with the minimum removals. (BFS or backtracking with pruning by the counts of extra brackets.)"
  },

  /* ---------------- Session 3 ---------------- */
  "fence-coats": {
    speed: true,
    title: "Fence posts with enough paint",
    fn: "countCoated", params: [["days", "int[][]"], ["k", "int"]], returns: "long",
    statement: [
      "A fence has posts numbered 1, 2, 3, … with no end. On each day you paint every post in a range: `days[i] = [a, b]` paints posts a through b, inclusive, with one more coat.",
      "After all the days, how many posts have at least `k` coats of paint?",
      "Post numbers go up to a billion, so you can't keep one counter per post."],
    input: ["`days`: a list of [a, b] ranges, one per day.", "`k`: the number of coats a post needs."],
    output: "The number of posts painted at least k times.",
    constraints: ["0 ≤ days.length ≤ 10⁵", "1 ≤ a ≤ b ≤ 10⁹", "1 ≤ k ≤ 10⁵"],
    samples: [
      { args: [[[2, 4], [1, 3], [1, 9], [7, 9]], 2], expected: 7, why: "Posts 1–4 and 7–9 get two or more coats; posts 5 and 6 get one." },
      { args: [[[1, 5], [6, 10]], 2], expected: 0 },
      { args: [[[1, 1000000000], [500, 600]], 1], expected: 1000000000 }],
    clarify: [
      "Asks how big post numbers and the number of days can be (rules out an array per post)",
      "Confirms ranges are inclusive and can overlap or repeat",
      "Plans a sweep: +1 at a, −1 at b + 1, then walk the sorted change points"],
    look: [
      "Difference events at a and b + 1, merged per coordinate (a map or sorted list of pairs)",
      "Walks the sorted points, adding the gap length (next − current) while the running coat count is ≥ k",
      "Gets the inclusive end right (b + 1), so touching ranges like [1, 4] and [5, 8] don't overlap",
      "Uses 64-bit counts where the language needs it"],
    testing: [
      "No days, one post, touching ranges, identical ranges, a range up to 10⁹",
      "O(n log n) time for sorting 2n events, O(n) space"],
    followup: "The ranges arrive one by one and after each you must report the answer. What changes? (A balanced tree or segment tree over compressed coordinates.)"
  },
  "balloon-arrows": {
    speed: true,
    title: "Fewest arrows",
    fn: "minArrows", params: [["balloons", "int[][]"]], returns: "int",
    statement: [
      "Balloons are taped to a wall along the x-axis. Balloon i covers the stretch `[start, end]`. An arrow shot straight up at position x bursts every balloon with start ≤ x ≤ end, and keeps going.",
      "Return the fewest arrows needed to burst every balloon."],
    input: ["`balloons`: a list of [start, end] pairs."],
    output: "The minimum number of arrows.",
    constraints: ["0 ≤ balloons.length ≤ 10⁵", "−2·10⁹ ≤ start ≤ end ≤ 2·10⁹"],
    samples: [
      { args: [[[10, 16], [2, 8], [1, 6], [7, 12]]], expected: 2, why: "Any x from 2 to 6 is inside the two left balloons, and any x from 10 to 12 is inside the two right ones." },
      { args: [[[0, 3], [3, 7], [7, 9]]], expected: 2, why: "Touching counts: x = 3 bursts the first two, and x = 7 the last one." },
      { args: [[[1, 2], [3, 4], [5, 6]]], expected: 3 }],
    clarify: [
      "Asks whether touching balloons ([1,2] and [2,3]) can share an arrow",
      "Asks about sorting freedom, coordinate range (overflow in comparators) and empty input",
      "Plans a greedy on end points and can say why it's safe"],
    look: [
      "Sort by end; shoot at the first end, skip every balloon that starts at or before it",
      "Uses start > lastArrow to decide a new arrow (touching shares)",
      "Explains the exchange argument: moving an arrow to the earliest end never loses a balloon",
      "Avoids subtraction in the sort comparator when values are near the integer limits"],
    testing: [
      "Empty list, one balloon, nested balloons, touching, all disjoint",
      "O(n log n) time for the sort, O(1) extra space beyond it"],
    followup: "Return the x positions of the arrows too. (They're the end points where you shot.)"
  },

  /* ---------------- Session 4 ---------------- */
  "window-maximum": {
    speed: true,
    title: "Sliding window maximum",
    fn: "windowMax", params: [["nums", "int[]"], ["k", "int"]], returns: "int[]",
    statement: [
      "A window of size `k` slides over the list `nums` from left to right, one position at a time. Return the largest value in the window at each position.",
      "There are n − k + 1 windows. Do better than recomputing each maximum from scratch."],
    input: ["`nums`: a list of integers.", "`k`: the window size."],
    output: "A list of n − k + 1 maximums, in window order.",
    constraints: ["1 ≤ nums.length ≤ 2·10⁵", "1 ≤ k ≤ nums.length", "−10⁴ ≤ nums[i] ≤ 10⁴"],
    samples: [
      { args: [[2, 7, 4, 1, 8, 1, 3], 3], expected: [7, 7, 8, 8, 8], why: "Windows: [2,7,4] [7,4,1] [4,1,8] [1,8,1] [8,1,3]." },
      { args: [[4, 2], 1], expected: [4, 2] },
      { args: [[9, 8, 7], 3], expected: [9] }],
    clarify: [
      "Confirms k ≤ n and asks about duplicates",
      "States the O(n·k) baseline, then aims for O(n)",
      "Considers a heap (O(n log n)) before the monotonic deque"],
    look: [
      "A deque of indices whose values are decreasing; pop smaller values from the back before pushing",
      "Drop the front index once it falls out of the window (index ≤ i − k)",
      "Start recording at i = k − 1",
      "Can explain why each index enters and leaves the deque at most once (amortised O(n))"],
    testing: [
      "k = 1, k = n, increasing and decreasing input, repeated values",
      "O(n) time, O(k) extra space"],
    followup: "What about the minimum and maximum together, or the median of each window? (Two deques; two heaps with lazy deletion.)"
  },
  "longest-ones-flips": {
    speed: true,
    title: "Longest run of ones with k flips",
    fn: "longestOnes", params: [["nums", "int[]"], ["k", "int"]], returns: "int",
    statement: [
      "`nums` contains only 0s and 1s. You may flip at most `k` zeros into ones.",
      "Return the length of the longest stretch of consecutive 1s you can make."],
    input: ["`nums`: a list of 0s and 1s.", "`k`: the most zeros you may flip."],
    output: "The length of the longest possible run of 1s.",
    constraints: ["1 ≤ nums.length ≤ 2·10⁵", "0 ≤ k ≤ nums.length"],
    samples: [
      { args: [[1, 1, 0, 0, 1, 1, 1, 0, 1], 1], expected: 5, why: "Flip the zero at index 7: positions 4–8 become 1, 1, 1, 1, 1." },
      { args: [[0, 1, 1, 0, 1, 0, 0, 1, 1, 1], 2], expected: 6 },
      { args: [[0, 0], 0], expected: 0 }],
    clarify: [
      "Restates it as: the longest window that contains at most k zeros",
      "Asks about k = 0 and k ≥ number of zeros",
      "Plans a sliding window with a zero count"],
    look: [
      "Two pointers: grow right, count zeros, move left while zeros > k",
      "Records the best window length after each step",
      "No nested rescans: left only moves forward, so it's O(n)",
      "Clear variable names (left, zeros, best)"],
    testing: [
      "All ones, all zeros with k = 0 and k = n, one element",
      "O(n) time, O(1) space"],
    followup: "The bits arrive as a stream too long to store. Can you still answer? (Keep only the positions of the last k + 1 zeros.)"
  },

  /* ---------------- Session 5 ---------------- */
  "sorted-matrix-search": {
    title: "Search a sorted grid",
    fn: "searchMatrix", params: [["matrix", "int[][]"], ["target", "int"]], returns: "bool",
    statement: [
      "Each row of `matrix` is sorted left to right in ascending order, and each column is sorted top to bottom in ascending order. (A row doesn't necessarily start after the previous row ends.)",
      "Return whether `target` is in the matrix, faster than checking every cell."],
    input: ["`matrix`: an m × n grid of integers (may be empty).", "`target`: the value to find."],
    output: "true if target appears in the matrix, otherwise false.",
    constraints: ["0 ≤ m, n ≤ 300", "−10⁹ ≤ matrix[i][j], target ≤ 10⁹", "Rows and columns are sorted ascending (equal neighbours allowed)"],
    samples: [
      { args: [[[1, 3, 6, 10], [2, 5, 9, 14], [4, 8, 12, 15], [7, 11, 13, 20]], 9], expected: true },
      { args: [[[1, 3, 6, 10], [2, 5, 9, 14], [4, 8, 12, 15], [7, 11, 13, 20]], 16], expected: false },
      { args: [[], 3], expected: false }],
    clarify: [
      "Asks whether the grid is sorted as one long list (it isn't) or only by rows and columns",
      "Asks about empty grids and duplicates",
      "Compares: binary search per row O(m log n) versus the staircase O(m + n)"],
    look: [
      "Start at the top-right corner (or bottom-left): every step removes a row or a column",
      "Bigger than target: move left; smaller: move down; equal: done",
      "Handles an empty matrix and empty rows without crashing",
      "Explains why the corner works: it's the largest in its row and smallest in its column"],
    testing: [
      "Empty grid, 1 × 1, one row, one column, target smaller than everything and bigger than everything",
      "O(m + n) time, O(1) space"],
    followup: "Count how many cells are ≤ target, or find the k-th smallest value. (The same staircase walk, then binary search on the value.)"
  },
  "tank-capacity": {
    speed: true,
    title: "Smallest water tank",
    fn: "minCapacity", params: [["draws", "int[]"], ["k", "int"]], returns: "int",
    statement: [
      "A village draws `draws[i]` litres of water from its tank on day i. The tank holds C litres and starts empty. Each day, if the water left is less than that day's draw, the tank is first refilled to the brim (to exactly C litres); then the day's water is drawn. The first fill counts as a refill.",
      "A tank smaller than some day's draw can never work. Return the smallest whole number C for which the tank needs at most `k` refills over all the days."],
    input: ["`draws`: litres drawn on each day, in order.", "`k`: the most refills allowed."],
    output: "The smallest capacity C that needs at most k refills.",
    constraints: ["1 ≤ draws.length ≤ 10⁵", "1 ≤ draws[i] ≤ 10⁴", "1 ≤ k ≤ draws.length"],
    samples: [
      { args: [[4, 1, 3, 2, 5, 1], 3], expected: 6, why: "With C = 6: fill, use 4 and 1; fill, use 3 and 2; fill, use 5 and 1. Three refills. C = 5 needs four." },
      { args: [[5, 1, 1, 1], 1], expected: 8, why: "One fill has to cover every day, so C is the total." },
      { args: [[1, 2, 3, 4, 5], 5], expected: 5 }],
    clarify: [
      "Asks what happens to leftover water at a refill (it stays; the tank is topped up to C)",
      "Notices each fill covers a run of consecutive days with total ≤ C",
      "Spots the search range: from max(draws) to sum(draws), and that more capacity never needs more refills"],
    look: [
      "Binary search on the answer C, with a simulation that counts refills",
      "The simulation treats a draw bigger than C as impossible",
      "Correct bounds and loop (lo = mid + 1 / hi = mid) that ends on the smallest feasible C",
      "Can explain why feasibility is monotonic"],
    testing: [
      "One day, k = n (answer is the largest draw), k = 1 (answer is the total)",
      "O(n log S) time where S = sum(draws); O(1) space"],
    followup: "Days arrive in any order you like. Does the answer change? (Yes: then it's a bin-packing problem, which is much harder.)"
  },

  /* ---------------- Session 6 ---------------- */
  "paint-houses": {
    title: "Paint the street",
    fn: "minPaintCost", params: [["costs", "int[][]"]], returns: "int",
    statement: [
      "A row of n houses must each be painted red, green or blue. `costs[i][c]` is the price of painting house i with colour c (0, 1 or 2). Two neighbouring houses can't have the same colour.",
      "Return the cheapest total cost to paint every house."],
    input: ["`costs`: n rows of three prices each."],
    output: "The minimum total cost (0 when there are no houses).",
    constraints: ["0 ≤ n ≤ 10⁵", "0 ≤ costs[i][c] ≤ 10⁴"],
    samples: [
      { args: [[[8, 3, 6], [5, 9, 2], [7, 4, 8]]], expected: 9, why: "Colours 1, 2, 1: 3 + 2 + 4." },
      { args: [[[7, 6, 2]]], expected: 2 },
      { args: [[[1, 5, 5], [1, 5, 5]]], expected: 6, why: "Both houses want colour 0 but can't share it: 1 + 5." }],
    clarify: [
      "Asks about zero houses and whether costs can be zero",
      "Shows why greedy (cheapest colour each time) fails, with a tiny example",
      "Defines the state: best cost so far if house i gets colour c"],
    look: [
      "Recurrence: best[i][c] = costs[i][c] + min of best[i − 1] over the other two colours",
      "Keeps only the previous row (three numbers) for O(1) space",
      "Returns the minimum of the last row",
      "Follow-up ready: k colours in O(n·k) by tracking the smallest and second smallest"],
    testing: [
      "No houses, one house, two houses that want the same colour",
      "O(n) time, O(1) space"],
    followup: "Now there are k colours. Can you avoid O(n·k²)? (Keep the best and second-best totals from the previous house.)"
  },
  "bounded-subsets": {
    title: "Sums with limited copies",
    fn: "countBoundedSubsets", params: [["nums", "int[]"], ["target", "int"], ["k", "int"]], returns: "int",
    statement: [
      "`nums` holds distinct positive integers. Build a collection by choosing each value in `nums` between 0 and `k` times. Two collections are the same if every value is used the same number of times (order doesn't matter).",
      "Return how many different collections add up to exactly `target`. The empty collection counts when target is 0. The answer can be very large, so return it modulo 1,000,000,007."],
    input: ["`nums`: distinct positive integers.", "`target`: the sum to reach.", "`k`: the most copies of each value."],
    output: "The number of collections with sum target, modulo 10⁹ + 7.",
    constraints: ["1 ≤ nums.length ≤ 100", "1 ≤ nums[i] ≤ 1000, all distinct", "0 ≤ target ≤ 1000", "1 ≤ k ≤ 1000"],
    samples: [
      { args: [[1, 2, 3], 4, 2], expected: 3, why: "1+1+2, 1+3 and 2+2. (1+1+1+1 would use 1 four times.)" },
      { args: [[1, 2, 3], 4, 1], expected: 1, why: "Only 1+3." },
      { args: [[5], 0, 3], expected: 1, why: "The empty collection." }],
    clarify: [
      "Asks whether order matters (no) and whether values repeat in nums (they don't)",
      "Asks whether the empty collection counts for target 0",
      "Notices the answer can overflow and needs the modulo"],
    look: [
      "DP over values: ways[s] = number of collections of the values so far with sum s",
      "Adding value v up to k times: new[s] = ways[s] + ways[s − v] + … + ways[s − k·v]",
      "O(n · target · k) is fine to start; a sliding sum per remainder mod v gets O(n · target)",
      "Applies the modulo everywhere, including when subtracting (no negative results)"],
    testing: [
      "target 0, a value bigger than target, k = 1 (each value at most once), large k",
      "O(n · target) time with the sliding sum, O(target) space"],
    followup: "What if nums can contain the same value twice, and copies at different positions count as different items? (Group equal values first.)"
  },

  /* ---------------- Session 7 ---------------- */
  "graph-cycle": {
    title: "Cycle in a directed graph",
    fn: "hasCycle", params: [["n", "int"], ["edges", "int[][]"]], returns: "bool",
    statement: [
      "A directed graph has nodes 0 to n − 1. Each `edges[i] = [u, v]` is an edge from u to v. Edges may repeat, and an edge from a node to itself is allowed.",
      "Return whether the graph contains a cycle: a path that follows edges and comes back to where it started."],
    input: ["`n`: the number of nodes.", "`edges`: a list of directed [u, v] edges."],
    output: "true if there is a cycle, otherwise false.",
    constraints: ["1 ≤ n ≤ 1000", "0 ≤ edges.length ≤ 5000", "0 ≤ u, v < n"],
    samples: [
      { args: [3, [[0, 1], [1, 2], [2, 0]]], expected: true },
      { args: [4, [[0, 1], [0, 2], [1, 3], [2, 3]]], expected: false, why: "Two paths reach node 3, but none comes back." },
      { args: [2, [[1, 1]]], expected: true, why: "A self-loop is a cycle." }],
    clarify: [
      "Confirms the graph is directed (undirected needs a different check)",
      "Asks about self-loops, repeated edges and disconnected parts",
      "Picks DFS with three colours or Kahn's algorithm, and says why"],
    look: [
      "DFS with visiting / done states: an edge to a node still being visited means a cycle",
      "Or Kahn's algorithm: if the topological order doesn't include every node, there's a cycle",
      "Starts from every unvisited node, so disconnected parts are checked",
      "Mentions recursion depth for long chains, or writes it iteratively"],
    testing: [
      "One node, a self-loop, a diamond (no cycle), two components where only one has a cycle",
      "O(n + e) time and space"],
    followup: "Return the nodes of one cycle, not just true or false. (Keep the DFS path or parent pointers.)"
  },
  "course-semesters": {
    title: "Fewest semesters",
    fn: "minSemesters", params: [["n", "int"], ["prereqs", "int[][]"]], returns: "int",
    statement: [
      "There are n courses, numbered 0 to n − 1. Each `prereqs[i] = [a, b]` means course a must be finished in an earlier semester than course b.",
      "In one semester you can take any number of courses, as long as all their prerequisites are done. Return the fewest semesters needed to take every course, or −1 if it's impossible (the prerequisites go round in a circle)."],
    input: ["`n`: the number of courses.", "`prereqs`: a list of [before, after] pairs."],
    output: "The minimum number of semesters, or −1.",
    constraints: ["1 ≤ n ≤ 1000", "0 ≤ prereqs.length ≤ 5000", "0 ≤ a, b < n (a course listed as its own prerequisite makes it impossible)"],
    samples: [
      { args: [4, [[0, 1], [0, 2], [1, 3], [2, 3]]], expected: 3, why: "Semester 1: course 0. Semester 2: courses 1 and 2. Semester 3: course 3." },
      { args: [3, [[0, 1], [1, 2], [2, 1]]], expected: -1 },
      { args: [3, []], expected: 1 }],
    clarify: [
      "Confirms there's no limit on courses per semester",
      "Asks what to return for a cycle and for no prerequisites",
      "Recognises it as the longest path in a DAG, found level by level"],
    look: [
      "Kahn's algorithm in levels: all in-degree-0 courses form semester 1, and so on",
      "Counts how many courses were taken; fewer than n means a cycle, so −1",
      "Builds the adjacency list and in-degrees once; no repeated scans of the edge list",
      "Explains why taking everything available each semester is optimal"],
    testing: [
      "No prerequisites, a single chain, a cycle, a self-loop, a course with many prerequisites",
      "O(n + e) time and space"],
    followup: "At most m courses per semester. Does the same approach still give the minimum? (No; in general that version is NP-hard.)"
  },

  /* ---------------- Session 8 ---------------- */
  "sudoku-check": {
    title: "Check a sudoku",
    fn: "isValidSudoku", params: [["board", "int[][]"]], returns: "bool",
    statement: [
      "A 9 × 9 sudoku board is partly filled in. `board[r][c]` is a digit 1–9, or 0 for an empty cell.",
      "Return whether the board breaks no rules so far: no digit repeats within a row, within a column, or within any of the nine 3 × 3 boxes. You don't need to check that the puzzle can be solved."],
    input: ["`board`: 9 rows of 9 integers from 0 to 9."],
    output: "true if no row, column or box repeats a digit, otherwise false.",
    constraints: ["board is 9 × 9", "0 ≤ board[r][c] ≤ 9 (0 means empty)"],
    samples: [
      { args: [[[0, 9, 0, 0, 0, 0, 8, 0, 2], [0, 2, 0, 0, 7, 0, 0, 0, 0], [0, 1, 7, 0, 0, 0, 5, 6, 4], [4, 0, 0, 7, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0, 9], [0, 0, 0, 0, 0, 2, 3, 8, 0], [0, 0, 0, 0, 0, 8, 0, 0, 0], [0, 0, 0, 0, 6, 0, 9, 0, 0], [0, 0, 0, 0, 0, 0, 6, 2, 0]]], expected: true },
      { args: [[[1, 9, 0, 0, 0, 0, 8, 0, 2], [0, 2, 0, 0, 7, 0, 0, 0, 0], [0, 1, 7, 0, 0, 0, 5, 6, 4], [4, 0, 0, 7, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0, 9], [0, 0, 0, 0, 0, 2, 3, 8, 0], [0, 0, 0, 0, 0, 8, 0, 0, 0], [0, 0, 0, 0, 6, 0, 9, 0, 0], [0, 0, 0, 0, 0, 0, 6, 2, 0]]], expected: false, why: "The 1 in the top-left corner repeats the 1 two rows down in the same 3 × 3 box, though its row and column are fine." }],
    clarify: [
      "Confirms empty cells are ignored and solvability isn't checked",
      "Asks whether the input is always 9 × 9 with digits 0–9",
      "Plans one pass with three kinds of seen-sets"],
    look: [
      "Box index from (r / 3, c / 3), or 3·(r / 3) + c / 3",
      "One pass with sets (or 9-bit masks) per row, column and box",
      "Skips zeros before checking",
      "Readable code: no copy-pasted triple loops"],
    testing: [
      "An empty board, a full valid grid, a duplicate only in a box, only in a row, only in a column",
      "O(81) = O(1) for a fixed board; O(n²) for an n × n board"],
    followup: "Now solve the sudoku. How would you search, and how do the same checks speed it up? (Backtracking with bitmasks; pick the cell with the fewest options.)"
  },
  "move-to-ends": {
    title: "Move to the ends",
    fn: "minMoves", params: [["a", "int[]"], ["b", "int[]"]], returns: "int",
    statement: [
      "Lists `a` and `b` contain the same distinct values in different orders. In one move you take any element of b and move it to the very start or the very end of b.",
      "Return the fewest moves that make b exactly equal to a."],
    input: ["`a`: the target order.", "`b`: the same values, in the order you start with."],
    output: "The minimum number of moves.",
    constraints: ["n = a.length = b.length, 1 ≤ n ≤ 10⁵", "a and b contain the same n distinct values, in different orders"],
    samples: [
      { args: [[4, 2, 3, 5, 1, 6], [1, 5, 4, 2, 6, 3]], expected: 3, why: "4, 2, 3 already appear in that order in b, so they can stay. Move 5, 1, 6 to the end one by one." },
      { args: [[4, 2, 3, 5, 1, 6], [6, 3, 2, 5, 4, 1]], expected: 3, why: "3, 5, 1 can stay. Move 2 then 4 to the start, and 6 to the end." },
      { args: [[1, 2, 3], [1, 2, 3]], expected: 0 }],
    clarify: [
      "Works a small example by hand to see what moved elements have in common",
      "Notices that elements you never move keep their relative order in b",
      "Asks whether values are distinct (yes) and how large n is"],
    look: [
      "Key insight: the untouched elements must be a contiguous block of a, appearing in the same order in b",
      "Answer = n − (longest run a[i..j] whose positions in b are increasing)",
      "Maps each value to its index in b, then one pass over a",
      "Explains why everything else can be moved: the ones before the block go to the start (in reverse), the rest to the end"],
    testing: [
      "Already equal (0), reversed, one element, the block at the start, middle or end",
      "O(n) time, O(n) space for the position map"],
    followup: "What if a move can put the element anywhere, not just at the ends? (Then it's n minus the longest increasing subsequence of positions.)"
  },

  /* ---------------- Session 9 ---------------- */
  "scoreboard": {
    speed: true,
    title: "Design a scoreboard",
    cls: "Scoreboard",
    methods: [
      { name: "assign", params: [["name", "string"], ["score", "int"]], returns: "void" },
      { name: "remove", params: [["name", "string"]], returns: "void" },
      { name: "maxScore", params: [], returns: "pair" },
      { name: "getScore", params: [["name", "string"]], returns: "int?" }],
    starters: {
      python: "class Scoreboard:\n    def __init__(self):\n        pass\n\n    def assign(self, name: str, score: int) -> None:\n        pass\n\n    def remove(self, name: str) -> None:\n        pass\n\n    def max_score(self) -> list | None:\n        # [name, score] of the leader, or None when empty\n        pass\n\n    def get_score(self, name: str) -> int | None:\n        pass\n",
      javascript: "class Scoreboard {\n    constructor() {\n    }\n\n    assign(name, score) {\n    }\n\n    remove(name) {\n    }\n\n    /** @return {[string, number] | null} the leader, or null when empty */\n    maxScore() {\n    }\n\n    /** @return {number | null} */\n    getScore(name) {\n    }\n}\n",
      typescript: "class Scoreboard {\n    constructor() {\n    }\n\n    assign(name: string, score: number): void {\n    }\n\n    remove(name: string): void {\n    }\n\n    // The leader, or null when empty\n    maxScore(): [string, number] | null {\n        return null;\n    }\n\n    getScore(name: string): number | null {\n        return null;\n    }\n}\n",
      java: "import java.util.*;\n\nclass Scoreboard {\n    public Scoreboard() {\n    }\n\n    public void assign(String name, int score) {\n    }\n\n    public void remove(String name) {\n    }\n\n    // The leader as (name, score), or null when empty\n    public Map.Entry<String, Integer> maxScore() {\n        return null;\n    }\n\n    public Integer getScore(String name) {\n        return null;\n    }\n}\n",
      cpp: "#include <optional>\n#include <string>\n#include <utility>\nusing namespace std;\n\nclass Scoreboard {\npublic:\n    Scoreboard() {\n    }\n\n    void assign(const string& name, int score) {\n    }\n\n    void remove(const string& name) {\n    }\n\n    // The leader as (name, score), or nullopt when empty\n    optional<pair<string, int>> maxScore() {\n        return nullopt;\n    }\n\n    optional<int> getScore(const string& name) {\n        return nullopt;\n    }\n};\n",
      go: "type Scoreboard struct {\n}\n\nfunc NewScoreboard() *Scoreboard {\n    return &Scoreboard{}\n}\n\nfunc (s *Scoreboard) Assign(name string, score int) {\n}\n\nfunc (s *Scoreboard) Remove(name string) {\n}\n\n// The leader's name and score; ok is false when empty\nfunc (s *Scoreboard) MaxScore() (name string, score int, ok bool) {\n    return \"\", 0, false\n}\n\nfunc (s *Scoreboard) GetScore(name string) (score int, ok bool) {\n    return 0, false\n}\n",
      csharp: "using System.Collections.Generic;\n\npublic class Scoreboard {\n    public Scoreboard() {\n    }\n\n    public void Assign(string name, int score) {\n    }\n\n    public void Remove(string name) {\n    }\n\n    // The leader, or null when empty\n    public (string Name, int Score)? MaxScore() {\n        return null;\n    }\n\n    public int? GetScore(string name) {\n        return null;\n    }\n}\n"
    },
    statement: [
      "Design a class `Scoreboard` that keeps one score per player name:",
      "`assign(name, score)` adds the player, or replaces their score if they're already there. `remove(name)` deletes the player (nothing happens if they aren't there). `maxScore()` returns `[name, score]` for the highest score; if several players share it, the smallest name in character order (compare the names as strings); or null (None in Python) when the board is empty. `getScore(name)` returns the player's score, or null if they aren't there.",
      "Each test is a list of operations, run in order on one new Scoreboard. The expected output lists what each operation returns (null for the constructor, assign and remove). Aim for O(log n) per operation."],
    input: ["`ops`: operation names, starting with \"Scoreboard\".", "`args`: the arguments for each operation."],
    output: "What each operation returns, in order.",
    constraints: ["Up to 10⁵ operations per test", "Names are 1–10 lowercase letters or digits", "0 ≤ score ≤ 10⁹"],
    samples: [
      { args: [["Scoreboard", "assign", "assign", "maxScore", "assign", "getScore", "maxScore", "remove", "maxScore", "getScore", "getScore"],
               [[], ["abc", 10], ["pqr", 5], [], ["aaa", 10], ["pqr"], [], ["aaa"], [], ["abc"], ["aaa"]]],
        expected: [null, null, null, ["abc", 10], null, 5, ["aaa", 10], null, ["abc", 10], 10, null],
        why: "\"aaa\" ties with \"abc\" at 10 and is the smaller string, until it's removed." },
      { args: [["Scoreboard", "assign", "assign", "maxScore"], [[], ["zed", 3], ["zed", 1], []]], expected: [null, null, null, ["zed", 1]], why: "Assigning again replaces the score." },
      { args: [["Scoreboard", "maxScore", "remove", "getScore"], [[], [], ["x"], ["x"]]], expected: [null, null, null, null] }],
    clarify: [
      "Asks how ties are broken and what to return when the board is empty",
      "Asks which operations are most frequent (shapes the data structure choice)",
      "Clarifies that assign on an existing name replaces, not adds"],
    look: [
      "A hash map name → score for getScore, plus an ordered structure for maxScore",
      "Ordered by (−score, name): a sorted set / tree, or a heap with lazy deletion of stale entries",
      "Updates remove or invalidate the old entry, so a stale higher score is never returned",
      "States the cost of each operation and the memory used by stale heap entries"],
    testing: [
      "Empty board, ties, re-assigning a lower score, removing the leader, removing a missing name",
      "O(log n) per update and amortised O(log n) for maxScore with a lazy heap; O(n) space (plus stale entries)"],
    followup: "Add top(k): the k best players in order. Which structure makes that cheap? (A balanced tree or sorted set: O(k + log n).)"
  },
  "heap-k-largest": {
    title: "K largest from a heap",
    fn: "kLargest", params: [["heap", "int[]"], ["k", "int"]], returns: "int[]", keep: [0],
    statement: [
      "`heap` is a max-heap stored as a list: for every index i, heap[i] ≥ heap[2i + 1] and heap[i] ≥ heap[2i + 2] (when those exist), so heap[0] is the largest.",
      "Return the k largest values in descending order. Don't modify `heap`, and don't copy or sort the whole list: aim for O(k log k) time."],
    input: ["`heap`: a valid max-heap.", "`k`: how many values to return."],
    output: "The k largest values, largest first.",
    constraints: ["1 ≤ heap.length ≤ 10⁵", "0 ≤ k ≤ heap.length", "−10⁶ ≤ heap[i] ≤ 10⁶"],
    samples: [
      { args: [[15, 13, 12, 10, 8, 9], 5], expected: [15, 13, 12, 10, 9] },
      { args: [[7, 7, 3], 2], expected: [7, 7] },
      { args: [[4, 1, 2], 0], expected: [] }],
    clarify: [
      "Asks whether the input may be changed (no) and what to return for k = 0",
      "States the easy answers (sort: O(n log n); pop k times from a copy: O(n + k log n)) and why they're not wanted",
      "Notices that the next largest is always a child of something already taken"],
    look: [
      "An auxiliary max-heap of candidate (value, index) pairs, starting with index 0",
      "Pop the best candidate, record it, push its two children",
      "Never touches more than about 2k indices: O(k log k) time, O(k) space",
      "Handles duplicates and k = 0 or k = n"],
    testing: [
      "k = 0, k = 1, k = n, duplicate values, a heap of one element",
      "O(k log k) time and O(k) space"],
    followup: "What if you only need the k-th largest, not all k? (Same walk; or quickselect on a copy if you can afford O(n).)"
  },

  /* ---------------- Session 10 ---------------- */
  "subarray-sum-k": {
    speed: true,
    title: "Subarrays that sum to k",
    fn: "countSubarrays", params: [["nums", "int[]"], ["k", "int"]], returns: "long",
    statement: [
      "Return how many contiguous, non-empty subarrays of `nums` have a sum of exactly `k`.",
      "Values can be negative, so a sliding window doesn't work. Beat the O(n²) approach of trying every start and end."],
    input: ["`nums`: a list of integers (may be negative).", "`k`: the target sum."],
    output: "The number of subarrays with sum k.",
    constraints: ["1 ≤ nums.length ≤ 2·10⁵", "−1000 ≤ nums[i] ≤ 1000", "−10⁸ ≤ k ≤ 10⁸"],
    samples: [
      { args: [[3, 1, 2, -1, 1], 3], expected: 3, why: "[3], [1, 2] and [1, 2, −1, 1]." },
      { args: [[1, -1, 1, -1], 0], expected: 4, why: "[1, −1] twice, [−1, 1], and the whole list." },
      { args: [[2, 2, 2], 5], expected: 0 }],
    clarify: [
      "Asks whether values can be negative or zero (rules out two pointers)",
      "Asks whether the answer can be large (n² / 2 subarrays: use 64-bit)",
      "Plans prefix sums: sum(i..j) = prefix[j + 1] − prefix[i]"],
    look: [
      "A hash map from prefix sum to how many times it has appeared, seeded with {0: 1}",
      "For each new prefix p, add count[p − k] before recording p (so empty subarrays aren't counted)",
      "Explains why seeding with 0 counts subarrays that start at index 0",
      "Follow-up ready: for 'sum divisible by k', key the map by ((p % k) + k) % k so negative sums work"],
    testing: [
      "One element equal to k, all zeros with k = 0, negatives, no answer",
      "O(n) time, O(n) space"],
    followup: "Count subarrays whose sum is divisible by k instead. (Prefix sums modulo k; normalise negative remainders.)"
  },
  "age-halves": {
    speed: true,
    title: "Younger half, older half",
    fn: "skillGaps", params: [["ages", "int[]"], ["skills", "int[]"]], returns: "int[]",
    statement: [
      "Employees join a company one per day: on day i, a person with age `ages[i]` and skill `skills[i]` arrives. At the end of each day, everyone who has joined so far is split by age into a younger half and an older half. With an odd number of people, the younger half gets the extra person.",
      "If two people have the same age, the one who arrived earlier counts as younger.",
      "For each day, return the absolute difference between the younger half's total skill and the older half's total skill."],
    input: ["`ages`: the age of the person arriving each day.", "`skills`: their skill, same length."],
    output: "A list with one difference per day.",
    constraints: ["1 ≤ n ≤ 10⁵", "1 ≤ ages[i] ≤ 100", "0 ≤ skills[i] ≤ 10⁴"],
    samples: [
      { args: [[6, 10, 5, 3], [8, 3, 11, 1]], expected: [8, 5, 16, 1], why: "Day 3: ages 5, 6 | 10, so (11 + 8) − 3 = 16. Day 4: ages 3, 5 | 6, 10, so 12 − 11 = 1." },
      { args: [[30, 30], [1, 9]], expected: [1, 8], why: "Same age: the first to arrive is the younger one." },
      { args: [[40], [7]], expected: [7] }],
    clarify: [
      "Asks how an odd count and equal ages are handled (both are defined above)",
      "Notices re-sorting every day is O(n² log n) and looks for an incremental structure",
      "Recognises the 'running median' pattern"],
    look: [
      "Two heaps: a max-heap for the younger half and a min-heap for the older half, keyed by (age, arrival day)",
      "Keeps running skill sums for each half, updated on every push and move",
      "Rebalances so the younger half has the same size or one more",
      "Inserts by comparing with the younger half's oldest person; correct tie-breaking"],
    testing: [
      "One person, equal ages, ages arriving in increasing and decreasing order",
      "O(n log n) time, O(n) space"],
    followup: "People can also leave. What changes? (Lazy deletion in both heaps, or an order-statistics tree.)"
  },
  /* ---------------- Session 11 ---------------- */
  "bst-dead-ends": {
    title: "No dead ends in a search tree",
    fn: "noDeadEnds", params: [["root", "tree"]], returns: "bool",
    statement: [
      "`root` is a binary search tree of distinct positive integers: every value in a node's left subtree is smaller than the node, and every value in its right subtree is larger.",
      "A leaf is a dead end if no new integer (at least 1, not already in the tree) could be added as its child without breaking that rule. For example, a leaf 4 whose ancestors force every value below it to lie strictly between 3 and 5 is a dead end: nothing fits on either side.",
      "Return true if the tree has no dead ends, and false if at least one leaf is a dead end."],
    input: ["`root`: the tree, written in level order with null (None in Python) for a missing child. The page builds `TreeNode` objects with `val`, `left` and `right` for you."],
    output: "true if no leaf is a dead end, otherwise false. An empty tree has no dead ends.",
    constraints: ["0 ≤ number of nodes ≤ 10⁴", "1 ≤ node values ≤ 10⁹, all distinct", "The input is a valid binary search tree"],
    samples: [
      { args: [[8, 4, 12, 2, 6, 10, 14]], expected: true, why: "Every leaf has room: e.g. 1 or 3 under the 2, and 5 or 7 under the 6." },
      { args: [[5, 2, 8, 1, 3]], expected: false, why: "The leaf 1 must hold values between 0 and 2 below it: no positive integer fits." },
      { args: [[10, 8, 15, null, 9]], expected: false, why: "The leaf 9 sits between 8 and 10, so nothing can go under it." }],
    clarify: [
      "Confirms values are positive and distinct, so 0 is the floor below the smallest value",
      "Asks what counts as a leaf and what to return for an empty tree",
      "Restates it as intervals: each node's value had to fit between a low and a high bound"],
    look: [
      "Passes (low, high) down the tree: left child gets (low, node), right child gets (node, high), starting from (0, ∞)",
      "A leaf with value v is a dead end exactly when low = v − 1 and high = v + 1",
      "Stops early on the first dead end",
      "Iterative or recursive, with a word about recursion depth on a very tall tree"],
    testing: [
      "Empty tree, a single node 1 (it can still take 2 on the right), consecutive values, a long chain",
      "O(n) time, O(h) space for the recursion or stack"],
    followup: "Now values can be any integers, including negatives. What changes? (Start from (−∞, ∞): only a squeeze between two neighbours makes a dead end.)"
  },
  "complete-tree-count": {
    speed: true,
    title: "Count a complete tree",
    fn: "countNodes", params: [["root", "tree"]], returns: "long",
    statement: [
      "`root` is a complete binary tree: every level is full except possibly the last, and the last level's nodes are as far left as possible.",
      "Return the number of nodes. Visiting every node takes O(n); use the shape of the tree to do it in O(log² n).",
      "In the tests, small trees are written as level-order lists. The full-size test is a tree with over a billion nodes that the page builds only as you visit it, so only a solution that visits about O(log² n) nodes finishes in time."],
    input: ["`root`: the tree, in level order (the values don't matter, only the shape). The page builds `TreeNode` objects with `val`, `left` and `right`."],
    output: "The number of nodes (0 for an empty tree).",
    constraints: ["0 ≤ number of nodes ≤ 2·10⁹", "The tree is complete"],
    samples: [
      { args: [[9, 4, 7, 1, 8, 2, 6, 3, 5, 10, 11]], expected: 11, why: "Three full levels (7 nodes) plus four nodes on the last level." },
      { args: [[3, 1, 4, 1, 5, 9, 2, 6]], expected: 8 },
      { args: [[42]], expected: 1 }],
    clarify: [
      "Confirms what complete means, and that the values don't matter",
      "Notes a perfect tree of height h has 2^h − 1 nodes",
      "Aims below O(n): you can't afford to visit every node"],
    look: [
      "Measures the leftmost depth of the left and right subtrees (walking left only)",
      "Equal depths: the left subtree is perfect, so add 2^depth and continue right; otherwise the right subtree is perfect (one level shorter), so add 2^depth and continue left",
      "Each step costs O(log n) and there are O(log n) steps: O(log² n)",
      "Uses shifts or powers carefully (no overflow for large counts)"],
    testing: [
      "Empty tree, one node, a perfect tree, a last level with one node or missing one node",
      "O(log² n) time, O(1) extra space for the iterative version"],
    followup: "Can you find the number of nodes on the last level with a binary search over positions? (Yes: test whether position i exists by walking down along its bits.)"
  },

  /* ---------------- Session 12 ---------------- */
  "warmer-days": {
    speed: true,
    title: "Days until it's warmer",
    fn: "daysUntilWarmer", params: [["temps", "int[]"]], returns: "int[]",
    statement: [
      "`temps[i]` is the temperature on day i. For each day, return how many days you have to wait for a strictly warmer day. If no later day is warmer, use 0.",
      "Checking every later day for every day is O(n²); do it in one pass."],
    input: ["`temps`: daily temperatures."],
    output: "A list of the same length with the wait for each day.",
    constraints: ["1 ≤ temps.length ≤ 2·10⁵", "−50 ≤ temps[i] ≤ 50"],
    samples: [
      { args: [[12, 15, 11, 9, 14, 20, 18]], expected: [1, 4, 2, 1, 1, 0, 0], why: "Day 1 (15°) waits until day 5 (20°): 4 days. The last two days never see a warmer day." },
      { args: [[5, 5, 5]], expected: [0, 0, 0], why: "Equal isn't warmer." },
      { args: [[-3, -1, 2]], expected: [1, 1, 0] }],
    clarify: [
      "Confirms strictly warmer, and 0 when there's none",
      "Asks about the size of the input (rules out O(n²))",
      "Thinks of it as 'next greater element'"],
    look: [
      "A stack of indexes whose temperatures don't increase from bottom to top",
      "For each day, pop every day that's colder than today and record the distance",
      "Each index is pushed and popped at most once: O(n)",
      "Days left on the stack keep 0"],
    testing: [
      "One day, all equal, strictly rising, strictly falling",
      "O(n) time, O(n) space for the stack"],
    followup: "Temperatures can only be −50 to 50. Is there another O(n·range) approach scanning from the right? (Keep the next index of each temperature.)"
  },
  "fair-candies": {
    speed: true,
    title: "Fair candies",
    fn: "minCandies", params: [["ratings", "int[]"]], returns: "long",
    statement: [
      "Children stand in a row, and `ratings[i]` is child i's rating. Give out candies so that every child gets at least one, and a child with a higher rating than a neighbour gets more candies than that neighbour. Children with equal ratings have no rule between them.",
      "Return the fewest candies in total."],
    input: ["`ratings`: one rating per child, in row order."],
    output: "The minimum total number of candies.",
    constraints: ["1 ≤ ratings.length ≤ 10⁵", "0 ≤ ratings[i] ≤ 2·10⁵"],
    samples: [
      { args: [[2, 6, 6, 3]], expected: 6, why: "1, 2, 2, 1: each 6 beats its smaller neighbour, and the two 6s don't need to differ." },
      { args: [[4, 3, 2, 1]], expected: 10, why: "4, 3, 2, 1 candies." },
      { args: [[7]], expected: 1 }],
    clarify: [
      "Asks what happens between equal neighbours (no rule)",
      "Notices each child depends on both sides",
      "Asks whether the total can exceed 32 bits (it can approach n²/2)"],
    look: [
      "Two passes: left to right for rising slopes, right to left for falling ones, taking the larger requirement",
      "Explains why the larger of the two requirements is both enough and necessary",
      "O(n) time; O(1) extra space is a possible follow-up with slope counting",
      "Uses a 64-bit total"],
    testing: [
      "One child, all equal, strictly rising, strictly falling, a peak and a valley",
      "O(n) time, O(n) space"],
    followup: "Can you do it in O(1) extra space? (Count lengths of rising and falling runs and add arithmetic series.)"
  },

  /* ---------------- Session 13 ---------------- */
  "k-palindrome": {
    speed: true,
    title: "Palindrome within k removals",
    fn: "canMakePalindrome", params: [["s", "string"], ["k", "int"]], returns: "bool",
    statement: [
      "Can you turn the string `s` into a palindrome (it reads the same both ways) by deleting at most `k` of its characters?",
      "Trying every set of deletions is exponential. Find the fewest deletions with dynamic programming in O(n²)."],
    input: ["`s`: lowercase letters.", "`k`: the most characters you may delete."],
    output: "true if at most k deletions make s a palindrome, otherwise false.",
    constraints: ["0 ≤ s.length ≤ 200", "0 ≤ k ≤ s.length"],
    samples: [
      { args: ["radar", 0], expected: true },
      { args: ["bandana", 2], expected: true, why: "Delete the b and the d: \"anana\"." },
      { args: ["abcde", 3], expected: false, why: "At least four deletions are needed: only one letter can stay." }],
    clarify: [
      "Confirms only deletions are allowed, and the empty string counts as a palindrome",
      "Connects it to the longest palindromic subsequence: deletions = n − LPS",
      "Checks the size: n ≤ 200 allows O(n²) (even O(n³)), but not exponential"],
    look: [
      "dp[i][j] = fewest deletions to make s[i..j] a palindrome: equal ends → dp[i+1][j−1], otherwise 1 + min(dp[i+1][j], dp[i][j−1])",
      "Or LPS via LCS of s and its reverse",
      "Fills the table in the right order (by length, or i from the end) and keeps O(n) memory with two rows",
      "Can stop early when the answer is clearly over k (optional)",
      "A bottom-up table avoids recursion limits: in the browser, Python recursion with @cache stops after a few hundred levels"],
    testing: [
      "Empty string, one letter, already a palindrome, all different letters, k = 0",
      "O(n²) time, O(n) space with two rows"],
    followup: "If k is much smaller than n, can you beat O(n²)? (Compare s with its reverse in an edit-distance table and keep only the band within k of the diagonal: O(n·k).)"
  },
  "next-permutation": {
    title: "Next arrangement",
    fn: "nextPermutation", params: [["nums", "int[]"]], returns: "int[]", inplace: 0,
    statement: [
      "Rearrange the list `nums` into the next arrangement in dictionary order: the smallest arrangement that is larger than the current one. If the list is already the largest arrangement (sorted from high to low), wrap around to the smallest one (sorted low to high).",
      "Change the list in place using O(1) extra memory, and return it. (Returning nothing after changing the list also works.)"],
    input: ["`nums`: integers, possibly with repeats."],
    output: "The same list, rearranged.",
    constraints: ["1 ≤ nums.length ≤ 100", "0 ≤ nums[i] ≤ 100"],
    samples: [
      { args: [[2, 4, 3, 1]], expected: [3, 1, 2, 4], why: "The 2 is the last place that can grow: swap it with 3 (the smallest bigger value to its right), then sort what follows." },
      { args: [[5, 4, 1]], expected: [1, 4, 5], why: "Already the largest, so wrap around." },
      { args: [[1, 1, 2]], expected: [1, 2, 1] }],
    clarify: [
      "Asks what to do with the largest arrangement (wrap around) and with repeated values",
      "Works a small example by hand before coding",
      "Confirms in place with O(1) extra memory"],
    look: [
      "Finds the rightmost i with nums[i] < nums[i + 1]",
      "Swaps it with the rightmost value bigger than nums[i]",
      "Reverses the suffix after i (it was in falling order), which also handles the wrap-around",
      "Uses ≥ and ≤ correctly so repeated values work"],
    testing: [
      "One element, two equal elements, the largest arrangement, repeated values like [1, 5, 1]",
      "O(n) time, O(1) extra space"],
    followup: "Return the k-th next arrangement instead. (Use factorial numbering instead of calling this k times.)"
  },

  /* ---------------- Session 14 ---------------- */
  "nearest-exit": {
    speed: true,
    title: "Distance to the nearest exit",
    fn: "fillDistances", params: [["grid", "int[][]"]], returns: "int[][]", inplace: 0,
    statement: [
      "A building plan is a grid. Each cell is a wall (−1), an exit (0) or a room, marked `ROOM` = 2147483647 (2³¹ − 1). You can move up, down, left or right, but not through walls.",
      "Replace every room with the number of steps to its nearest exit. Rooms that can't reach any exit keep 2147483647. Return the grid (changing it in place is fine).",
      "Running a search from every room is far too slow on a large plan: aim for O(rows × cols)."],
    input: ["`grid`: rows of −1, 0 or 2147483647."],
    output: "The grid with each room replaced by its distance to the nearest exit.",
    constraints: ["1 ≤ rows, cols ≤ 500", "Each cell is −1, 0 or 2147483647"],
    samples: [
      { args: [[[2147483647, -1, 0], [2147483647, 2147483647, 2147483647], [0, -1, 2147483647]]], expected: [[2, -1, 0], [1, 2, 1], [0, -1, 2]], why: "The bottom-left exit is nearest for the left column; the top-right exit for the right column." },
      { args: [[[2147483647, -1], [-1, 0]]], expected: [[2147483647, -1], [-1, 0]], why: "The top-left room is walled in, so it keeps the room marker." }],
    clarify: [
      "Confirms the markers and that walls block movement (no diagonals)",
      "Asks what an unreachable room should hold",
      "Spots that the question is about exits, so start the search from them"],
    look: [
      "Multi-source BFS: put every exit in the queue at distance 0, then expand level by level",
      "A room is written the first time it's reached, which is its shortest distance",
      "Doesn't re-queue cells, so it's O(rows × cols)",
      "Explains why BFS from each room or each exit is slower"],
    testing: [
      "A single cell of each kind, a room boxed in by walls, several exits at the same distance",
      "O(rows × cols) time and space"],
    followup: "Exits now have different opening delays (a cost to start from each). What changes? (Dijkstra with multiple sources, or 0-1 BFS for small costs.)"
  },
  "min-effort-path": {
    speed: true,
    title: "Gentlest path",
    fn: "minEffort", params: [["heights", "int[][]"]], returns: "int",
    statement: [
      "`heights` is a grid of ground heights. You walk from the top-left cell to the bottom-right cell, moving up, down, left or right. The effort of a path is the largest absolute height difference between two consecutive cells on it.",
      "Return the smallest effort of any path."],
    input: ["`heights`: rows of heights."],
    output: "The minimum effort (0 if the grid has one cell).",
    constraints: ["1 ≤ rows, cols ≤ 200", "1 ≤ heights[r][c] ≤ 10⁶"],
    samples: [
      { args: [[[1, 3, 2], [6, 5, 8], [4, 9, 3]]], expected: 5, why: "For example 1 → 3 → 5 → 8 → 3 has steps 2, 2, 3 and 5; every path to the corner needs a step of at least 5." },
      { args: [[[4, 4, 4, 4]]], expected: 0 }],
    clarify: [
      "Confirms the effort is the maximum step on the path, not the sum",
      "Asks about grid size and height range",
      "Names two approaches: Dijkstra on the maximum, or binary search on the effort with a reachability check"],
    look: [
      "Dijkstra where a path's cost is max(cost so far, next step), with a min-heap and stale-entry skipping",
      "Or binary search on the effort with BFS/DFS, or union-find adding edges by size",
      "Stops when the target cell is popped",
      "States the complexity of the chosen approach"],
    testing: [
      "One cell, one row, flat ground, a cliff that must be crossed",
      "Dijkstra: O(R·C·log(R·C)); binary search: O(R·C·log H)"],
    followup: "Allow one 'jump' that ignores a single step's height difference. How does the state change? (Add a used-the-jump flag to each cell.)"
  },

  /* ---------------- Session 15 ---------------- */
  "cooldown-schedule": {
    title: "Tasks with a cooldown",
    fn: "leastTime", params: [["tasks", "string"], ["n", "int"]], returns: "int",
    statement: [
      "A machine runs tasks, one per time unit. `tasks` lists the tasks to run as capital letters (the same letter means the same kind of task), in any order you like. Between two runs of the same kind there must be at least `n` other time units (other tasks or idle); the machine may sit idle.",
      "Return the fewest time units needed to run every task."],
    input: ["`tasks`: capital letters A–Z.", "`n`: the cooldown between two tasks of the same kind."],
    output: "The minimum total time, idle units included.",
    constraints: ["1 ≤ tasks.length ≤ 10⁴", "0 ≤ n ≤ 100"],
    samples: [
      { args: ["AAABC", 2], expected: 7, why: "A B C A _ _ A: the three As need two gaps each, and B and C fill one gap." },
      { args: ["AABB", 0], expected: 4 },
      { args: ["XXYYZ", 3], expected: 6, why: "X Y Z _ X Y." }],
    clarify: [
      "Confirms tasks can run in any order and what n means exactly (n other units between, so n + 1 apart)",
      "Notices the most frequent task decides the frame",
      "Asks for size limits"],
    look: [
      "Counting formula: max(len, (maxCount − 1)·(n + 1) + number of kinds with maxCount)",
      "Or a simulation with a max-heap and a cooldown queue, with its cost",
      "Explains why the formula works, including when there are enough tasks to need no idle time",
      "Handles n = 0"],
    testing: [
      "One task, n = 0, several kinds tied for the maximum, many kinds so no idle time is needed",
      "O(len) time, O(1) space (26 counters)"],
    followup: "Now the tasks must run in the given order. How do you compute the time? (Track the last run time of each kind.)"
  },
  "heater-radius": {
    speed: true,
    title: "Heater range",
    fn: "minRadius", params: [["houses", "int[]"], ["heaters", "int[]"]], returns: "int",
    statement: [
      "Houses and heaters stand on a straight street, at the positions in `houses` and `heaters` (in no particular order; several can share a spot). Every heater warms everything within distance r of it.",
      "Return the smallest whole number r so that every house is warmed by at least one heater."],
    input: ["`houses`: house positions.", "`heaters`: heater positions."],
    output: "The minimum radius.",
    constraints: ["1 ≤ houses.length, heaters.length ≤ 10⁵", "1 ≤ positions ≤ 10⁹"],
    samples: [
      { args: [[2, 9, 15], [4, 12]], expected: 3, why: "House 9 and house 15 are each 3 away from their nearest heater." },
      { args: [[1, 5], [10]], expected: 9 },
      { args: [[7, 7], [7]], expected: 0 }],
    clarify: [
      "Asks whether the inputs are sorted (they aren't) and whether positions repeat",
      "Restates it: the answer is the largest distance from a house to its nearest heater",
      "Rules out O(houses × heaters) for the sizes given"],
    look: [
      "Sorts the heaters, then binary-searches each house's neighbours (or sorts both and uses two pointers)",
      "Checks both the heater before and after each house, and the ends of the street",
      "Takes the maximum of the nearest distances",
      "O((n + m) log m)"],
    testing: [
      "One heater, houses on both sides of it, a house exactly on a heater, repeated positions",
      "O((n + m) log m) time, O(m) space for the sorted copy"],
    followup: "You may now place k heaters anywhere. What's the smallest radius? (Binary search on r with a greedy placement.)"
  }
};
