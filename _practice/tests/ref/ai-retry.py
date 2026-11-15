def call_with_retry(service, clock, rand, policy):
    start = clock.now()
    attempt = 0
    while True:
        attempt += 1
        try:
            return service.call()
        except ServiceError as e:
            if not e.retryable or attempt >= policy["attempts"]:
                raise
            delay = rand() * min(policy["cap"], policy["base"] * 2 ** (attempt - 1))
            if clock.now() + delay >= start + policy["timeout"]:
                raise
            clock.sleep(delay)
