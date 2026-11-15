function leastTime(tasks, n) {
    // Simulation: each step run the available task with the most copies left.
    const left = new Array(26).fill(0), readyAt = new Array(26).fill(0);
    for (const ch of tasks) left[ch.charCodeAt(0) - 65]++;
    let remaining = tasks.length, time = 0;
    while (remaining) {
        let pick = -1;
        for (let t = 0; t < 26; t++) if (left[t] && readyAt[t] <= time && (pick < 0 || left[t] > left[pick])) pick = t;
        if (pick >= 0) { left[pick]--; remaining--; readyAt[pick] = time + n + 1; time++; }
        else time = Math.min(...readyAt.filter((r, t) => left[t])); // idle until the next task is ready
    }
    return time;
}
