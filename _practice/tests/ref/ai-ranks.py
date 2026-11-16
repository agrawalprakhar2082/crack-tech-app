def rank_scores(scores):
    first = {}
    for i, s in enumerate(sorted(scores, reverse=True)):
        first.setdefault(s, i + 1)
    return [first[s] for s in scores]
