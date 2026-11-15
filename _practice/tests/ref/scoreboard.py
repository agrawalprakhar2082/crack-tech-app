import heapq


class Scoreboard:
    def __init__(self):
        self.scores = {}
        self.heap = []  # (-score, name), with stale entries skipped lazily

    def assign(self, name: str, score: int) -> None:
        self.scores[name] = score
        heapq.heappush(self.heap, (-score, name))

    def remove(self, name: str) -> None:
        self.scores.pop(name, None)

    def max_score(self):
        while self.heap:
            s, name = self.heap[0]
            if self.scores.get(name) == -s:
                return [name, -s]
            heapq.heappop(self.heap)
        return None

    def get_score(self, name: str):
        return self.scores.get(name)
