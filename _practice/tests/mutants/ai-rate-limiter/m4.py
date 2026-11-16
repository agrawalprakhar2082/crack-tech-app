def allow_requests(times, limit, window):
    counts, out = {}, []
    for t in times:
        bucket = t // window
        if counts.get(bucket, 0) < limit:
            counts[bucket] = counts.get(bucket, 0) + 1
            out.append(True)
        else:
            out.append(False)
    return out
