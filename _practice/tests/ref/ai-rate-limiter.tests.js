function testLimitReached() { assertEqual(allowRequests([1, 2, 3], 2, 10), [true, true, false]); }
function testBoundaryLeavesWindow() { assertEqual(allowRequests([1, 11], 1, 10), [true, true]); }
function testRejectedDoNotCount() { assertEqual(allowRequests([1, 2, 3, 4], 2, 3), [true, true, false, true]); }
function testSameSecond() { assertEqual(allowRequests([5, 5, 5], 2, 10), [true, true, false]); }
function testSlidingNotFixed() { assertEqual(allowRequests([8, 9, 10, 11], 2, 10), [true, true, false, false]); }
function testEmpty() { assertEqual(allowRequests([], 3, 5), []); }
