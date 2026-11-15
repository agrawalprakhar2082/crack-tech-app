function callWithRetry(service, clock, rand, policy) {
    const start = clock.now();
    for (let attempt = 1; ; attempt++) {
        try {
            return service.call();
        } catch (e) {
            if (!(e instanceof ServiceError) || !e.retryable || attempt >= policy.attempts) throw e;
            const delay = rand() * Math.min(policy.cap, policy.base * 2 ** (attempt - 1));
            if (clock.now() + delay >= start + policy.timeout) throw e;
            clock.sleep(delay);
        }
    }
}
