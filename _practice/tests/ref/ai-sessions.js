function countSessions(events, gap) {
    const byUser = new Map();
    for (const [user, t] of events) {
        if (!byUser.has(user)) byUser.set(user, []);
        byUser.get(user).push(t);
    }
    return [...byUser.keys()].sort((a, b) => a - b).map(user => {
        const times = byUser.get(user).sort((a, b) => a - b);
        let sessions = 1;
        for (let i = 1; i < times.length; i++) if (times[i] - times[i - 1] > gap) sessions++;
        return [user, sessions];
    });
}
