def test_limit_reached():
    assert allow_requests([1, 2, 3], 2, 10) == [True, True, False]


def test_boundary_leaves_window():
    assert allow_requests([1, 11], 1, 10) == [True, True]


def test_rejected_do_not_count():
    assert allow_requests([1, 2, 3, 4], 2, 3) == [True, True, False, True]


def test_same_second():
    assert allow_requests([5, 5, 5], 2, 10) == [True, True, False]


def test_sliding_not_fixed():
    assert allow_requests([8, 9, 10, 11], 2, 10) == [True, True, False, False]


def test_empty():
    assert allow_requests([], 3, 5) == []
