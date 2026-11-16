function rankScores(scores) {
    const first = new Map();
    [...scores].sort((a, b) => b - a).forEach((s, i) => { if (!first.has(s)) first.set(s, i + 1); });
    return scores.map(s => first.get(s));
}
