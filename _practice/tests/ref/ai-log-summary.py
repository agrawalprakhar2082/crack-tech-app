def summarize_log(lines):
    latencies, errors, slowest, slowest_ms = [], 0, None, -1
    for line in lines:
        parts = line.split()
        if len(parts) != 5:
            continue
        _, _, path, status, latency = parts
        if len(status) != 3 or not status.isdigit():
            continue
        if not latency.endswith("ms") or not latency[:-2].isdigit():
            continue
        ms = int(latency[:-2])
        if int(status) >= 500:
            errors += 1
        latencies.append(ms)
        if ms > slowest_ms:
            slowest_ms, slowest = ms, path.split("?")[0]
    latencies.sort()
    median = latencies[(len(latencies) - 1) // 2] if latencies else None
    return {"requests": len(latencies), "errors": errors, "median_ms": median, "slowest": slowest}
